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
3. Disable public sign-ups in Supabase Auth. Add your pilot account in Authentication → Users and set or reset its password there. The app has no public registration flow.
4. Grant that account pilot access in the SQL Editor, using its real email:

```sql
insert into public.pilot_access(user_id)
select id from auth.users where email = 'YOUR_REAL_EMAIL'
on conflict do nothing;
```

5. Copy the project URL and publishable key into environment variables. Do not use a secret or service-role key. Keep the `evidence` bucket private.

For each invited member, create their account and add their ID to `pilot_access`. Circle invite codes alone do not grant pilot access. Removing a row from `pilot_access` stops subsequent app and storage access for that user.

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
| `OPENAI_API_KEY` | Optional, only when activating AI |
| `OPENAI_MODEL` | Optional; defaults to `gpt-4.1-mini` |

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

Nova and AI board reasoning activate only with an authorized OpenAI key. Browser dictation and speech playback depend on browser support. Realtime voice, conferencing participation, scheduled reminders and external calendar sync are not integrated. No simulated replies or fabricated community activity are supplied.
