# ChatGuard site (flat layout for GitHub Pages)

All files sit at the repository ROOT — no subfolders. This is the layout that
uploads cleanly via GitHub's web "Add files" page.

  index.html  services.html  benefits.html  industries.html
  chatguard.css   chatguard.js
  favicon.png  og-image.png   README.md

The HTML references chatguard.css / chatguard.js directly (no assets/ folder).

## Deploy with GitHub Pages
1. Repo → Settings → Pages
2. Source: Deploy from a branch → branch: main → folder: / (root) → Save
3. Live at https://axxelo.github.io/chatguard-site/

## Custom domain chatguard.co
Settings → Pages → Custom domain → chatguard.co, then create the DNS records
GitHub shows (typically four A records on the apex to 185.199.108-111.153 and a
CNAME www → axxelo.github.io). This replaces the current Bitrix24 site; leave
monitoring.chatguard.co DNS untouched.

## Before publishing
- Dashboard figures and counterparty names (Meridian Cap, Northbridge) are placeholders.
- Re-verify the FCA stats (£52.8m, 1,266 firms) before relying on them.
- Footer disclaimer is a placeholder, not legal advice.
