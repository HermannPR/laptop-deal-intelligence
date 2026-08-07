create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.collector_credentials (
  singleton boolean primary key default true check (singleton),
  token_hash text not null,
  rotated_at timestamptz not null default now()
);

create or replace function public.ingest_collected_listings(
  p_token text,
  p_source_slug text,
  p_source_name text,
  p_listings jsonb
)
returns integer
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  expected_hash text;
  source_uuid uuid;
  run_uuid uuid;
  product_uuid uuid;
  configuration_uuid uuid;
  listing_uuid uuid;
  item jsonb;
  ingested integer := 0;
begin
  select token_hash into expected_hash
  from private.collector_credentials
  where singleton = true;

  if expected_hash is null
     or encode(digest(coalesce(p_token, ''), 'sha256'), 'hex') <> expected_hash then
    raise exception 'invalid collector credential' using errcode = '42501';
  end if;

  if jsonb_typeof(p_listings) <> 'array' then
    raise exception 'p_listings must be a JSON array' using errcode = '22023';
  end if;

  insert into public.sources (slug, display_name, enabled)
  values (p_source_slug, p_source_name, true)
  on conflict (slug) do update
    set display_name = excluded.display_name, enabled = true
  returning id into source_uuid;

  insert into public.source_runs (source_id, status, listings_found)
  values (source_uuid, 'running', jsonb_array_length(p_listings))
  returning id into run_uuid;

  for item in select value from jsonb_array_elements(p_listings)
  loop
    insert into public.canonical_products (canonical_key, brand, family)
    values (item->>'product_key', coalesce(item->>'brand', 'Unknown'), left(item->>'title', 160))
    on conflict (canonical_key) do update
      set brand = excluded.brand, family = excluded.family, updated_at = now()
    returning id into product_uuid;

    insert into public.product_configurations (
      product_id, canonical_key, model_number, cpu_model, gpu_model,
      ram_gb, storage_gb, screen_size_inches, resolution
    )
    values (
      product_uuid, item->>'configuration_key', item->>'model_number',
      item->>'cpu_model', item->>'gpu_model', nullif(item->>'ram_gb', '')::integer,
      nullif(item->>'storage_gb', '')::integer,
      nullif(item->>'screen_size_inches', '')::numeric, item->>'resolution'
    )
    on conflict (canonical_key) do update set
      model_number = excluded.model_number, cpu_model = excluded.cpu_model,
      gpu_model = excluded.gpu_model, ram_gb = excluded.ram_gb,
      storage_gb = excluded.storage_gb, screen_size_inches = excluded.screen_size_inches,
      resolution = excluded.resolution, updated_at = now()
    returning id into configuration_uuid;

    insert into public.listings (
      source_id, configuration_id, external_id, seller, title, product_url,
      condition, stock_status, last_seen_at
    )
    values (
      source_uuid, configuration_uuid, item->>'external_id', item->>'seller',
      item->>'title', item->>'product_url', coalesce(item->>'condition', 'unknown'),
      coalesce(item->>'stock_status', 'unknown'),
      coalesce((item->>'observed_at')::timestamptz, now())
    )
    on conflict (source_id, external_id) do update set
      configuration_id = excluded.configuration_id, seller = excluded.seller,
      title = excluded.title, product_url = excluded.product_url,
      condition = excluded.condition, stock_status = excluded.stock_status,
      last_seen_at = excluded.last_seen_at
    returning id into listing_uuid;

    insert into public.price_observations (
      listing_id, price_mxn, shipping_mxn, effective_price_mxn,
      stock_status, raw_source, observed_at
    )
    values (
      listing_uuid, (item->>'price_mxn')::numeric,
      coalesce((item->>'shipping_mxn')::numeric, 0),
      (item->>'effective_price_mxn')::numeric,
      coalesce(item->>'stock_status', 'unknown'),
      coalesce(item->'raw_source', '{}'::jsonb),
      coalesce((item->>'observed_at')::timestamptz, now())
    );
    ingested := ingested + 1;
  end loop;

  update public.source_runs
  set status = 'succeeded', finished_at = now(), canonical_products_updated = ingested
  where id = run_uuid;
  return ingested;
end;
$$;

revoke all on function public.ingest_collected_listings(text, text, text, jsonb) from public;
revoke all on function public.ingest_collected_listings(text, text, text, jsonb) from authenticated;
grant execute on function public.ingest_collected_listings(text, text, text, jsonb) to anon;
