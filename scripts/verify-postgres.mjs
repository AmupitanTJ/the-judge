import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const sql = neon(databaseUrl);
const [result] = await sql`
  SELECT
    (SELECT COUNT(*)::integer FROM legal_documents) AS documents,
    (SELECT COUNT(*)::integer FROM legal_passages WHERE review_status = 'source_verified') AS verified_passages
`;

if (result.documents < 1 || result.verified_passages < 6) throw new Error("The verified legal corpus is incomplete.");
console.log(`Database verified: ${result.documents} document and ${result.verified_passages} verified passages.`);
