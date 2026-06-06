# ChatGuard — client onboarding process

How a new regulated client goes from first call to live surveillance & desk intelligence.
A product of AXTRADE SAS. Typical end-to-end: **4–8 weeks**, depending on capture sources and legal review.

The guiding principle: **data never leaves the client's perimeter**. ChatGuard is deployed inside the client's own environment (private cloud or on-prem); AXTRADE configures and supports, but does not host the client's communications.

---

## Stage 0 — Discovery & scoping  *(2–4 days)*
- Identify in-scope channels (Bloomberg IB chat & persistent rooms, corporate email, voice, WhatsApp/Signal where permitted) and desks.
- Identify obligations: FCA SYSC/MAR, MiFID II, SEC 17a-4, FINRA 3110/17-18, GDPR.
- Agree success criteria (e.g. alert precision, time-to-investigation, desk metrics) and a pilot desk.
- **Owner:** ChatGuard solutions + client compliance/IT.

## Stage 1 — Commercial & legal  *(1–2 weeks, runs in parallel)*
- MSA + order form; pricing by seats/volume.
- **Data Processing Agreement** and data-residency choice (e.g. EU-West).
- **Lawful basis & employee notification**: monitoring must be proportionate and disclosed; involve works councils / employee reps where required. ChatGuard supplies a notification template; the client's legal team approves it. *(ChatGuard does not provide legal advice.)*
- Security questionnaire / vendor due-diligence.
- **Owner:** client legal & procurement; ChatGuard provides docs.

## Stage 2 — Environment provisioning  *(3–5 days)*
- Deploy ChatGuard inside the client perimeter (private cloud or on-prem).
- SSO / OIDC, role-based access (compliance admin, reviewer, desk head, read-only), IP allow-listing.
- Client-managed encryption keys; immutable (WORM) store with the agreed retention (5y+).
- **Owner:** client IT + ChatGuard deployment engineer.

## Stage 3 — Capture integration  *(3–10 days, the critical path)*
- **Bloomberg**: enable capture via Bloomberg's compliance/archival channel (e.g. **Bloomberg Vault**) with the appropriate entitlement — *not* the Desktop API. Feed routed to the ChatGuard ingestion endpoint.
- **Email**: journaling rule (Microsoft 365 / Google Workspace) to the ingestion endpoint.
- **Voice / other**: ASR transcripts and approved messaging channels normalised into the same record.
- Validate completeness and ordering against a known sample.
- **Owner:** client IT/messaging team + ChatGuard.

## Stage 4 — Configuration  *(2–4 days)*
- Load policy & **typology rules** (market abuse, information barriers, off-channel comms, inducements, conduct) and client-specific keyword/lexicon lists.
- Map counterparties to the client CRM for resolution; set desks, books and asset classes.
- Configure alert routing, severities and review workflows.
- **Owner:** ChatGuard + client compliance.

## Stage 5 — Backfill & parallel pilot  *(1–2 weeks)*
- Backfill historical archive for the pilot desk; run ChatGuard **in parallel** to any incumbent tool.
- Tune rules to reduce false positives; compare alert quality and desk metrics side by side.
- **Owner:** client compliance + ChatGuard (tuning).

## Stage 6 — Validation & sign-off  *(2–4 days)*
- Compliance reviews a sample of alerts and a generated **audit pack**; confirms precision and evidence trail.
- Security & DPO sign-off.
- **Owner:** client compliance, security, DPO.

## Stage 7 — Go-live & training  *(2–3 days)*
- Roll out to all in-scope desks; enable real-time alerting.
- Train reviewers (surveillance console, investigations, audit packs) and desk users (deal/flow views).
- **Owner:** ChatGuard enablement.

## Stage 8 — Run & review  *(ongoing)*
- Support SLAs; quarterly rule reviews against regulatory change.
- Periodic precision/recall reporting; on-demand audit packs for regulators.
- **Owner:** ChatGuard support + client compliance.

---

### What the client needs to provide
1. List of channels, desks and obligations.
2. Legal sign-off on monitoring notice + DPA.
3. Bloomberg Vault entitlement and email-journaling access.
4. SSO and network access into the deployment environment.
5. A named compliance owner for rule tuning and sign-off.

### What ChatGuard delivers
1. In-perimeter deployment + configuration.
2. Capture integration and validation.
3. Typology/keyword rule packs + tuning.
4. Desk Intelligence dashboards + Compliance console + alerting.
5. Training, support and ongoing rule maintenance.
