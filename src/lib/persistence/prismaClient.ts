import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// This is the persistence seam referred to in CLAUDE.md ("Data layer" /
// "Persistence & save model"). Game logic must never be written here —
// this file only constructs and caches the shared Prisma Client instance.

// Uses DATABASE_URL (the transaction-mode pooler, port 6543) — the
// connection string the application uses at runtime. This is deliberately
// different from DIRECT_URL, which only the Prisma CLI uses for migrations.
const prismaAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Cached on globalThis so Next's development hot-reloading reuses one
// Prisma Client instance (and one connection pool) across module reloads,
// instead of opening a new pool every time this module is re-evaluated.
const globalForPrismaClient = globalThis as unknown as {
  cachedPrismaClient: PrismaClient | undefined;
};

export const prismaClient: PrismaClient =
  globalForPrismaClient.cachedPrismaClient ??
  new PrismaClient({ adapter: prismaAdapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrismaClient.cachedPrismaClient = prismaClient;
}
