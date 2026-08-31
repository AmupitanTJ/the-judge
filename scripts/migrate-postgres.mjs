import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL is required.");

const migration = await readFile(new URL("../postgres/0000_foundation.sql", import.meta.url), "utf8");
const statements = migration.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
const sql = neon(databaseUrl);

for (const statement of statements) await sql.query(statement);
console.log(`Applied ${statements.length} Postgres foundation statements.`);
