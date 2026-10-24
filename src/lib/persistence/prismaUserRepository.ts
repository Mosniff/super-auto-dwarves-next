import { prismaClient } from "./prismaClient";
import type { UserRepository } from "./userRepository";

// The real UserRepository, backed by Prisma. Deliberately not unit-tested —
// this is pure Prisma wiring with no logic of its own.
//
// update: {} makes repeat calls no-ops, which is what makes ensureUserExists
// idempotent: the first call creates the row, every later call for the same
// id matches the existing row and changes nothing.
//
// We chose this application-side upsert over an AFTER INSERT trigger on
// auth.users because a failing trigger blocks every sign-up behind
// Supabase's opaque "Database error saving new user", while a failing
// upsert here fails visibly in our own code.
export const prismaUserRepository: UserRepository = {
  async ensureUserExists(userId) {
    await prismaClient.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });
  },
};
