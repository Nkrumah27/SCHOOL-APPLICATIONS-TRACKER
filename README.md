# Application Desk — Master's Application Tracker

A React app for tracking master's degree applications: a school board,
per-school to-do lists, notes, an AI assistant (essays, SOPs, interview prep,
file uploads) per school, an AI school-discovery assistant with live web
search, and an applicant profile that feeds context to both assistants.

This was originally built as a single-file Claude.ai Artifact and has been
adapted here into a standalone Vite + React project deployable on Vercel.

## Structure

- `index.html` — Vite entry HTML
- `src/main.jsx` — React root
- `src/App.jsx` — the entire app (components, styles, storage logic)
- `src/index.css` — Tailwind entry point
- `api/messages.js` — Vercel serverless function that proxies chat requests
  to the Anthropic API, attaching the API key server-side
- `vercel.json` — Vercel build/deploy configuration

## Local development

```bash
npm install
npm run dev
```

The app persists data (schools, profile, chat history) to the browser's
`localStorage` — no backend database is required.

## AI features & the Anthropic API key

The AI assistant panels call `POST /api/messages`, a serverless function that
forwards the request to `https://api.anthropic.com/v1/messages` using an
`ANTHROPIC_API_KEY` read from the server environment. The key is never sent
to or stored in the browser.

To run the AI features locally:

1. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY=sk-ant-...`.
2. Run the app with the Vercel CLI so the `/api` function is served locally:
   ```bash
   npm i -g vercel
   vercel dev
   ```
   (Plain `npm run dev` serves the frontend only — `/api/messages` won't
   resolve without either `vercel dev` or an equivalent local functions
   runtime.)

## Deploying to Vercel

1. Push this repo to GitHub (or your git provider of choice).
2. Import the repo in [Vercel](https://vercel.com/new). It's auto-detected as
   a Vite project (`vercel.json` pins the build command and output directory
   explicitly, so this works even without auto-detection).
3. In the project's **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key.
4. Deploy. The static site is served from `dist/`, and `/api/messages`
   deploys automatically as a serverless function alongside it.

## Data stored (per browser, in `localStorage`)

- `schools` — array of school records with nested to-do lists
- `profile` — applicant profile fields
- `essay-chat:<schoolId>` — per-school assistant conversation
- `discover-chat` — school-discovery conversation

Data is local to each browser/device — there's no account system or sync.
