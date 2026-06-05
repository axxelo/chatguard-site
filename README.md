# ChatGuard site (flat layout)

All files sit at the repository ROOT — no subfolders — so it uploads cleanly via
GitHub's web "Add files" page and serves directly with GitHub Pages.

  index.html  services.html  benefits.html  industries.html  404.html
  chatguard.css   chatguard.js
  favicon.png  og-image.png   README.md

The HTML references chatguard.css / chatguard.js directly (no assets/ folder).

## What's in this version
- Custom SVG brand logo (shield + chat bubble, in the two brand colours), in nav + footer.
- Working mobile menu (hamburger) under 880px.
- Contact form on the home page. It has NO backend: on submit it opens the
  visitor's email client pre-filled to info@chatguard.co. To collect submissions
  automatically instead, point the form at a service like Formspree or use
  Netlify Forms (add name="" attributes + the provider's action/attributes).
- Custom 404 page (GitHub Pages serves 404.html for unknown URLs automatically).
- SEO: per-page <title>/description, canonical links, Open Graph + Twitter tags,
  favicon, and Organization JSON-LD structured data on the home page.
- Accessibility: skip-to-content link, visible focus rings, and full
  prefers-reduced-motion support.
- Light/dark theme toggle (persisted in localStorage).

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
- Swap the drawn logo for a real brand file whenever you have one.
