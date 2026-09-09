import { getChatGPTUser } from "../../chatgpt-auth";
import { COVERAGE_MATRIX, FOUNDATION_COVERAGE, FOUNDATION_JURISDICTION, FOUNDATION_VERIFIED_AS_OF } from "../../../lib/coverage";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });

  return Response.json({
    jurisdiction: FOUNDATION_JURISDICTION,
    level: "Foundation",
    verifiedAsOf: FOUNDATION_VERIFIED_AS_OF,
    summary: FOUNDATION_COVERAGE,
    matrix: COVERAGE_MATRIX,
  });
}
