import type { MediaType } from "@/types";

/**
 * Guarda no navegador (localStorage) o estado dos envios em partes.
 * Se a página fechar ou a internet cair, ao selecionar o MESMO arquivo de novo
 * no mesmo álbum, o envio continua de onde parou.
 */
export interface ResumeState {
  mediaId: string;
  key: string;
  uploadId: string;
  partSize: number;
  contentType: string;
  kind: MediaType;
  createdAt: number;
}

const PREFIX = "midia-upload:";
const MAX_AGE = 6 * 24 * 60 * 60 * 1000; // 6 dias

export function fingerprint(albumId: string, file: File) {
  return `${PREFIX}${albumId}:${file.name}:${file.size}:${file.lastModified}`;
}

export function loadResume(fp: string): ResumeState | null {
  try {
    const raw = localStorage.getItem(fp);
    if (!raw) return null;
    const state = JSON.parse(raw) as ResumeState;
    if (Date.now() - state.createdAt > MAX_AGE) {
      localStorage.removeItem(fp);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

export function saveResume(fp: string, state: ResumeState) {
  try {
    localStorage.setItem(fp, JSON.stringify(state));
  } catch {
    // armazenamento cheio/bloqueado: apenas não será retomável
  }
}

export function clearResume(fp: string) {
  try {
    localStorage.removeItem(fp);
  } catch {
    // ignore
  }
}
