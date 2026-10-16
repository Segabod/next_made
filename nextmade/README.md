# NextMade for GitHub and Vercel

A standard Next.js App Router version of the private NextMade platform. The original ChatGPT-hosted Site is unchanged. This source removes Sites/Vinext runtime dependencies and replaces ChatGPT identity and Cloudflare bindings with Supabase Auth, PostgreSQL and private Storage.

## What is included

- The designed landing page and full workspace, both gated behind invited-user sign-in.
- Quests, dated commitments, check-ins, journals, evidence, progress points, challenges and weekly review.
- Original AI board roles, decision approval, meeting notes and optional Nova reasoning.
- Invitation-based circles, shared posts, membership checks and circle owner deletion.
- Supabase migration with row-level security, restricted grants, atomic workspace revisions and daily AI limits.
- Private file upload/download/delete, with a 4 MB evidence limit.
- Personal workspace JSON import into a fresh account, export, and deletion.
- First customers workspace: offer builder (Nova can draft a testable offer), a customer conversation tracker (contacted → paid) with Nova-drafted outreach, and an experiment log.
- Email reminders (due commitments, customer follow-ups, experiment deadlines, a nudge after 3 quiet days) and a Monday weekly progress letter with a short Nova note, sent through Resend by a daily Vercel Cron job (`/api/cron/daily`, 12:00 UTC). Members switch each on or off in Settings and can send themselves a preview.
- Ideas: an idea of the day and a daily feed of six ideas matched to the member's founder profile, saved ideas, and a full validation report per idea (pitch, who it's for, gap, why now, real pain quotes, competitors, reasons to build and not, demands, value ladder, napkin math, first steps, rating). Reports use live web search with cited sources when the AI provider supports it (Gemini, Claude or OpenAI keys; not the AI Gateway).
- Agents: 20 focused Nova runs across Decide, Offer, Build and Sell. Each output is saved to the member's files and linked to an idea or project; build plans can be turned into commitments.
- About me: founder profile (edge, skills, market, audience, stage, time, budget, goals) with profile strength, and a 10-question builder style quiz.
- Project hub for every quest: where you left off, next tasks, activity heatmap and streak, files, context, and a copyable briefing for any AI tool.
- My stuff: one library for projects, ideas, chats, research, founder fits, stress tests and agent outputs.
- Launch Sprint: a guided 7-day path from idea to business that creates a project and links each day to the right agent.
- Feedback widget, Build gallery (members share launched projects) and a builder toolkit of useful links.
- Vercel project configuration and GitHub Actions checks.

## Local development

Use Node 22.13 or newer. Copy `.env.example` to `.env.local` and set the Supabase URL, publishable key and `APP_ORIGIN=http://localhost:3000`.

```sh
npm install
npm run dev
```

No service-role key is needed or accepted by the application. The publishable key and the signed-in user's token are used together so database and file policies remain enforced. The access token is held in an HttpOnly, SameSite cookie and validated against the provider on each authenticated request. Sessions last up to one hour; this version deliberately requires sign-in again instead of retaining refresh tokens.

## Provision the private backend

1. Create a NEW Supabase project. Do not run the initial migration on a database with existing tables of the same names.
2. Run `supabase/001_nextmade.sql` once in its SQL Editor. It creates tables, RPCs, access rules and the private `evidence` bucket.
3. Run `supabase/002_open_signup.sql` once, then `supabase/003_feedback_gallery.sql` once (feedback and Build gallery tables). Anyone who signs up gets workspace access automatically as soon as they confirm their email.
4. In Supabase → Authentication → Sign In / Providers → Email: keep sign-ups **enabled** and **Confirm email** turned on.
5. In Supabase → Authentication → URL Configuration: set Site URL to your `APP_ORIGIN` and add `APP_ORIGIN/**` to Redirect URLs (for example `https://nextmadevercelgithub.vercel.app/**`).
6. In Supabase → Authentication → Emails → SMTP Settings: enable custom SMTP with Resend (host `smtp.resend.com`, port `465`, username `resend`, password = your Resend API key, sender = an address on your Resend-verified domain). Supabase's built-in mailer only delivers to project team members and is heavily rate limited, so this step is what lets any user receive confirmation and reset emails.
7. Copy the project URL and publishable key into environment variables. Do not use a secret or service-role key. Keep the `evidence` bucket private.

### Accounts

Visitors create an account at `/login` (name, email, password). Supabase emails a confirmation link; after confirming they sign in. "Forgot password?" emails a reset link that opens `/reset-password`. To return to invite-only access, drop the `nextmade_grant_on_confirm` trigger and grant access manually through `pilot_access`.

## GitHub publication

Create a PRIVATE repository, for example `nextmade`, under your account. The provided connector can upload to an existing repository but cannot create one in this session. Initialize it with a README so a default branch exists. Upload the source contents, including the `.github` workflow and `.env.example`, but excluding `node_modules`, `.next`, `.vercel` and real `.env` files.

The workflow installs dependencies, checks TypeScript, runs tests and builds. Repository visibility should stay private unless you intentionally change it.

## Vercel deployment

Import the GitHub repository into Vercel as a Next.js project. Use the repository root. Node 22 is recommended. Configuration is in `vercel.json`; the build command is `npm run build`.

Set these server variables for the relevant environment:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your Supabase HTTPS project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Its publishable (or legacy anon) key, not a service key |
| `APP_ORIGIN` | The exact HTTPS origin visitors will use, without a path |
| `RESEND_API_KEY` | Resend API key, for reminders and weekly letters |
| `EMAIL_FROM` | Sender on your Resend-verified domain, e.g. `NextMade <hello@mail.yourdomain.com>` |
| `CRON_SECRET` | Random string; Vercel Cron sends it so only the scheduler can trigger `/api/cron/daily` |
| `SUPABASE_SECRET_KEY` | Used ONLY by the scheduled reminder job to read members' due items and emails (`lib/admin.ts`). Member-facing routes never use it. `SUPABASE_SERVICE_ROLE_KEY` also works |
| `NOVA_PROVIDER` | Optional: `anthropic`, `gemini`, `gateway` or `openai`. When unset, the first configured key below is used, in that order |
| `NOVA_MODEL` | Optional model override for the chosen provider |
| `ANTHROPIC_API_KEY` | Claude (default `claude-haiku-4-5`) |
| `GEMINI_API_KEY` | Google AI Studio key (default `gemini-2.5-flash`; free tier available, note Google's free-tier data terms) |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key (default `anthropic/claude-haiku-4.5`) |
| `OPENAI_API_KEY` | OpenAI (default `gpt-4.1-mini`, or `OPENAI_MODEL`) |

The initial Vercel deployment can render the setup/sign-in screen without these values. It will not expose the landing page or saved workspace and is not a fully configured working deployment. After its final domain is assigned, set `APP_ORIGIN` to that domain and redeploy. Preview deployments need their own configured origin if login or mutation testing is required. Requests from an unexpected origin are rejected.

Preserve privacy: all substantive pages and APIs are gated by invited-account access. Also enable Vercel deployment protection for every environment you want to restrict at the hosting layer, if available on your plan. Do not publish the existing Site or make the GitHub repository public as part of this migration.

Future GitHub pushes can trigger deployments once the repository is linked to the Vercel project. Verify that the account used for commits is permitted in that Vercel project.

## Transfer existing personal records

On the original NextMade site, open Settings & privacy and export your workspace JSON. Download evidence files separately. On the new Vercel app, sign in and import the JSON in Settings before the first save in that workspace. The import validates the schema, uses revision zero, and will refuse to overwrite an existing saved workspace. It clears old file metadata so unavailable old storage objects do not appear as working downloads. Upload evidence files again. Shared circles and other members' posts are not part of personal export and must be recreated intentionally.

There is no automatic migration of live user records, identities or files. The two sites have separate databases and accounts.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

The standard Next.js production build and six unit tests passed in the preparation environment. Tests cover return-path protection, exact-origin checks, workspace schema rejection, progress calculations and weekly review. The prepared SQL has not been executed against a live Supabase project. Sign-in, RLS isolation, file access and account-to-account circles need live integration testing after provisioning. Browser UI testing and a fresh internet dependency install were not available in the preparation environment.

Suggested integration checks after configuration: sign in as two invited accounts; prove each cannot read the other's workspace or evidence; verify non-members cannot read circle posts; test concurrent saves returning a conflict; create/join/leave/delete circles; upload/download evidence; export/import a fresh workspace; verify deletion, logout and session expiry.

## Remaining integrations

Nova and AI board reasoning activate when any one supported AI provider key is set (see `lib/ai.ts`). Browser dictation and speech playback depend on browser support. Realtime voice, conferencing participation and external calendar sync are not integrated yet. No simulated replies or fabricated community activity are supplied.
