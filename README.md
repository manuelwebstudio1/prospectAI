# ProspectAI

**Find Businesses. Build Websites. Win Clients.**

ProspectAI is an AI-powered client acquisition platform for freelance developers, web agencies and digital studios. It discovers businesses without professional websites, researches them, generates unofficial demo sites and helps you run approved outreach.

This repository is a production-oriented Next.js SaaS. Phases 1–8 are implemented: foundation, discovery, AI, demos, CRM, Moolre billing, admin, and QA.

## Stack

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase (Postgres, Auth, Storage, RLS)
- Grok as the default AI provider, OpenAI as an alternative
- Moolre for Ghana checkout, Stripe as an optional unused provider
- Resend for email

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase credentials the app runs a **labelled local development session**. You can register, complete onboarding and explore the dashboard. Preview metrics are sample layout data, not verified businesses.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
4. Run the SQL files in `supabase/migrations/` in order (`00001` through `00005`).
5. Enable email auth. Restart the Next.js server.
6. Set `profiles.platform_role` to `admin` or `super_admin` (or `PLATFORM_ADMIN_EMAILS`) before opening `/admin`.
7. Point the Moolre payment callback to `/api/billing/moolre/webhook`.

## Scripts

| Command         | Description           |
| --------------- | --------------------- |
| `npm run dev`   | Turbopack development |
| `npm run build` | Production build      |
| `npm run start` | Start the production app |
| `npm test`      | Vitest unit suite     |
| `npm run lint`  | ESLint                |

Progress, credentials and phase status are tracked in `PROJECT_PROGRESS.md`.
