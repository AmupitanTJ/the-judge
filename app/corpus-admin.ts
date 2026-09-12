import { getChatGPTUser } from "./chatgpt-auth";

function configuredAdminEmails() {
  return new Set(
    (process.env.JUDGE_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireCorpusAdmin() {
  const user = await getChatGPTUser();
  if (!user) return null;

  const adminEmails = configuredAdminEmails();
  if (!adminEmails.has(user.email.toLowerCase())) return null;
  return user;
}

export function corpusAdminConfigured() {
  return configuredAdminEmails().size > 0;
}
