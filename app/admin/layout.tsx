import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { UploadGuard } from "@/components/upload/upload-guard";
import { requireTeamUser } from "@/lib/auth";
import { presignGet } from "@/lib/storage";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda camada de proteção (a primeira é o proxy.ts).
  const profile = await requireTeamUser();
  // Bucket privado: a chave é o que fica salvo; a URL é assinada a cada carregamento.
  const avatarUrl = profile.avatar_key ? await presignGet(profile.avatar_key) : null;

  return (
    <div className="min-h-dvh bg-paper lg:pl-72">
      <AdminNav userName={profile.name ?? profile.email} userEmail={profile.email} avatarUrl={avatarUrl} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-10">{children}</main>
      <UploadGuard />
    </div>
  );
}
