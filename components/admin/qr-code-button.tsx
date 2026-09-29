"use client";

import { Download, Loader2, QrCode } from "lucide-react";
import { useEffect, useState } from "react";
import { buttonClasses } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

/** Gera o QR Code do link público (para o telão) e permite baixar em PNG. */
export function QrCodeButton({ url, slug }: { url: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

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
      <button type="button" onClick={() => setOpen(true)} className={buttonClasses("secondary", "md")}>
        <QrCode className="h-4 w-4" />
        Gerar QR Code
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
        <a
          href={dataUrl ?? undefined}
          download={`qrcode-${slug}.png`}
          aria-disabled={!dataUrl}
          className={buttonClasses("primary", "lg", `mt-5 w-full ${dataUrl ? "" : "pointer-events-none opacity-50"}`)}
        >
          <Download className="h-4 w-4" />
          Baixar PNG
        </a>
      </Modal>
    </>
  );
}
