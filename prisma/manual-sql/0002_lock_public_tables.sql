-- Applied manually in the Supabase SQL editor. NOT a Prisma migration.
-- Safe to re-run.
--
-- The app reaches these tables only through Prisma, which connects as the
-- table owner (postgres); owners bypass row-level security. RLS with no
-- policies therefore denies everything to Supabase's anon and authenticated
-- roles (the Data API's roles) while the app is unaffected. Defence in
-- depth alongside the Data API being disabled (Phase 14).

alter table public."User" enable row level security;
alter table public."Game" enable row level security;
alter table public."_prisma_migrations" enable row level security;

-- The delete trigger's function only needs to run as a trigger; nobody
-- should be able to call it directly.
revoke execute on function public.handle_deleted_auth_user()
  from public, anon, authenticated;