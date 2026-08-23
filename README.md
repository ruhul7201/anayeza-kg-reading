# Amity Kindergarten Reading Class — anayeza.com/kg

Single-file static HTML site (no build step needed). Deployed via Vercel, connected to `anayeza.com`.

## Structure
- `kg/index.html` — the site itself. Deploying this repo to Vercel and visiting `anayeza.com/kg` should load it directly (Vercel serves `kg/index.html` at the `/kg` route automatically for static file-based projects).
- Root `/` is intentionally empty for now — reserved for a future WordPress install or landing page. This repo/Vercel project only owns `/kg` long-term.

## Deploy steps (for Claude Code / manual reference)
1. `git init`, commit, push to a new GitHub repo (e.g. `anayeza-kg-reading`).
2. Import the repo into Vercel (New Project → import from GitHub).
3. Framework preset: **Other** (static site, no build command needed).
4. In Vercel project settings → Domains, add `anayeza.com`.
5. At GoDaddy, update DNS for `anayeza.com` to point to Vercel (Vercel's UI shows the exact A record / nameserver values to use once the domain is added).
6. Confirm `anayeza.com/kg` loads the page after DNS propagates (can take up to a few hours).

## Notes
- This is a static prototype: any in-page "Admin Edit" changes only persist for the browser session, not permanently. That's expected for now.
- YouTube embeds require the real `https://anayeza.com` origin to work (they'll fail on `file://` or unrelated preview URLs).
