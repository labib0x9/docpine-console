# Docpine Console

Next.js console for the Docpine labs API. Authenticate with GitHub, save a default repository, enqueue lab runs, and stream runner output over Server-Sent Events.

## Getting Started

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

- `NEXT_PUBLIC_API_BASE`: Docpine API base URL (default: `http://localhost:8080`)
- `NEXT_PUBLIC_SSE_BASE`: SSE base URL (default: `NEXT_PUBLIC_API_BASE`)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: optional Cloudflare Turnstile site key; the widget and run verification are disabled when empty

When Turnstile is configured, login submits a native POST form to `/v1/auth/login` with `cf-turnstile-response`. Starting a run sends the token in the `CF-Turnstile-Response` header.

## Architecture

- The console talks only to the Docpine HTTP API and SSE endpoint.
- The API authenticates users with a signed `session` cookie.
- The API enqueues lab runs in RabbitMQ; a separate worker executes tests in Docker.
- The worker publishes `status`, `output`, `result`, and `error` events through RabbitMQ; the API mirrors them to the browser as SSE.
- Run detail streams `status`, `output`, `result`, `error`, and `ping` events and closes the stream after terminal events.

## Pages

- `/`: dashboard with saved repo, labs, and recent runs
- `/login`: GitHub OAuth login
- `/labs`: lab catalog
- `/labs/[id]`: lab details and run creation
- `/runs`: run history
- `/runs/[runID]`: live run output and persisted result
- `/settings`: profile and saved repository

## Scripts

- `npm run dev`: start the development server
- `npm run build`: create a production build
- `npm run start`: serve the production build
- `npm run lint`: run `oxlint`
