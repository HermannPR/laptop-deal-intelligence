create extension if not exists pgcrypto;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  enabled boolean not null default true,
  stale_after interval not null default interval '12 hours',
  created_at timestamptz not null default now()
);

create table public.source_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  status text not null check (status in ('running', 'succeeded', 'failed')),
  listings_found integer not null default 0,
  canonical_products_updated integer not null default 0,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.canonical_products (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  brand text not null,
  family text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_configurations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.canonical_products(id),
  canonical_key text not null unique,
  model_number text,
  cpu_model text,
  gpu_model text,
  gpu_vram_gb integer,
  ram_gb integer,
  ram_type text,
  storage_gb integer,
  screen_size_inches numeric(4,1),
  resolution text,
  refresh_rate_hz integer,
  keyboard_layout text,
  normalization_confidence numeric(4,3) not null default 0.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  configuration_id uuid references public.product_configurations(id),
  external_id text not null,
  seller text,
  title text not null,
  product_url text not null,
  condition text not null default 'unknown' check (condition in ('new', 'refurbished', 'used', 'unknown')),
  stock_status text not null default 'unknown' check (stock_status in ('in_stock', 'low_stock', 'out_of_stock', 'unknown')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create table public.price_observations (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  price_mxn numeric(12,2) not null check (price_mxn > 0),
  shipping_mxn numeric(12,2) not null default 0 check (shipping_mxn >= 0),
  effective_price_mxn numeric(12,2) not null check (effective_price_mxn > 0),
  advertised_original_price_mxn numeric(12,2),
  stock_status text not null default 'unknown',
  raw_source jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now()
);

create index price_observations_listing_time_idx on public.price_observations (listing_id, observed_at desc);
create index price_observations_effective_price_idx on public.price_observations (effective_price_mxn);
create index listings_configuration_idx on public.listings (configuration_id);
create index configurations_gpu_price_filters_idx on public.product_configurations (gpu_model, ram_gb, storage_gb);

create or replace view public.listing_current
with (security_invoker = true)
as
select
  l.id,
  s.display_name as store_name,
  l.title,
  cp.brand,
  pc.model_number,
  pc.cpu_model,
  pc.gpu_model,
  pc.ram_gb,
  pc.storage_gb,
  concat_ws(' · ', case when pc.screen_size_inches is not null then pc.screen_size_inches || '″' end, pc.resolution) as screen_summary,
  latest.price_mxn as current_price_mxn,
  latest.shipping_mxn,
  latest.effective_price_mxn,
  l.product_url,
  latest.observed_at,
  l.stock_status,
  counts.observation_count
from public.listings l
join public.sources s on s.id = l.source_id
left join public.product_configurations pc on pc.id = l.configuration_id
left join public.canonical_products cp on cp.id = pc.product_id
join lateral (
  select po.price_mxn, po.shipping_mxn, po.effective_price_mxn, po.observed_at
  from public.price_observations po
  where po.listing_id = l.id
  order by po.observed_at desc
  limit 1
) latest on true
join lateral (
  select count(*)::integer as observation_count
  from public.price_observations po
  where po.listing_id = l.id
) counts on true;

alter table public.sources enable row level security;
alter table public.source_runs enable row level security;
alter table public.canonical_products enable row level security;
alter table public.product_configurations enable row level security;
alter table public.listings enable row level security;
alter table public.price_observations enable row level security;

create policy "public read sources" on public.sources for select using (true);
create policy "public read products" on public.canonical_products for select using (true);
create policy "public read configurations" on public.product_configurations for select using (true);
create policy "public read listings" on public.listings for select using (true);
create policy "public read observations" on public.price_observations for select using (true);

grant usage on schema public to anon, authenticated;
grant select on public.sources, public.canonical_products, public.product_configurations, public.listings, public.price_observations, public.listing_current to anon, authenticated;

