"use client";

import { useCallback, useState } from "react";

/** Copia um texto e indica "copiado" por alguns segundos. */
export function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    },
    [timeout],
  );
  return { copied, copy };
}
