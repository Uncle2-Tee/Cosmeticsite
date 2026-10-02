# Doresther Tradings storefront

A polished, responsive Next.js ecommerce storefront with customer shopping and a private product-management workspace.

## Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` for the customer storefront.

## Private admin workspace

The admin workspace is intentionally unlinked from the storefront and excluded from search indexing. Its route is `/atelier`.

Before using it, copy `.env.example` to `.env.local` and set both values:

```bash
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=use-a-random-secret-with-at-least-32-characters
```

You can generate a suitable session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

On Vercel or another serverless host, add the same variables in the project’s production environment settings. The password never reaches the browser. A successful sign-in creates an HMAC-signed, HTTP-only, SameSite-Strict session cookie that expires after eight hours; production cookies are HTTPS-only.

## Important deployment note

This implementation stores the demo catalogue in browser local storage, which keeps the project deployable without database credentials. For a shared live catalogue across all customers and administrators, connect the product and order operations to a managed serverless database (for example Vercel Postgres, Neon, or Supabase) before launch. Likewise, connect checkout to Stripe or another payment provider before accepting real payments.

## Checks

```bash
npm run lint
npm run build
```
