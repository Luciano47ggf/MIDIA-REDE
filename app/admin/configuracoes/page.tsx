import { Info } from "lucide-react";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { requireTeamUser } from "@/lib/auth";
import { siteConfig } from "@/lib/config";
import { appUrl } from "@/lib/env";
import { cn } from "@/utils/cn";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const readOnlyInput = "h-12 w-full cursor-not-allowed rounded-xl border border-line bg-paper px-4 text-[15px] text-ink/80";

export default async function SettingsPage() {
  const profile = await requireTeamUser();
  const publicUrl = appUrl();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Configurações</h1>
      <p className="mt-1 text-muted">Identidade visual da plataforma e dados da sua conta.</p>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">Identidade visual</h2>
        <p className="mt-1 text-sm text-muted">
          Esses campos vêm de <code className="rounded bg-paper px-1.5 py-0.5 text-ink">lib/config.ts</code>. Para alterar, edite o arquivo e publique de novo —
          ainda não há uma tela para salvar isso no banco.
        </p>

        <div className="mt-6 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={siteConfig.logo} alt="Logo da igreja" className="h-16 w-16 rounded-2xl border border-line bg-paper object-contain p-2" />
          <div>
            <p className="text-sm text-muted">Logo</p>
            <p className="text-[15px] font-medium">{siteConfig.logo}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nome da igreja">
            <input readOnly value={siteConfig.churchName} className={readOnlyInput} />
          </Field>
          <Field label="Nome da plataforma">
            <input readOnly value={siteConfig.appName} className={readOnlyInput} />
          </Field>
          <Field label="Cor principal">
            <div className="flex h-12 items-center gap-3 rounded-xl border border-line bg-paper px-4">
              <span className="h-6 w-6 shrink-0 rounded-lg border border-line" style={{ background: siteConfig.colors.primary }} />
              <span className="text-[15px] font-medium uppercase text-ink/80">{siteConfig.colors.primary}</span>
            </div>
          </Field>
          <Field label="Cor secundária">
            <div className="flex h-12 items-center gap-3 rounded-xl border border-line bg-paper px-4">
              <span className="h-6 w-6 shrink-0 rounded-lg border border-line" style={{ background: siteConfig.colors.secondary }} />
              <span className="text-[15px] font-medium uppercase text-ink/80">{siteConfig.colors.secondary}</span>
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="URL pública da galeria">
            <input readOnly value={publicUrl} className={cn(readOnlyInput, "font-medium")} />
          </Field>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
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
