// Repositories translate their storage-specific duplicate errors (Prisma's
// P2002) into this class, so code above the seam never depends on Prisma.
export class GameAlreadyExistsError extends Error {
  constructor() {
    super("This user already has a saved game.");
    this.name = "GameAlreadyExistsError";
  }
}
