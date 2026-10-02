// Exercises the actual Express route with isolated account/provider fixtures.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const require = createRequire(new URL('../artifacts/api-server/package.json', import.meta.url));
const { build } = require('esbuild');
const express = require('express');
const temp = await mkdtemp(join(tmpdir(), 'aeo-inspection-qa-'));
const state = { owner: 'alice', url: 'https://example.com/', scope: true, connection: true, permitted: true, quota: false, calls: 0 };
globalThis.__crawlFixture = state;
const mocks = {
  '@workspace/db': `const s=globalThis.__crawlFixture; export const auditsTable={id:'auditId',userId:'userId',url:'url'}; export const googleConnectionsTable={userId:'connectionUser'}; export const db={ select(){ return {from(table){let cond; const result=()=>table===auditsTable ? (cond.some(c=>c.col==='userId'&&c.val===s.owner)&&cond.some(c=>c.col==='auditId'&&c.val===1)?[{url:s.url}]:[]) : s.connection?[{scope:s.scope?'https://www.googleapis.com/auth/webmasters.readonly':'',accessToken:'fixture'}]:[]; return {where(c){cond=Array.isArray(c)?c:[c];return {limit(){return Promise.resolve(result())},then(resolve){resolve(result())}}}} }}}};`,
  'drizzle-orm': `export const eq=(col,val)=>({col,val});export const and=(...items)=>items;`,
  '../middlewares/auth': `export const requireAuth=(req,res,next)=>{req.userId=req.headers['x-fixture-user'];if(!req.userId)return res.status(401).json({error:'Sign in required'});next()};`,
  '../middlewares/rateLimiters': `export const readRateLimiter=(req,res,next)=>next();`,
  '../lib/planUtils': `export const getUserPlan=async user=>user==='free'?'free':'pro';export const getStoredPlan=getUserPlan;export const planAtLeast=plan=>plan==='pro';`,
  '../lib/publicUrl': `export const canonicalBaseUrl=()=> 'http://localhost';`,
  '../lib/googleIntegration': `export const hasSearchConsoleScope=scope=>!!scope;export const getValidAccessToken=async()=> 'fixture';export const listSearchConsoleSites=async()=>globalThis.__crawlFixture.permitted?[{siteUrl:'sc-domain:example.com',permissionLevel:'siteOwner'}]:[];export const isGoogleConfigured=()=>true;export const getAuthUrl=()=>'';export const exchangeCode=()=>{};export const listGa4Properties=()=>{};export const fetchAiReferrals=()=>{};export const fetchSearchConsoleOpportunities=()=>{};export const fetchSearchConsolePagePerformance=()=>{};`,
};
const outfile = join(temp,'router.cjs');
await build({entryPoints:['artifacts/api-server/src/routes/google.ts'],bundle:true,platform:'node',format:'cjs',outfile,external:['express'],plugins:[{name:'fixtures',setup(b){b.onResolve({filter:/.*/},args=>mocks[args.path]?{path:args.path,namespace:'fixture'}:undefined);b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:mocks[args.path],loader:'js'}));}}]});
const compiled = await (await import('node:fs/promises')).readFile(outfile,'utf8');
// Resolve Express from the application's installed dependency tree.
const fixed = compiled.replace('require("express")', `require(${JSON.stringify(require.resolve('express'))})`);
await writeFile(outfile,fixed);
const app=express();app.use((req,_res,next)=>{req.log={warn(){},error(){}};next()});app.use('/api',require(outfile).default);
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const original=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 if(String(url).startsWith('https://searchconsole.googleapis.com')){state.calls++;if(state.quota)return new Response('{}',{status:429});return Response.json({inspectionResult:{indexStatusResult:{verdict:'PASS',coverageState:'Submitted and indexed',lastCrawlTime:'2026-05-01T00:00:00Z',indexingState:'INDEXING_ALLOWED'}}});}
 return original(url,options);
};
const check=async (user,query='auditId=1&siteUrl=sc-domain%3Aexample.com')=>fetch(`${base}/api/integrations/google/search-console/inspection?${query}`,{headers:user?{'x-fixture-user':user}:{}});
try {
 assert.equal((await check(null)).status,401);
 assert.equal((await check('free')).status,403);
 assert.equal((await check('bob')).status,404);assert.equal(state.calls,0);
 assert.equal((await check('alice','auditId=bad&siteUrl=sc-domain%3Aexample.com')).status,400);
 state.connection=false;assert.equal((await check('alice')).status,404);state.connection=true;
 state.scope=false;assert.equal((await check('alice')).status,409);state.scope=true;
 state.permitted=false;assert.equal((await check('alice')).status,403);state.permitted=true;
 state.url='https://outside.test/';assert.equal((await check('alice')).status,400);state.url='https://example.com/';
 const result=await check('alice');assert.equal(result.status,200);assert.equal(result.headers.get('cache-control'),'private, no-store');assert.equal((await result.json()).verdict,'PASS');assert.equal(state.calls,1);
 await check('alice');assert.equal(state.calls,1);
 state.permitted=false;assert.equal((await check('alice')).status,403);state.permitted=true;
 state.url='https://example.com/other';state.quota=true;const quota=await check('alice');assert.equal(quota.status,429);assert.equal(quota.headers.get('retry-after'),'60');
 console.log('PASS: actual route authentication, plan gate, owned-audit lookup, input validation, disconnected/reconnect states, property permission and membership, private response, caching, revoked permission and provider quota handling. Isolated fixtures only.');
} finally {globalThis.fetch=original;delete globalThis.__crawlFixture;await new Promise(resolve=>server.close(resolve));await rm(temp,{recursive:true,force:true});}
