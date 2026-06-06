# ChatGuard — reference extraction API

A runnable backend that exposes the ChatGuard chat-intelligence engine over HTTP.
This is the bridge between the in-browser demo and a production system: the same
extraction logic, behind real endpoints your apps can call. Storage is in-memory
(swap for a database in production). For the full production architecture and the
Bloomberg capture path, see `../BACKEND-INTEGRATION.md`.

## Run it
```bash
cd backend
npm install
npm start          # http://localhost:8787
npm test           # smoke test (no server needed)
```
Requires Node 18+.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET  | `/health` | liveness check |
| POST | `/api/extract` | extract from a transcript, **no storage** (stateless) |
| POST | `/api/ingest` | extract **and store** a batch; returns id + stats |
| GET  | `/api/batches` | list ingested batches |
| GET  | `/api/batches/:id` | full result for one batch |
| GET  | `/api/stats` | aggregate stats across all batches |
| GET  | `/api/deals?status=&assetClass=` | reconstructed deals (RFQ→quote→fill) |
| GET  | `/api/events?type=RFQ|QUOTE|FILL` | classified trade events |
| GET  | `/api/flags?severity=high|medium|low` | compliance / conduct flags |
| GET  | `/api/followups` | open follow-ups |
| GET  | `/api/counterparties` | counterparty mentions + sentiment |
| GET  | `/api/users` | per-user activity (messages, flags, tone) |

## Examples
```bash
# stateless extraction
curl -s -X POST localhost:8787/api/extract \
  -H 'Content-Type: application/json' \
  -d '{"transcript":"09:41 JM: looking for 25m EUR/USD where are you?\n09:41 DESK: 1.0842/1.0844\n09:42 JM: done at 44 cp Meridian"}'

# ingest a batch, then query
curl -s -X POST localhost:8787/api/ingest \
  -H 'Content-Type: application/json' \
  -d '{"transcript":"...chat...","source":"bbg_ib","desk":"FX-RATES"}'

curl -s "localhost:8787/api/flags?severity=high"
curl -s "localhost:8787/api/deals?status=filled"
```

## Response shapes (key objects)
```jsonc
// deal
{ "id":"D1","inst":"EUR/USD","assetClass":"FX","size":"25m","notM":25,
  "side":"","cp":"Meridian Cap","status":"filled",
  "rfqTime":"09:41","quotePrice":"1.0842/1.0844","fillPrice":"1.0842/1.0844",
  "t2q":0,"t2f":60 }            // t2q/t2f = seconds RFQ->quote / RFQ->fill

// flag
{ "time":"09:44","sender":"RT","sev":"high","term":"off the record",
  "body":"keep this off the record between us" }

// event
{ "time":"09:41","sender":"JM","type":"RFQ","inst":"EUR/USD","assetClass":"FX",
  "size":"25m","side":"","price":"","cp":"" }
```

## From here to production
- Replace the in-memory store with an immutable, encrypted, indexed datastore
  (5y+ WORM retention) inside your perimeter.
- Put `POST /api/ingest` behind a queue fed by the Bloomberg Vault / email
  journaling / voice-ASR collectors (see `../BACKEND-INTEGRATION.md`).
- Add auth (API keys / OIDC), RBAC and request logging.
- Strengthen the engine with ML classifiers, finance NER and counterparty
  resolution against your CRM.
