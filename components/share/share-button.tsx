"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useCopy } from "@/hooks/use-copy";

interface ShareButtonProps {
  url: string;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  label?: string;
}

/** Compartilhar álbum: no celular usa o compartilhamento nativo; senão, copiar link ou WhatsApp. */
export function ShareButton({ url, title, variant = "secondary", size = "md", className, label = "Compartilhar álbum" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const { copied, copy } = useCopy();
  const text = `${title}: ${url}`;

  async function onClick() {
    const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text: title, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === "AbortError") return;
      }
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={onClick} className={buttonClasses(variant, size, className)}>
        <Share2 className="h-4 w-4" />
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Compartilhar álbum">
        <div className="space-y-2">
          <div className="mb-4 truncate rounded-xl bg-paper px-4 py-3 text-sm text-muted">{url}</div>
          <button type="button" onClick={() => copy(url)} className={buttonClasses("secondary", "lg", "w-full justify-start")}>
            {copied ? <Check className="h-5 w-5 text-success" /> : <Link2 className="h-5 w-5" />}
            {copied ? "Link copiado" : "Copiar link"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(text)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("secondary", "lg", "w-full justify-start")}
          >
            <MessageCircle className="h-5 w-5 text-[#1fa855]" />
            Enviar pelo WhatsApp
          </a>
        </div>
      </Modal>
    </>
  );
}
