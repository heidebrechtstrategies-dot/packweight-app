# Packweight

A shareable web app for hunters & hikers: type in a piece of gear, and it researches three
genuinely-lighter replacement options (low / middle / high tier) with real weights and prices,
then ranks your smartest upgrades by cost-per-ounce and draws the upgrade cost curve.

## How it works
- `public/index.html` — the whole front-end (the app people use).
- `server.js` — serves the page and exposes `POST /api/research`, which asks Claude to research
  the three lighter tiers for one item and returns them as JSON.
- The AI key lives only in the server's environment (`ANTHROPIC_API_KEY`) — never in the page,
  so it's safe to share the app publicly.

## Cost control
- Uses `claude-sonnet-5` by default (cheap; typically a fraction of a cent to a few cents per lookup).
- Set a **monthly spend limit in the Anthropic console** so it can never exceed your budget.
- To change the model, set the `PACKWEIGHT_MODEL` environment variable (e.g. `claude-haiku-4-5`
  for the cheapest, `claude-opus-5` for the highest quality).

## Deploy (Render)
1. Push this folder to a GitHub repo.
2. Render → New → Web Service → connect the repo.
   - Build command: `npm install`
   - Start command: `npm start`
3. Add an environment variable: `ANTHROPIC_API_KEY` = your key.
4. Deploy. Render gives you a public URL to share.

## Run locally
```
npm install
set ANTHROPIC_API_KEY=your-key   (PowerShell: $env:ANTHROPIC_API_KEY="your-key")
npm start
```
Then open http://localhost:3000
