# Manual SQL

Files in this directory are applied by hand, in the Supabase SQL editor — they are NOT Prisma migrations and must never be moved into `prisma/migrations/`. Prisma never sees or tracks anything here.

Each file is written to be safe to re-run (`create or replace`, `drop ... if exists`, and similar idempotent patterns). Number files in the order they were applied (`0001_...`, `0002_...`, ...) so the apply order stays unambiguous.

A new Supabase project needs every file here applied, in order, before the app will behave correctly — nothing in this directory runs automatically.
