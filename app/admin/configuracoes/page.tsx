import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireTeamUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";

export default async function SettingsPage() {
  const profile = await requireTeamUser();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">Sua conta</h2>
        <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-[140px_1fr]">
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

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">Identidade visual</h2>
        <p className="mt-2 text-[15px] text-muted">
          Nome, logo e cores ficam no arquivo <code className="rounded bg-paper px-1.5 py-0.5 text-ink">lib/config.ts</code>. O logo é o arquivo{" "}
          <code className="rounded bg-paper px-1.5 py-0.5 text-ink">public/logo.svg</code>.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className="h-10 w-10 rounded-xl" style={{ background: siteConfig.colors.primary }} title="Cor principal" />
          <span className="h-10 w-10 rounded-xl" style={{ background: siteConfig.colors.secondary }} title="Cor secundária" />
          <span className="text-sm text-muted">
            {siteConfig.appName} ({siteConfig.churchName})
          </span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">Adicionar pessoas à equipe</h2>
        <p className="mt-2 text-[15px] text-muted">
          No Supabase, abra Authentication, depois Users, e clique em Add user. Informe o e-mail e uma senha provisória e marque Auto Confirm User. A pessoa já
          consegue entrar no painel.
        </p>
      </section>
    </div>
  );
}
