-- Applied manually in the Supabase SQL editor. NOT a Prisma migration:
-- it touches the auth schema, which Prisma does not manage, and must never
-- be moved into prisma/migrations/.
-- Deleting a Supabase auth user removes our mirroring public."User" row,
-- whose existing ON DELETE CASCADE then removes that user's Game. Without
-- this, deleting a user in the Supabase dashboard orphans their save.

-- Safe to re-run.

create or replace function public.handle_deleted_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
delete from public."User" where id = old.id;
return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;

create trigger on_auth_user_deleted
after delete on auth.users
for each row execute function public.handle_deleted_auth_user();
