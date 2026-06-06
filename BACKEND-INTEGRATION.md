# ChatGuard — backend integration blueprint

How the in-browser demo engine becomes a production system wired to live
Bloomberg, email and voice. This is an architecture guide, not a finished
build; exact Bloomberg connectivity depends on your Bloomberg agreement and
entitlements.

## 1. The shape of the system

```
  SOURCES                INGESTION            INTELLIGENCE            SERVING
  ┌───────────┐          ┌──────────┐         ┌──────────────┐       ┌──────────────┐
  │ Bloomberg │ ──feed──▶│ Collector│──queue─▶│ Extraction    │──────▶│ Desk dashboard│
  │ IB chat   │          │ + normal-│         │ service       │       │ (amber)       │
  │ rooms     │          │ iser     │         │ (the engine)  │       ├──────────────┤
  ├───────────┤          │          │         │  • parse      │       │ Compliance/HR │
  │ Email     │ ─────────▶          │         │  • classify   │       │ console (green)│
  ├───────────┤          │          │         │  • enrich     │       ├──────────────┤
  │ Voice     │ ──ASR───▶│          │         │  • score/flag │──────▶│ Alerts        │
  └───────────┘          └──────────┘         └──────┬───────┘       │ (email/Slack) │
                                                     │               └──────────────┘
                                              ┌──────▼───────┐
                                              │ Encrypted     │  WORM, 5y+ retention,
                                              │ store + index │  inside YOUR perimeter
                                              └──────────────┘
```

Everything runs inside the client's own network or private-cloud tenancy — data
never leaves the perimeter.

## 2. Capture (the part that's Bloomberg-specific)

Bloomberg chat is not pulled from the Desktop/Server API the way market data is.
Communications are delivered through Bloomberg's compliance/archival channels —
typically **Bloomberg Vault** (message archiving / surveillance entitlement) or a
contractual compliance export. Practical implications:

- You need the appropriate **Bloomberg entitlement** for message capture; this is
  arranged through your Bloomberg account, not a public API key.
- Capture is usually delivered as a **near-real-time export / journaling stream**
  of IB chat and persistent rooms (and instant messages), with full headers
  (timestamp, participants, room).
- **Email**: journaling from Microsoft 365 / Exchange / Google Workspace.
- **Voice**: turret/PBX recordings passed through speech-to-text (ASR) to produce
  transcripts on the same timeline.

The collector normalises every source into one internal message schema:

```json
{ "id":"...", "ts":"2026-06-06T09:41:02Z", "channel":"bbg_ib",
  "room":"FX-RATES", "sender":"jmiller", "participants":["jmiller","desk"],
  "text":"looking for 25m EUR/USD spot where are you?", "raw":{...} }
```

## 3. Extraction service (productionising the demo engine)

The browser demo's `extract()` is the reference logic. In production it becomes a
service that consumes the message queue and writes structured records. The
heuristic rules (RFQ/quote/fill detection, instrument & size parsing, deal
reconstruction, follow-ups, sentiment, compliance flags) port directly, then are
strengthened with:

- **ML models** alongside the rules: a trained classifier for event types and a
  finance-tuned NER model for instruments, counterparties and amounts — far more
  robust than regex on messy shorthand.
- **Entity resolution**: map free-text counterparty mentions to your CRM /
  counterparty master so "Meridian", "Meridian Cap" and "MCAP" are one entity.
- **Deal stitching across messages and time** (the demo does a simple in-order
  version): correlate RFQ → quote → fill using room, participants, instrument and
  a time window.
- **Surveillance models** for market-abuse typologies (spoofing/layering language,
  collusion, information sharing) beyond keyword lists.

Output records: `events`, `deals`, `followups`, `flags`, plus per-user and
per-counterparty rollups — the same objects the demo exports as JSON/CSV.

## 4. Storage, retention & security

- **Immutable, encrypted store** (WORM semantics) with tamper-evident hashing and
  timestamping; 5+ year retention enforced automatically.
- **Search index** (e.g. OpenSearch/Elasticsearch) for sub-second retrieval and
  reconstruction of any thread.
- **Encryption** in transit and at rest; keys held by the client.
- **RBAC**: role-based access, per-user permissions, IP allow-listing; every
  reviewer action is itself logged.

## 5. Serving layer

- **Desk Intelligence API/dashboard** (amber): live RFQ ledger, deal lifecycle,
  counterparty analytics, open follow-ups, response-time metrics — exportable to
  BI / data warehouse.
- **Compliance & HR console** (green): alert queue with severity, case management,
  one-click regulator audit packs (FCA/FINRA), HR investigation views.
- **Alerting**: real-time push to email/Slack/Teams when a high-severity flag fires.

## 6. Suggested phased rollout

1. **Pilot (read-only):** ingest a historical Bloomberg export, run the extraction
   service in batch, validate output against known trades and known issues.
2. **Real-time capture:** connect the live journaling stream for one desk; tune
   alert rules and counterparty resolution.
3. **Compliance go-live:** enable retention, audit-pack generation and the alert
   queue for the compliance team.
4. **Desk intelligence go-live:** expose the desk dashboard and BI export.
5. **Scale out:** add remaining desks, email and voice; layer in ML models.

## 7. Legal & governance (do this in parallel from day one)

Communications monitoring must have a lawful basis and follow employment and
data-protection law (UK GDPR and equivalents): employee notice, proportionality,
data-minimisation, retention limits, and access controls. Engage legal/compliance
before live capture. ChatGuard provides tooling, not legal advice.
