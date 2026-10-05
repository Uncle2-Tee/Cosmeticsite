create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price > 0),
  size text not null,
  image text not null,
  description text not null,
  card_description text,
  how_to_use text,
  caution text,
  badge text,
  original_price numeric(10, 2),
  discount_percent numeric(5, 2),
  discount_label text,
  rating numeric(3, 2),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'momo' check (payment_method = 'momo'),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping numeric(10, 2) not null check (shipping >= 0),
  total numeric(10, 2) not null check (total = subtotal + shipping),
  customer_name text not null,
  customer_email text not null,
  phone text not null,
  shipping_address text not null,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist_items enable row level security;

insert into public.products
  (id, name, category, price, size, badge, description, image, card_description, how_to_use, caution, sort_order)
values
  ('velvet-glow', 'Velvet Glow Serum', 'Serums', 38, '30 ml', 'Best seller',
   'A cushiony vitamin C serum that leaves skin visibly lit from within.',
   'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85',
   'A cushiony vitamin C serum that leaves skin visibly lit from within.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 0),
  ('cloud-cream', 'Cloud Barrier Cream', 'Moisturizers', 42, '50 ml', 'New',
   'A whipped, ceramide-rich cream for a soft, replenished finish.',
   'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85',
   'A whipped, ceramide-rich cream for a soft, replenished finish.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 1),
  ('soft-focus', 'Soft Focus Tint', 'Makeup', 29, '30 ml', 'Editor’s pick',
   'A breathable skin tint with a naturally perfected, dewy finish.',
   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85',
   'A breathable skin tint with a naturally perfected, dewy finish.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 2),
  ('ritual-oil', 'Ritual Body Oil', 'Body care', 34, '100 ml', 'Limited',
   'Nourishing botanical oil with notes of neroli, fig leaf, and sandalwood.',
   'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85',
   'Nourishing botanical oil with notes of neroli, fig leaf, and sandalwood.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 3),
  ('clear-day', 'Clear Day Cleanser', 'Cleansers', 26, '150 ml', 'Daily essential',
   'A refreshing gel cleanser that lifts away the day without stripping skin.',
   'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=85',
   'A refreshing gel cleanser that lifts away the day without stripping skin.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 4),
  ('silk-lip', 'Silk Lip Veil', 'Makeup', 22, '4.5 ml', 'New',
   'A sheer, conditioning wash of rosewood color with a glossy veil.',
   'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=85',
   'A sheer, conditioning wash of rosewood color with a glossy veil.',
   '1. Open the package.' || E'\n' || '2. Apply/use the product as directed.' || E'\n' || '3. Store properly after use.',
   'Keep away from children.' || E'\n' || 'Do not use if damaged.' || E'\n' || 'Stop use if irritation occurs.', 5)
on conflict (id) do nothing;
