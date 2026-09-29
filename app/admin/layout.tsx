import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { UploadGuard } from "@/components/upload/upload-guard";
import { requireTeamUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Segunda camada de proteção (a primeira é o proxy.ts).
  const profile = await requireTeamUser();

  return (
    <div className="min-h-dvh lg:pl-64">
      <AdminNav userName={profile.name ?? profile.email} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">{children}</main>
      <UploadGuard />
    </div>
  );
}
