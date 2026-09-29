import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AlbumForm } from "@/components/admin/album-form";

export default function NewAlbumPage() {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD

  return (
    <div className="max-w-2xl">
      <Link href="/admin/albuns" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Álbuns
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Novo álbum</h1>
      <p className="mt-1 text-muted">Depois de criar, você já vai para a tela de envio das fotos e vídeos.</p>
      <div className="mt-8 rounded-2xl border border-line bg-surface p-5 sm:p-8">
        <AlbumForm
          submitLabel="Criar álbum e enviar arquivos"
          defaults={{ title: "", slug: "", event_date: today, description: "", status: "draft", visibility: "public", has_password: false }}
        />
      </div>
    </div>
  );
}
