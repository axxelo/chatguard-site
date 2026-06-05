# ChatGuard site (flat layout)

All files sit at the repository ROOT — no subfolders — so it uploads cleanly via
GitHub's web "Add files" page and serves directly with GitHub Pages.

  index.html  services.html  benefits.html  industries.html
  faq.html  about.html  404.html
  chatguard.css   chatguard.js
  favicon.png  og-image.png   README.md

## Pages
- index / services / benefits / industries — main site
- faq.html — FAQ (with FAQPage structured data)
- about.html — company / mission / offices
- 404.html — served automatically by GitHub Pages for unknown URLs

## Making the contact form actually receive messages (Formspree)
The home-page form works out of the box via a pre-filled email (mailto). To
collect submissions automatically instead:
1. Create a free form at formspree.io and copy its endpoint
   (looks like https://formspree.io/f/abcdwxyz).
2. In index.html, find:  <form id="contactForm" novalidate data-endpoint="">
3. Paste the endpoint between the quotes:
   data-endpoint="https://formspree.io/f/abcdwxyz"
4. Re-upload index.html. Submissions now arrive by email with a success message
   shown on the page; if the endpoint is left blank it falls back to mailto.

## Deploy / custom domain
- GitHub Pages: Settings → Pages → Deploy from a branch → main → / (root).
- Custom domain chatguard.co: apex A records to 185.199.108-111.153 and a
  CNAME www → axxelo.github.io, then set the domain in Settings → Pages and
  enable Enforce HTTPS.

## Before publishing
- Dashboard figures and counterparty names (Meridian Cap, Northbridge) are placeholders.
- Re-verify the FCA stats (£52.8m, 1,266 firms) before relying on them.
- Footer disclaimer is a placeholder, not legal advice.
- Swap the drawn logo for a real brand file whenever you have one.
