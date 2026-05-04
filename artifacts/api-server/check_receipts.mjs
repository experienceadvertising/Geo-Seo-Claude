import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const acct = await stripe.accounts.retrieve();
console.log("=== Account ===");
console.log("country:", acct.country, "email:", acct.email);
console.log("dashboard.display_name:", acct.settings?.dashboard?.display_name);
console.log("livemode key:", process.env.STRIPE_SECRET_KEY?.startsWith("sk_live") ? "LIVE" : "TEST");

console.log("\n=== Last 10 charges ===");
const charges = await stripe.charges.list({ limit: 10 });
if (charges.data.length === 0) console.log("(no charges)");
for (const ch of charges.data) {
  console.log(`- ${ch.id} $${(ch.amount/100).toFixed(2)} ${ch.currency.toUpperCase()} ${ch.status} paid=${ch.paid} live=${ch.livemode}`);
  console.log(`    created: ${new Date(ch.created*1000).toISOString()}`);
  console.log(`    customer: ${ch.customer}`);
  console.log(`    receipt_email: ${ch.receipt_email || "(NONE on charge)"}`);
  console.log(`    receipt_number: ${ch.receipt_number || "(NOT EMAILED)"}`);
  console.log(`    receipt_url: ${ch.receipt_url ? "exists" : "no"}`);
  console.log(`    description: ${ch.description}`);
}

console.log("\n=== Last 10 invoices ===");
const invs = await stripe.invoices.list({ limit: 10 });
if (invs.data.length === 0) console.log("(no invoices)");
for (const inv of invs.data) {
  console.log(`- ${inv.id} ${inv.status} $${(inv.amount_paid/100).toFixed(2)} customer=${inv.customer} live=${inv.livemode}`);
  console.log(`    customer_email: ${inv.customer_email || "(none)"}`);
  console.log(`    number: ${inv.number}`);
  console.log(`    hosted_invoice_url: ${inv.hosted_invoice_url ? "yes" : "no"}`);
}

console.log("\n=== Last 5 customers ===");
const cs = await stripe.customers.list({ limit: 5 });
if (cs.data.length === 0) console.log("(no customers)");
for (const c of cs.data) {
  console.log(`- ${c.id} email=${c.email || "(NONE)"} created=${new Date(c.created*1000).toISOString()}`);
}

console.log("\n=== Last 5 subscriptions ===");
const subs = await stripe.subscriptions.list({ limit: 5 });
for (const s of subs.data) {
  console.log(`- ${s.id} status=${s.status} customer=${s.customer} created=${new Date(s.created*1000).toISOString()}`);
}
