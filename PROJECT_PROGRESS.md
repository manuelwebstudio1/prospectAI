# ProspectAI — project progress

Last updated: 24 Nov 2026

## Current phase

**Phase 8 — Quality assurance** (implemented in this pass)

## Completed features

### Phase 1 — Foundation

- Next.js 16 App Router, design system, marketing, auth, dashboard shell, schema

### Phase 2 — Business discovery

- Campaigns, Places/sample hunter, website inspector, leads, SSRF-safe analysis

### Phase 3 — AI intelligence

- Provider-independent AI layer with JSON extraction, schema validation and one retry
- Business Researcher, Website Architect, records-only fallback

### Phase 4 — Website generation

- Unofficial demos from architect briefs, public `/d/[demoId]` preview, management UI

### Phase 5 — Sales and CRM

- Sales assistant drafts; approve-then-send; Resend/WhatsApp fail closed; sample live send blocked

### Phase 6 — Billing

- Moolre hosted payment links; webhook/status fulfilment; return URL never treated as paid

### Phase 7 — Administration

- Separate `/admin` console with server-side role checks; suspend; plans; logs; workspace analytics/team lists

### Phase 8 — Quality assurance

- Vitest unit suite (`npm test`): SSRF URL guards, Moolre HMAC/amount parse, admin allowlist, outreach caps and sample-send block
- Functional HTTP smoke of marketing, dashboard, admin, and fail-closed APIs
- Security checks: unauthenticated 307 on `/dashboard` and `/admin`; webhook 503 without wallet secret; job APIs 401 unsigned
- Production `next build` succeeded
- Next.js 16 `middleware.ts` migrated to `src/proxy.ts`

## Features currently being developed

- None in this pass

## Features awaiting integration

- Stripe (optional, not used for Ghana checkout)
- Trigger.dev wrapping of job ticks
- Custom demo subdomains (documented as future)
- WhatsApp template messages for business-initiated conversations
- Email team invites (requires Supabase Auth)
- Live Moolre / Resend / Places / Grok credentials

## Outstanding bugs

- None recorded. First-hit timeouts on `/` and `/features` during cold compile recovered as 200.

## Required API credentials

| Variable | Used for | Status |
| --- | --- | --- |
| `OPENAI_API_KEY` | Optional HTTP copy adapter | Not configured |
| `XAI_API_ENABLED` / `XAI_API_KEY` | Optional xAI HTTP adapter (not Grok Bot) | Disabled / not required |
| MCP `/mcp` | Grok Bot custom connector | Server implemented; Bot not verified connected |
| `GOOGLE_PLACES_API_KEY` | Live discovery | Not configured |
| `NEXT_PUBLIC_SUPABASE_URL` | Persistence | Configured locally; app reads live Supabase |
| `RESEND_API_KEY` | Live email | Not configured |
| `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | Live WhatsApp | Not configured |
| `MOOLRE_API_USER` / `MOOLRE_PUBLIC_KEY` / `MOOLRE_ACCOUNT_NUMBER` | Ghana checkout | Not configured |
| `MOOLRE_WALLET_SECRET` | Webhook HMAC | Not configured |
| `PLATFORM_ADMIN_EMAILS` | Extra platform admins | Local labelled session email set |

## Database migrations

| File | Purpose | Applied |
| --- | --- | --- |
| `supabase/migrations/00001_init.sql` | Core schema | Applied |
| `supabase/migrations/00002_public_demo_read.sql` | Anonymous demo read | Applied |
| `supabase/migrations/00003_outreach_metadata.sql` | Outreach metadata | Applied |
| `supabase/migrations/00004_moolre_billing.sql` | Moolre billing columns | Applied |
| `supabase/migrations/00005_admin_console.sql` | Admin write policies | Applied |
| `supabase/migrations/00006_write_policies.sql` | Backend write RLS | Applied |
| `supabase/migrations/00007_autonomous_agent.sql` | Agent jobs | Applied |
| `supabase/migrations/00008_mcp_connector.sql` | Grok Bot MCP OAuth + logs | Applied |

## Testing status

- `npx tsc --noEmit` passed
- `npx vitest run` — 28 tests passed
- `npm run build` passed
- Public routes 200; protected 307 unsigned; dashboard/admin 200 signed in
- `POST /api/billing/moolre/webhook` 503 without secret; job ticks 401 unsigned; unknown `/d/...` 404
- Viewport click-through was not available in this environment

## Next implementation steps

1. Connect live credentials (Moolre, Places, Grok, Resend) when ready
2. Register a live account at `/register` after email confirmation is disabled for localhost
