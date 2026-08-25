import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Cormorant_Garamond({ variable: "--font-serif", subsets: ["latin"], weight: ["500", "600", "700"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;

  return {
    title: "The Judge — Nigerian Legal Intelligence",
    description: "Source-backed Nigerian legal research for practitioners and the public.",
    icons: {
      icon: "/brand/the-judge-app-icon.png",
      shortcut: "/brand/the-judge-app-icon.png",
      apple: "/brand/the-judge-app-icon.png",
    },
    openGraph: { title: "The Judge", description: "Source-backed answers. Plain-language clarity.", images: [image] },
    twitter: { card: "summary_large_image", title: "The Judge", description: "Nigerian legal intelligence", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>;
}
