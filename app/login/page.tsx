import type { Metadata } from "next";
import { BrandMark } from "@/components/layout/brand-mark";
import { LoginForm } from "@/components/admin/login-form";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/admin") ? next : "/admin";

  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <BrandMark className="mb-10" />
        <h1 className="font-display text-3xl font-semibold tracking-tight">Entrar no painel</h1>
        <p className="mt-2 text-muted">Acesso da equipe de mídia do {siteConfig.appName}.</p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
