# Cloudflare Pages Deployment

Use this after the app works locally with Supabase.

## Cloudflare Pages

1. Push this repository to GitHub.
2. In Cloudflare Pages, create a new project from the GitHub repository.
3. Use the Next.js framework preset if available.
4. Set the build command to `npm run build`.
5. Set the output directory to `.next`.
6. Add these environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
7. Set `NEXT_PUBLIC_APP_URL` to the Cloudflare Pages URL or your custom domain.
8. Deploy.

## Supabase Redirect URLs

Add both local and production callback URLs in Supabase Auth settings:

- `http://localhost:3000/auth/callback`
- `https://your-cloudflare-domain.pages.dev/auth/callback`
- Your custom domain callback URL, if you add one later

## Optional Traffic Protection

In Cloudflare WAF or Rate Limiting, add a rule for entry creation traffic once the API route is implemented:

- Path: `/api/entries`
- Method: `POST`
- Suggested limit: `20 requests/minute/IP`

The current write flow uses Server Actions, so this rate-limit rule becomes useful after the API route is completed.
