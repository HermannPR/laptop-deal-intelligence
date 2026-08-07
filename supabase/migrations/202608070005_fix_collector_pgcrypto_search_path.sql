alter function public.ingest_collected_listings(text, text, text, jsonb)
  set search_path = public, private, extensions, pg_temp;
