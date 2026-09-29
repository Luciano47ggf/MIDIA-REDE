import { AbortedError, UploadError } from "./errors";

/**
 * Envia um arquivo (ou pedaço dele) direto para o R2 usando XMLHttpRequest,
 * que é o único jeito de acompanhar o progresso do envio no navegador.
 */
export function putWithProgress(
  url: string,
  body: Blob,
  headers: Record<string, string>,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal,
): Promise<{ etag: string | null }> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new AbortedError());
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(body.size);
        resolve({ etag: xhr.getResponseHeader("ETag") });
      } else if (xhr.status === 403) {
        reject(new UploadError("O Cloudflare R2 recusou o envio (link expirado ou CORS não configurado)."));
      } else {
        reject(new UploadError(`Erro no Cloudflare R2 (${xhr.status}).`));
      }
    };
    xhr.onerror = () =>
      reject(new UploadError("Falha de conexão com o Cloudflare R2. Verifique a internet ou a configuração de CORS."));
    xhr.ontimeout = () => reject(new UploadError("O envio demorou demais e foi interrompido."));
    xhr.onabort = () => reject(new AbortedError());

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}
