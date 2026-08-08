# CV (source + rendered PDF)

- `cv_gregory_kyro.html` — the source (self-contained: embedded CSS, Google Fonts, inline SVG icons).
- `cv_gregory_kyro.pdf` — the rendered output (US Letter, 11 pages).

This folder is **version-controlled but not published**. GitHub Pages runs Jekyll (no `.nojekyll` in the repo), and Jekyll excludes any folder whose name starts with `_` from the built site — so nothing here is web-accessible. It's here purely for backup/versioning.

## Regenerate the PDF

Open `cv_gregory_kyro.html` in a browser and print to PDF (Cmd+P → Save as PDF), or via headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="cv_gregory_kyro.pdf" \
  "file://$(pwd)/cv_gregory_kyro.html"
```

## Publishing it (optional)

To make the CV live on the site, move it out of `_cv/` into a served folder (e.g. `cv/index.html` + `cv/cv_gregory_kyro.pdf`) so it resolves at `gregorykyro.com/cv/`, and optionally add a nav/contact link. Note: doing so exposes the emails, references, and personal details it contains.
