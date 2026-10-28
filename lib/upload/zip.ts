/**
 * Abre um .zip inteiramente no navegador e devolve as fotos/vídeos aceitos
 * de dentro dele como File normais, prontos para entrar na fila de upload.
 * A descompactação roda em Web Worker (via fflate), então não trava a aba.
 */
import { unzip, type Unzipped } from "fflate";
import { ALLOWED_FORMATS } from "@/lib/media-rules";
import { getExtension } from "@/utils/filename";

export interface ZipExtractResult {
  files: File[];
  skippedCount: number;
}

function baseName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export async function extractZip(zipFile: File): Promise<ZipExtractResult> {
  const buf = new Uint8Array(await zipFile.arrayBuffer());
  let skippedCount = 0;

  const entries = await new Promise<Unzipped>((resolve, reject) => {
    unzip(
      buf,
      {
        filter: (info) => {
          if (info.name.endsWith("/")) return false; // pasta
          const name = baseName(info.name);
          // lixo comum de zip: metadados do macOS e arquivos ocultos
          if (!name || name.startsWith(".") || info.name.startsWith("__MACOSX/")) return false;
          const ok = Boolean(ALLOWED_FORMATS[getExtension(name)]);
          if (!ok) skippedCount++;
          return ok;
        },
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data);
      },
    );
  });

  const files = Object.entries(entries).map(([path, bytes]) => {
    const name = baseName(path);
    const format = ALLOWED_FORMATS[getExtension(name)];
    return new File([bytes], name, { type: format.mime });
  });

  return { files, skippedCount };
}
