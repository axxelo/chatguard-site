// ChatGuard — reference extraction API (Express).
// A runnable backend that exposes the extraction engine over HTTP.
// In production the same engine sits behind a queue fed by Bloomberg/email/voice
// capture (see ../BACKEND-INTEGRATION.md). Storage here is in-memory for the demo.

const express = require("express");
const { extract } = require("./engine");

const app = express();
app.use(express.json({ limit: "2mb" }));

// --- in-memory store of ingested batches (swap for a real DB in production) ---
const batches = [];
let seq = 1;

function aggregate() {
  const all = batches.map(b => b.result);
  const cat = k => all.flatMap(r => r[k] || []);
  const cps = {}, users = {};
  for (const r of all) {
    for (const c of r.counterparties) { cps[c.name] = cps[c.name] || { name: c.name, mentions: 0, sent: 0 }; cps[c.name].mentions += c.mentions; cps[c.name].sent += c.sent; }
    for (const u of r.byUser) { users[u.user] = users[u.user] || { user: u.user, msgs: 0, flags: 0, sent: 0 }; users[u.user].msgs += u.msgs; users[u.user].flags += u.flags; users[u.user].sent += u.sent; }
  }
  const deals = cat("deals"), flags = cat("flags");
  return {
    batches: batches.length,
    deals, events: cat("events"), flags, followups: cat("followups"),
    counterparties: Object.values(cps).sort((a, b) => b.mentions - a.mentions),
    byUser: Object.values(users).sort((a, b) => b.msgs - a.msgs),
    stats: {
      messages: all.reduce((s, r) => s + r.stats.messages, 0),
      deals: deals.length,
      filled: deals.filter(d => d.status === "filled").length,
      flags: flags.length,
      highFlags: flags.filter(f => f.sev === "high").length
    }
  };
}

// --- routes ---
app.get("/health", (_req, res) => res.json({ ok: true, batches: batches.length }));

// stateless: extract without storing
app.post("/api/extract", (req, res) => {
  const text = req.body.transcript || req.body.text || "";
  if (!text.trim()) return res.status(400).json({ error: "Provide 'transcript' (string)." });
  res.json(extract(text));
});

// stateful: extract + store, return id + stats
app.post("/api/ingest", (req, res) => {
  const text = req.body.transcript || req.body.text || "";
  if (!text.trim()) return res.status(400).json({ error: "Provide 'transcript' (string)." });
  const result = extract(text);
  const batch = { id: "B" + (seq++), ts: new Date().toISOString(),
    source: req.body.source || "manual", desk: req.body.desk || null, result };
  batches.push(batch);
  res.status(201).json({ id: batch.id, ts: batch.ts, stats: result.stats });
});

app.get("/api/batches", (_req, res) => res.json(batches.map(b => ({ id: b.id, ts: b.ts, source: b.source, desk: b.desk, stats: b.result.stats }))));
app.get("/api/batches/:id", (req, res) => {
  const b = batches.find(x => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: "batch not found" });
  res.json(b);
});

// aggregate views with optional filters
app.get("/api/stats", (_req, res) => res.json(aggregate().stats));
app.get("/api/deals", (req, res) => {
  let d = aggregate().deals;
  if (req.query.status) d = d.filter(x => x.status === req.query.status);
  if (req.query.assetClass) d = d.filter(x => x.assetClass === req.query.assetClass);
  res.json(d);
});
app.get("/api/events", (req, res) => {
  let e = aggregate().events;
  if (req.query.type) e = e.filter(x => x.type === String(req.query.type).toUpperCase());
  res.json(e);
});
app.get("/api/flags", (req, res) => {
  let f = aggregate().flags;
  if (req.query.severity) f = f.filter(x => x.sev === req.query.severity);
  res.json(f);
});
app.get("/api/followups", (_req, res) => res.json(aggregate().followups));
app.get("/api/counterparties", (_req, res) => res.json(aggregate().counterparties));
app.get("/api/users", (_req, res) => res.json(aggregate().byUser));

const PORT = process.env.PORT || 8787;
if (require.main === module) {
  app.listen(PORT, () => console.log(`ChatGuard API listening on http://localhost:${PORT}`));
}
module.exports = app;
