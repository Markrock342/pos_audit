/**
 * PostgreSQL placeholder — configure when connecting via Prisma/Drizzle/pg.
 */
export const postgresConfig = {
  connectionString: process.env.DATABASE_URL ?? "",
};

export async function getPostgresClient() {
  // TODO: return database client (Prisma, Drizzle, etc.)
  throw new Error("PostgreSQL not configured. Set DATABASE_URL and implement getPostgresClient.");
}
