import { ExternalLink, Plus, UploadCloud, type LucideIcon } from "lucide-react";
import Link from "next/link";

function QuickAction({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex h-16 items-center gap-3 rounded-2xl border border-line bg-surface px-5 font-medium text-ink shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
        <Icon className="h-5 w-5" />
      </span>
      {label}
    </Link>
  );
}

/** Bloco "Ações rápidas" do dashboard: criar álbum, enviar arquivos e ver a galeria pública. */
export function QuickActions({ uploadHref }: { uploadHref: string }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold tracking-tight">Ações rápidas</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <QuickAction href="/admin/albuns/novo" icon={Plus} label="Novo álbum" />
        <QuickAction href={uploadHref} icon={UploadCloud} label="Enviar arquivos" />
        <QuickAction href="/" icon={ExternalLink} label="Ver galeria pública" external />
      </div>
    </section>
  );
}
