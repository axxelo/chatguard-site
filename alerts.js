// ChatGuard — Slack alerting.
// Builds a Slack message from an extraction result and posts it to an
// Incoming Webhook. Set SLACK_WEBHOOK_URL in the environment to enable.
// Only HIGH-severity flags trigger an alert (configurable below).

const https = require("https");
const http = require("http");
const { URL } = require("url");

const ALERT_SEVERITIES = ["high"]; // extend with "medium" if desired

function buildSlackMessage(result, meta = {}) {
  const flags = (result.flags || []).filter(f => ALERT_SEVERITIES.includes(f.sev));
  if (!flags.length) return null;

  const ctx = [
    meta.batchId && `batch *${meta.batchId}*`,
    meta.source && `source \`${meta.source}\``,
    meta.desk && `desk \`${meta.desk}\``,
    `${flags.length} high-severity flag(s)`
  ].filter(Boolean).join("  ·  ");

  const blocks = [
    { type: "header", text: { type: "plain_text", text: "🚨 ChatGuard — high-severity alert", emoji: true } },
    { type: "context", elements: [{ type: "mrkdwn", text: ctx }] },
    { type: "divider" }
  ];
  for (const f of flags.slice(0, 10)) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn",
        text: `*${f.typology}*  ·  \`${f.sev}\`\n*${f.sender}* at ${f.time || "—"} — _"${(f.body || "").slice(0, 280)}"_\nTrigger: \`${f.term}\`` }
    });
  }
  blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: "ChatGuard · AXTRADE SAS — indicator for human review, not a determination of wrongdoing." }] });

  const text = `ChatGuard: ${flags.length} high-severity flag(s)` + (meta.batchId ? ` (batch ${meta.batchId})` : "");
  return { text, blocks };
}

function notifySlack(result, meta = {}, url = process.env.SLACK_WEBHOOK_URL) {
  return new Promise((resolve) => {
    const msg = buildSlackMessage(result, meta);
    if (!url || !msg) return resolve({ sent: false, reason: url ? "no high flags" : "no webhook configured" });
    const body = JSON.stringify(msg);
    let u;
    try { u = new URL(url); } catch { return resolve({ sent: false, reason: "bad url" }); }
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.request({
      hostname: u.hostname, path: u.pathname + u.search, port: u.port || 443, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    }, (res) => { res.on("data", () => {}); res.on("end", () => resolve({ sent: res.statusCode === 200, status: res.statusCode })); });
    req.on("error", (e) => resolve({ sent: false, reason: String(e.message) }));
    req.write(body); req.end();
  });
}

module.exports = { buildSlackMessage, notifySlack, ALERT_SEVERITIES };
