"use client";

import { CloudUpload, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPT_ATTRIBUTE } from "@/lib/media-rules";
import { uploadManager, type Rejected } from "@/lib/upload/upload-manager";
import { extractZip } from "@/lib/upload/zip";
import { cn } from "@/utils/cn";
import { getExtension } from "@/utils/filename";

/** Área grande de arrastar e soltar + botão para selecionar arquivos. */
export function UploadDropzone({ albumId }: { albumId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rejected, setRejected] = useState<Rejected[]>([]);
  const [extracting, setExtracting] = useState<string[]>([]);
  const depth = useRef(0);

  async function addFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    const zips = files.filter((f) => getExtension(f.name) === "zip");
    const rest = files.filter((f) => getExtension(f.name) !== "zip");

    if (rest.length > 0) {
      setRejected((prev) => [...prev, ...uploadManager.add(albumId, rest)]);
    }

    for (const zip of zips) {
      setExtracting((prev) => [...prev, zip.name]);
      try {
        const { files: extracted, skippedCount } = await extractZip(zip);
        const newlyRejected: Rejected[] = [];
        if (extracted.length > 0) newlyRejected.push(...uploadManager.add(albumId, extracted));
        if (extracted.length === 0) {
          newlyRejected.push({ name: zip.name, reason: "Nenhuma foto ou vídeo compatível foi encontrada dentro do zip." });
        } else if (skippedCount > 0) {
          newlyRejected.push({
            name: zip.name,
            reason: `${skippedCount} arquivo${skippedCount > 1 ? "s" : ""} dentro do zip ${skippedCount > 1 ? "foram ignorados" : "foi ignorado"} (formato não aceito).`,
          });
        }
        if (newlyRejected.length > 0) setRejected((prev) => [...prev, ...newlyRejected]);
      } catch {
        setRejected((prev) => [...prev, { name: zip.name, reason: "Não foi possível abrir este arquivo zip." }]);
      } finally {
        setExtracting((prev) => prev.filter((n) => n !== zip.name));
      }
    }
  }

  return (
    <div>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current++;
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => {
          depth.current--;
          if (depth.current <= 0) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition sm:py-16",
          dragging ? "border-brand bg-brand/[0.06]" : "border-line bg-surface",
        )}
      >
        <span className={cn("grid h-16 w-16 place-items-center rounded-2xl transition", dragging ? "bg-brand text-white" : "bg-brand/10 text-brand")}>
          <CloudUpload className="h-8 w-8" />
        </span>
        <p className="mt-5 font-display text-xl font-semibold tracking-tight sm:text-2xl">Arraste suas fotos e vídeos aqui</p>
        <p className="mt-1 text-sm text-muted">JPG, PNG, WEBP, HEIC, MP4, MOV, WEBM ou um .zip com esses arquivos dentro. Enviados sem compressão.</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-6 inline-flex h-12 items-center rounded-xl bg-brand px-6 text-base font-medium text-white transition hover:brightness-110"
        >
          Selecionar arquivos
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {extracting.length > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-brand/[0.06] p-4 text-sm text-ink/80">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
          <span>
            Abrindo {extracting.length === 1 ? extracting[0] : `${extracting.length} arquivos zip`}… isso pode levar
            um tempo para arquivos grandes.
          </span>
        </div>
      )}

      {rejected.length > 0 && (
        <div className="mt-3 rounded-2xl bg-danger/[0.07] p-4 text-sm" role="alert">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-danger">
              {rejected.length === 1 ? "1 arquivo não foi adicionado:" : `${rejected.length} arquivos não foram adicionados:`}
            </p>
            <button type="button" onClick={() => setRejected([])} className="text-danger/70 underline">
              Fechar
            </button>
          </div>
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-ink/80">
            {rejected.map((r, i) => (
              <li key={`${r.name}-${i}`}>
                <span className="font-medium">{r.name}</span>: {r.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
