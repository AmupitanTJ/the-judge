import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { corpusAdminConfigured, requireCorpusAdmin } from "../../corpus-admin";
import CorpusConsole from "./corpus-console";
import "./styles.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Corpus Review — The Judge", robots: { index: false, follow: false } };

export default async function CorpusAdminPage() {
  const user = await requireCorpusAdmin();
  if (!user) redirect("/");
  return <main className="admin-page"><header><Link href="/"><Image src="/brand/the-judge-page-logo.png" width={56} height={56} alt="The Judge" priority /><span>THE JUDGE</span></Link><div><span>{user.email}</span><Link href="/">Return to research</Link></div></header>{corpusAdminConfigured() ? <CorpusConsole /> : null}</main>;
}
