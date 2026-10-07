# Doresther Tradings storefront

A polished, responsive Next.js ecommerce storefront with customer shopping and a private product-management workspace.

## Run locally

```bash
npm run dev
```

Visit `http://localhost:3000` for the customer storefront.

## Private admin workspace

The admin workspace is intentionally unlinked from the storefront and excluded from search indexing. Its route is `/atelier`.

Before using it, copy `.env.example` to `.env.local` and set the admin and Supabase values:

```bash
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=use-a-random-secret-with-at-least-32-characters
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_DB_URL=postgresql://postgres.PROJECT_REF:ROTATED_DATABASE_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

You can generate a suitable session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Create a Supabase project and run [`supabase/migrations/20261005220000_store.sql`](./supabase/migrations/20261005220000_store.sql) in its SQL Editor. Copy the project URL and anon key into the matching variables above. Keep the service-role key server-only; never prefix it with `NEXT_PUBLIC_` or expose it in client code. `SUPABASE_DB_URL` is only for direct PostgreSQL tools and migrations; the storefront uses the Supabase API keys above. Use the Session pooler connection URI for database tooling and keep it private. Enable email/password sign-in in Supabase Authentication. Restart the development server after editing `.env.local`.

On Vercel or another serverless host, add these variables in the project’s production environment settings. The admin password never reaches the browser. A successful admin sign-in creates an HMAC-signed, HTTP-only, SameSite-Strict session cookie that expires after eight hours; production cookies are HTTPS-only.

## Database-backed store

Products and prices are loaded from Supabase and edited through admin-only server routes. Customer accounts use Supabase email/password authentication. Orders are created for the signed-in customer and stored with server-calculated prices and totals; they remain `awaiting_payment` until the Mobile Money transfer is manually verified. No card details are collected or processed. The cart and wishlist remain in the current browser and are not synced between devices yet.

The API validates customer access tokens and only returns orders belonging to that customer. Database tables have row-level security enabled; privileged database access stays in server routes using `SUPABASE_SERVICE_ROLE_KEY`. Do not add public RLS policies for the service-only tables.

Before accepting real payments, connect a payment provider and implement verified payment callbacks and order status updates.

## Checks

```bash
npm run lint
npm run build
```
