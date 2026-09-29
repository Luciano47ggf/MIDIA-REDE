import { Info } from "lucide-react";
import { AvatarUpload } from "@/components/admin/avatar-upload";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireTeamUser } from "@/lib/auth";
import { presignGet } from "@/lib/storage";

export default async function SettingsPage() {
  const profile = await requireTeamUser();
  // Bucket privado: a chave é o que fica salvo; a URL é assinada a cada carregamento.
  const avatarUrl = profile.avatar_key ? await presignGet(profile.avatar_key) : null;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>
      <p className="mt-1 text-muted">Dados da sua conta.</p>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">Sua conta</h2>

        <div className="mt-5">
          <AvatarUpload name={profile.name ?? profile.email} avatarUrl={avatarUrl} />
        </div>

        <dl className="mt-8 grid gap-3 border-t border-line pt-6 text-[15px] sm:grid-cols-[140px_1fr]">
          <dt className="text-muted">Nome</dt>
          <dd>{profile.name ?? "—"}</dd>
          <dt className="text-muted">E-mail</dt>
          <dd className="break-all">{profile.email}</dd>
          <dt className="text-muted">Função</dt>
          <dd>{profile.role === "admin" ? "Administrador" : "Equipe de mídia"}</dd>
        </dl>
        <div className="mt-8 border-t border-line pt-6">
          <h3 className="font-medium">Trocar senha</h3>
          <ChangePasswordForm />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Info className="h-5 w-5 text-brand" />
          Adicionar pessoas à equipe
        </h2>
        <p className="mt-2 text-[15px] text-muted">
          No Supabase, abra Authentication, depois Users, e clique em Add user. Informe o e-mail e uma senha provisória e marque Auto Confirm User. A pessoa já
          consegue entrar no painel.
        </p>
      </section>
    </div>
  );
}
