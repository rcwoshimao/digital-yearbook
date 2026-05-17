# Setup Notes

Items to complete outside this repository:

- Create a Supabase project.
- Apply `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL editor or CLI.
- Confirm the `entry-images` storage bucket exists and remains private.
- Add local secrets in `.env.local` using `.env.example` as the template.
- Configure Supabase Auth providers, including email/password and any OAuth providers you want.
- Add the deployed app URL and local callback URL in Supabase Auth redirect settings.
- If exported PDFs do not include images, configure Supabase Storage CORS for your local and deployed app origins.
- Later, connect the GitHub repository to Cloudflare Pages and add the same environment variables there.
- Later, replace the placeholder API routes in `src/app/api` with production handlers if you want a public API surface in addition to Server Actions.
- Later, add Cloudflare rate limiting for `POST /api/entries` after that API route is implemented.

Keep this file updated as setup requirements change.
