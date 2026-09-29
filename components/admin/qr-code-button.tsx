"use client";

import { Check, Download, Link2, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useCopy } from "@/hooks/use-copy";

/** Gera o QR Code do link público (para o telão) e permite baixar em PNG ou copiar o link. */
export function QrCodeButton({ url, slug, iconOnly = false }: { url: string; slug: string; iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const { copied, copy } = useCopy();

  useEffect(() => {
    if (!open || dataUrl) return;
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toDataURL(url, { width: 1200, margin: 2, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } }))
      .then((d) => !cancelled && setDataUrl(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [open, url, dataUrl]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Gerar QR Code"
        title="QR Code"
        className={iconOnly ? "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition hover:border-ink/25" : buttonClasses("secondary", "md")}
      >
        <QrCode className="h-4 w-4" />
        {!iconOnly && "Gerar QR Code"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="QR Code do álbum">
        <div className="aspect-square w-full overflow-hidden rounded-2xl border border-line bg-white">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`QR Code para ${url}`} className="h-full w-full" />
          ) : (
            <div className="grid h-full place-items-center text-muted">
              {error ? "Não foi possível gerar o QR Code." : <Loader2 className="h-6 w-6 animate-spin" />}
            </div>
          )}
        </div>
        <p className="mt-3 break-all text-center text-sm text-muted">{url}</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => copy(url)} className={buttonClasses("secondary", "lg", "w-full")}>
            {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copiado" : "Copiar link"}
          </button>
          <a
            href={dataUrl ?? undefined}
            download={`qrcode-${slug}.png`}
            aria-disabled={!dataUrl}
            className={buttonClasses("primary", "lg", `w-full ${dataUrl ? "" : "pointer-events-none opacity-50"}`)}
          >
            <Download className="h-4 w-4" />
            Baixar PNG
          </a>
        </div>
      </Modal>
    </>
  );
}
