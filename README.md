# ChatGuard API on Netlify (live extraction endpoint)

A zero-dependency Netlify Function that exposes the extraction engine:

- `GET  /api/health`  → `{ ok: true }`
- `POST /api/extract` → full extraction for `{ "transcript": "..." }` (CORS-enabled)

Stateful storage endpoints (ingest/batches) need a database and stay on the
Express reference server (`../backend`); serverless is stateless.

## Deploy — option A: drag & drop the folder (fastest)
1. Zip this `netlify-api` folder.
2. Go to app.netlify.com → **Add new site → Deploy manually** → drop the zip.
3. Netlify reads `netlify.toml`, builds the function, and gives you a URL like
   `https://your-site.netlify.app`.

## Deploy — option B: from Git (auto-rebuilds)
1. Push this folder to a repo.
2. Netlify → **Add new site → Import from Git** → pick the repo.
3. Build settings are read from `netlify.toml` (publish `public`, functions `netlify/functions`).

## Deploy — option C: CLI
```bash
cd netlify-api
npx netlify-cli deploy --prod
```

## Test it
```bash
curl https://your-site.netlify.app/api/health
curl -X POST https://your-site.netlify.app/api/extract \
  -H 'Content-Type: application/json' \
  -d '{"transcript":"09:41 JM: looking 25m EUR/USD cp Meridian\n09:41 DESK: 1.0842/1.0844\n09:42 JM: done with Meridian Capital\n09:44 RT: keep this off the record"}'
```

## Connect the console
Open the console with the API URL as a query param:
`app.html?api=https://your-site.netlify.app`
The console will POST the sample transcript to the live API and render the
response (it falls back to the in-browser engine if the API is unreachable).
Send me the URL and I'll hard-wire it into `app.html`.
