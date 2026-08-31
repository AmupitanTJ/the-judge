import { neon } from "@neondatabase/serverless";

let postgresClient: ReturnType<typeof neon> | null = null;

export function hasPostgres() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPostgres() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  if (!postgresClient) postgresClient = neon(databaseUrl);
  return postgresClient;
}
