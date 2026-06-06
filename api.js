// ChatGuard extraction API as a Netlify Function (stateless, no dependencies).
// Routes:
//   GET  /api/health         -> { ok: true }
//   POST /api/extract        -> full extraction for { transcript }
// Stateful storage endpoints (ingest/batches) need a database and are not
// suitable for serverless; use the Express reference server (../backend) for those.

const { extract } = require("./engine");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async (event) => {
  // normalise path: strip the function prefix and optional /api
  let path = (event.path || "")
    .replace(/^\/\.netlify\/functions\/api/, "")
    .replace(/^\/api/, "");
  if (path === "") path = "/";
  const method = event.httpMethod;

  if (method === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };

  try {
    if (method === "GET" && (path === "/" || path === "/health")) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true, service: "chatguard-extract" }) };
    }
    if (method === "POST" && path === "/extract") {
      const body = JSON.parse(event.body || "{}");
      const text = body.transcript || body.text || "";
      if (!text.trim()) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Provide 'transcript' (string)." }) };
      return { statusCode: 200, headers: CORS, body: JSON.stringify(extract(text)) };
    }
    return { statusCode: 404, headers: CORS, body: JSON.stringify({ error: "Not found", path }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: String(e.message || e) }) };
  }
};
