# Digital Yearbook

Full-stack graduation yearbook app built with Next.js, Tailwind CSS, and Supabase.

## Getting Started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add Supabase credentials.
3. Run the development server with `npm run dev`.
4. See `docs/cloudflare-deploy.md` before deploying to Cloudflare Workers.

## Current Build Step

The repository currently contains the basic app shell:

- Next.js App Router with TypeScript and Tailwind CSS
- Placeholder pages for landing, dashboard, write-entry, and profile routes
- Placeholder API route files matching `document.md`
- Supabase client helpers and an initial SQL migration draft

Feature logic is intentionally minimal until Supabase auth, database, and storage are configured.