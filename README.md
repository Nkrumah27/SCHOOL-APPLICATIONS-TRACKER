# Application Desk — Master's Application Tracker

A single-file React app for tracking master's degree applications: a school
board, per-school to-do lists, notes, an AI assistant (essays, SOPs,
interview prep, file uploads) per school, an AI school-discovery assistant
with live web search, and an applicant profile that feeds context to both
assistants.

## Files

- `App.jsx` — the entire app (components, styles, storage logic). Default
  export is the `App` component.

## Running it

This file was built for the Claude.ai Artifacts environment, where:

- `window.storage` (get/set/delete/list) provides per-user persistent
  key-value storage — this is how schools, profile, and chat history
  survive a reload. It is **not** a browser API; if you move this app
  outside Claude.ai you'll need to swap `useStoredState` in `App.jsx` for
  your own persistence (e.g. `localStorage`, or a backend + fetch).
- AI features call `https://api.anthropic.com/v1/messages` directly from
  the browser with no API key attached — inside Claude.ai this is proxied
  and authenticated automatically. Outside that environment, you'll need
  to route these calls through your own backend and attach a real API key
  (never ship a key in client-side code).
- Dependencies (`react`, `lucide-react`) are provided by the host
  environment's import map. To run this standalone (e.g. Vite/Next.js),
  install `react` and `lucide-react`, and adapt the two integration points
  above.

## Structure inside App.jsx

- `useStoredState` — persistence hook wrapping `window.storage`
- `SchoolForm` — add/edit a school (name, course, deadline, status, notes)
- `SchoolCard` / board grid — the main dashboard
- `SchoolDetail` — per-school view: to-do list, notes, AI assistant tabs
- `AssistantChat` — per-school AI assistant with file attachments
  (.txt/.md/.pdf/images)
- `DiscoverView` — general AI assistant with web search for finding programs
- `ProfileView` — applicant profile used as context for both assistants

## Data stored (per user, in window.storage)

- `schools` — array of school records with nested to-do lists
- `profile` — applicant profile fields
- `essay-chat:<schoolId>` — per-school assistant conversation
- `discover-chat` — school-discovery conversation
