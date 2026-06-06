// Smoke test: starts the app, hits the endpoints, asserts. Run: npm test
const app = require("./server");
const assert = require("assert");

const SAMPLE = `09:41 JM: looking for 25m EUR/USD spot where are you?
09:41 DESK: 1.0842 / 1.0844 can do 25 your side
09:42 JM: done at 44 thanks cp Meridian Cap
09:44 RT: keep this off the record between us
09:51 JM: ping me on whatsapp later`;

const server = app.listen(0, async () => {
  const base = `http://localhost:${server.address().port}`;
  const j = async (m, p, b) => {
    const r = await fetch(base + p, b ? { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) } : {});
    return { status: r.status, body: await r.json() };
  };
  try {
    assert.equal((await j("GET", "/health")).body.ok, true);
    const ing = await j("POST", "/api/ingest", { transcript: SAMPLE, source: "bbg_ib", desk: "FX-RATES" });
    assert.equal(ing.status, 201, "ingest 201");
    assert.equal(ing.body.stats.deals, 1, "1 deal");
    assert.equal(ing.body.stats.flags, 2, "2 flags");
    const deals = (await j("GET", "/api/deals")).body;
    assert.equal(deals[0].status, "filled", "deal filled");
    assert.equal(deals[0].t2f, 60, "time-to-fill 60s");
    const high = (await j("GET", "/api/flags?severity=high")).body;
    assert.equal(high.length, 1, "1 high flag");
    const empty = await j("POST", "/api/ingest", { transcript: "" });
    assert.equal(empty.status, 400, "empty -> 400");
    console.log("ALL TESTS PASSED ✓");
    server.close(); process.exit(0);
  } catch (e) {
    console.error("TEST FAILED:", e.message);
    server.close(); process.exit(1);
  }
});
