// Local disposable database only. No real credentials or provider calls.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const requireApi = createRequire(new URL("../artifacts/api-server/package.json", import.meta.url));
const requireDb = createRequire(new URL("../lib/db/package.json", import.meta.url));
const { build } = requireApi("esbuild");
const { Pool } = requireDb("pg");
const pool = new Pool({ host: "127.0.0.1", port: 15497, database: "postgres", user: "adminuser" });
const schemaPath = fileURLToPath(new URL("../lib/db/src/schema/seoTracking.ts", import.meta.url));
globalThis.seoTest = { pool, calls: [], fail: false, configured: true };
const mocks = {
  "@workspace/db": `import {drizzle} from 'drizzle-orm/node-postgres'; export * from ${JSON.stringify(schemaPath)}; export const db=drizzle(globalThis.seoTest.pool);`,
  "../middlewares/auth": `export const requireAuth=(req,res,next)=>{req.userId=req.headers['x-test-user']; if(!req.userId)return res.sendStatus(401);next();};`,
  "../middlewares/rateLimiters": `export const readRateLimiter=(req,res,next)=>next();`,
  "../lib/usageLimits": `export const currentYearMonth=()=> '2026-09';`,
  "../lib/planUtils": `export const getStoredPlan=async id=>id.startsWith('free')?'free':id.startsWith('agency')?'agency':'pro'; export const PLAN_LIMITS={free:{seoKeywordTargets:0,manualRankRefreshes:0},pro:{seoKeywordTargets:25,manualRankRefreshes:10},agency:{seoKeywordTargets:100,manualRankRefreshes:50}};`,
  "../lib/dataforseoRankTracker": `export class DataForSeoError extends Error {} export const collectGoogleRank=async()=>{throw Error('not tested');}; export const isDataForSeoConfigured=()=>globalThis.seoTest.configured; export const dataForSeoRequest=async(path,body)=>{globalThis.seoTest.calls.push({path,body});await new Promise(r=>setTimeout(r,20));if(globalThis.seoTest.fail)throw Error('fixture unavailable');return {tasks:[{status_code:20000,result:[{items:body[0].keywords.map(keyword=>({keyword,keyword_info:{search_volume:20,monthly_searches:[]},search_intent_info:{main_intent:'commercial'}}))}]}]};};`,
};
let server;
try {
  await pool.query(`CREATE TABLE seo_keyword_targets (id serial PRIMARY KEY,user_id text NOT NULL,domain text NOT NULL,keyword text NOT NULL,location_code integer DEFAULT 2840,location_name text DEFAULT 'United States',language_code text DEFAULT 'en',device text DEFAULT 'desktop',target_url text,active boolean DEFAULT true,created_at timestamp DEFAULT now(),updated_at timestamp DEFAULT now(),insights jsonb);
    CREATE TABLE seo_insight_usage(user_id text NOT NULL,target_id integer NOT NULL,month text NOT NULL,requested_at timestamp DEFAULT now(),PRIMARY KEY(user_id,target_id,month));
    CREATE TABLE seo_refresh_usage(id serial,user_id text,target_id integer,month text,requested_at timestamp);
    CREATE TABLE seo_rank_snapshots(target_id integer,position integer,result_present boolean,result_url text,competitors jsonb,provider_status text,collected_at timestamp);
    CREATE TABLE seo_rank_tasks(id serial,target_id integer,status text,created_at timestamp,checked_at timestamp);`);
  const seed = (user, domain, total) => pool.query("INSERT INTO seo_keyword_targets(user_id,domain,keyword) SELECT $1,$2,'keyword '||n FROM generate_series(1,$3::integer) n", [user, domain, total]);
  await seed("pro-owner", "example.com", 30);
  await seed("pro-other", "example.com", 2);
  await seed("agency-owner", "client.example", 110);
  const dir = await mkdtemp(join(tmpdir(), "aeo-insight-test-"));
  const outfile = join(dir, "router.mjs");
  await build({ entryPoints: [fileURLToPath(new URL("../artifacts/api-server/src/routes/seo.ts", import.meta.url))], outfile, bundle: true, platform: "node", format: "esm", packages: "external", plugins: [{ name: "fixtures", setup(b) {
    b.onResolve({ filter: /.*/ }, args => {
      if (mocks[args.path]) return { path: args.path, namespace: "fixture" };
      if (args.path === "express" || args.path.startsWith("drizzle-orm")) return { path: requireApi.resolve(args.path), external: true };
    });
    b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: mocks[args.path], loader: "ts", resolveDir: fileURLToPath(new URL("../artifacts/api-server", import.meta.url)) }));
  } }] });
  const express = requireApi("express");
  const app = express(); app.use(express.json()); app.use((req,res,next)=>{req.log={info(){},warn(){}};next();});
  app.use("/api", (await import(pathToFileURL(outfile).href)).default);
  server = app.listen(0, "127.0.0.1"); await new Promise(resolve=>server.once("listening",resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const post = async (user, domain) => { const response=await fetch(`${base}/seo/insights/refresh`,{method:"POST",headers:{"Content-Type":"application/json","x-test-user":user},body:JSON.stringify({domain})}); return {status:response.status,body:await response.json()}; };
  assert.equal((await post("free-owner","example.com")).status,403);
  assert.equal(globalThis.seoTest.calls.length,0);
  const pair=await Promise.all([post("pro-owner","example.com"),post("pro-owner","example.com")]);
  assert.equal(pair.reduce((n,r)=>n+r.body.updated,0),25);
  assert.equal(globalThis.seoTest.calls.length,1,"concurrent repeat must not spend twice");
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM seo_keyword_targets WHERE user_id='pro-other' AND insights IS NOT NULL")).rows[0].n,0,"other account isolated");
  await seed("pro-owner","second.example",1);
  assert.equal((await post("pro-owner","second.example")).body.updated,0,"account-wide cap across sites");
  const before=globalThis.seoTest.calls.length;
  await fetch(`${base}/seo/keywords?domain=example.com`,{headers:{"x-test-user":"pro-owner"}});
  assert.equal(globalThis.seoTest.calls.length,before,"GET must never purchase data");
  assert.equal((await post("agency-owner","client.example")).body.updated,100);
  globalThis.seoTest.fail=true;
  assert.equal((await post("pro-other","example.com")).body.failed,2);
  const failedCalls=globalThis.seoTest.calls.length;
  assert.equal((await post("pro-other","example.com")).body.updated,0);
  assert.equal(globalThis.seoTest.calls.length,failedCalls,"uncertain provider calls cannot be replayed");
  await seed("pro-cache","cached.example",1);
  await pool.query("UPDATE seo_keyword_targets SET insights=$1 WHERE user_id='pro-cache'",[JSON.stringify({collectedAt:new Date().toISOString(),searchVolume:5})]);
  assert.equal((await post("pro-cache","cached.example")).body.updated,0,"fresh data is cached");
  globalThis.seoTest.configured=false;
  assert.equal((await post("pro-cache","cached.example")).status,503);
  assert.equal(globalThis.seoTest.calls.every(call=>call.body[0].include_clickstream_data===false && call.body[0].include_serp_info===false),true);
  console.log("PASS: real PostgreSQL + real router: paid gates, ownership isolation, 25/100 account caps, concurrency reservations, cache, read-only GETs, failure retry protection, provider config and no premium options.");
} finally { if(server)await new Promise(resolve=>server.close(resolve)); await pool.end(); delete globalThis.seoTest; }
