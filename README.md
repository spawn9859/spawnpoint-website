# Spawnpoint Website

A simple static starter to experiment with building a webpage and deploying via Cloudflare Pages.

Repo name suggestion (no spaces allowed on GitHub): `spawnpoint-website`

## What's inside

```
.
├─ public/                 # Cloudflare Pages output directory
│  ├─ index.html
│  ├─ 404.html
│  ├─ styles.css
│  ├─ script.js
│  ├─ _headers             # Security + caching headers
│  └─ _redirects           # Example redirects
├─ .editorconfig
├─ .gitattributes
└─ .gitignore
```

## Local development

No build step is required. You can open `public/index.html` directly in a browser, or run a simple local server to test routing/404:

- Python 3: `cd public && python -m http.server 8080`
- Node (if you have it): `npx serve public`

Then open http://localhost:8080

## Deploying to Cloudflare Pages

1) Create a GitHub repo named `spawnpoint-website` (or your preferred name).
2) Push this project to the repo.
3) In Cloudflare Dashboard:
   - Pages > Create a project > Connect to Git
   - Select your `spawnpoint-website` repo
   - Framework preset: None
   - Build command: (leave blank)
   - Output directory: `public`
4) Click Deploy. Every push to your default branch will trigger a new deployment.

## Custom domain (optional)

In your Pages project:
- Settings > Custom domains > Set up a custom domain
- If your DNS is on Cloudflare, Pages will configure records automatically.

## Next steps / ideas

- Edit `public/index.html`, `styles.css`, and `script.js` and push changes to see instant previews.
- Add images under `public/assets/` and reference them in HTML/CSS.
- Update `_headers` to tweak caching or security policies.
- Add `_redirects` rules as your URL structure evolves.
- Explore Pages Functions later by adding a top-level `functions/` directory for simple serverless logic.