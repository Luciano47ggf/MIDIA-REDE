/**
 * Lê dimensões/duração e gera, NO NAVEGADOR, uma miniatura e uma pré-visualização em JPEG.
 * O arquivo original não é alterado: ele é enviado exatamente como está.
 */
export interface MediaInfo {
  width: number | null;
  height: number | null;
  duration: number | null;
  thumb: Blob | null;
  preview: Blob | null;
}

const THUMB_SIZE = 480;
const PREVIEW_SIZE = 1600;
const TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

function drawResized(source: CanvasImageSource, w: number, h: number, max: number, quality: number): Promise<Blob | null> {
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // PNG transparente vira fundo branco na miniatura
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(source, 0, 0, cw, ch);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        canvas.width = 0;
        canvas.height = 0;
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function readPhoto(file: File): Promise<MediaInfo> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await withTimeout(img.decode());
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const preview = await drawResized(img, w, h, PREVIEW_SIZE, 0.85);
    const thumb = await drawResized(img, w, h, THUMB_SIZE, 0.8);
    return { width: w, height: h, duration: null, thumb, preview };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function readVideo(file: File): Promise<MediaInfo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.src = url;
  try {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("video"));
      }),
    );
    const duration = Number.isFinite(video.duration) ? video.duration : null;
    const w = video.videoWidth || null;
    const h = video.videoHeight || null;
    let thumb: Blob | null = null;
    let preview: Blob | null = null;
    if (w && h) {
      const target = duration ? Math.min(2, duration * 0.1) : 0;
      if (target > 0) {
        await withTimeout(
          new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
            video.currentTime = target;
          }),
          8000,
        ).catch(() => undefined);
      }
      preview = await drawResized(video, w, h, 1280, 0.82);
      thumb = await drawResized(video, w, h, THUMB_SIZE, 0.8);
    }
    return { width: w, height: h, duration, thumb, preview };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

/** Nunca lança erro: se não der para gerar a miniatura (ex.: codec não suportado), segue sem ela. */
export async function readMediaInfo(file: File, kind: "photo" | "video"): Promise<MediaInfo> {
  try {
    return kind === "photo" ? await readPhoto(file) : await readVideo(file);
  } catch {
    return { width: null, height: null, duration: null, thumb: null, preview: null };
  }
}
