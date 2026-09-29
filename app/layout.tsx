import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: { default: `${siteConfig.homeTitle} · ${siteConfig.churchName}`, template: `%s · ${siteConfig.appName}` },
  description: siteConfig.homeSubtitle,
  icons: { icon: siteConfig.logo },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f5f7",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandVars = {
    "--brand": siteConfig.colors.primary,
    "--accent": siteConfig.colors.secondary,
  } as CSSProperties;

  return (
    <html lang="pt-BR" style={brandVars} className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
