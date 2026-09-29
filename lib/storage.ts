import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
  type CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";
import { dispositionFilename } from "@/utils/filename";

/**
 * Integração com o Backblaze B2 (bucket privado, API compatível com S3).
 * Este arquivo roda SOMENTE no servidor. As chaves secretas nunca vão para o navegador:
 * o navegador recebe apenas URLs assinadas, que expiram.
 *
 * Como o bucket é PRIVADO, não existe URL pública fixa: toda leitura (thumbnail,
 * prévia, vídeo, download, avatar) precisa de uma URL assinada gerada na hora.
 * Por isso só gravamos a CHAVE do objeto no banco (media.storage_key, thumb_key,
 * preview_key, profiles.avatar_key) e assinamos a URL sempre que for exibir.
 */

const UPLOAD_URL_TTL = 60 * 60; // 1 hora — tempo para o navegador enviar o arquivo/parte
const DOWNLOAD_URL_TTL = 60 * 60; // 1 hora — "Baixar original" (consumida na hora, como redirect)
const GET_URL_TTL = 6 * 60 * 60; // 6 horas — exibição na galeria/lightbox/avatar (sessões de navegação longas)

/** Arquivos nunca mudam depois de enviados (nomes únicos), então o cache pode ser longo. */
export const IMMUTABLE_CACHE = "public, max-age=31536000, immutable";

let client: S3Client | null = null;

export function storageClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: serverEnv.b2Region,
      endpoint: serverEnv.b2Endpoint,
      credentials: {
        accessKeyId: serverEnv.b2KeyId,
        secretAccessKey: serverEnv.b2ApplicationKey,
      },
      // Evita que o SDK exija checksums extras nas URLs assinadas, o que faria
      // o upload pelo navegador falhar em provedores S3-compatíveis (B2 incluso).
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

const bucket = () => serverEnv.b2BucketName;

/** Upload direto e pequeno feito pelo próprio servidor (ex.: foto de perfil). Não usa URL assinada. */
export async function putObject(key: string, body: Buffer, contentType: string) {
  await storageClient().send(
    new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType, CacheControl: IMMUTABLE_CACHE }),
  );
}

export async function presignPut(key: string, contentType: string) {
  const url = await getSignedUrl(
    storageClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, CacheControl: IMMUTABLE_CACHE }),
    { expiresIn: UPLOAD_URL_TTL, signableHeaders: new Set(["content-type", "cache-control"]) },
  );
  // O navegador precisa enviar exatamente estes cabeçalhos.
  return { url, headers: { "Content-Type": contentType, "Cache-Control": IMMUTABLE_CACHE } };
}

/** URL temporária de LEITURA (bucket privado). Usada para thumbnail, prévia, vídeo e avatar. */
export async function presignGet(key: string, expiresIn: number = GET_URL_TTL): Promise<string> {
  return getSignedUrl(storageClient(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

export async function createMultipart(key: string, contentType: string): Promise<string> {
  const res = await storageClient().send(
    new CreateMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      CacheControl: IMMUTABLE_CACHE,
    }),
  );
  if (!res.UploadId) throw new Error("O Backblaze B2 não retornou o identificador do envio.");
  return res.UploadId;
}

export async function presignPart(key: string, uploadId: string, partNumber: number): Promise<string> {
  return getSignedUrl(
    storageClient(),
    new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: partNumber }),
    { expiresIn: UPLOAD_URL_TTL },
  );
}

/** Lista as partes já enviadas (usado para retomar envios interrompidos). */
export async function listUploadedParts(key: string, uploadId: string) {
  const parts: { PartNumber: number; ETag: string; Size: number }[] = [];
  let marker: string | undefined;
  do {
    const res = await storageClient().send(
      new ListPartsCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumberMarker: marker }),
    );
    for (const p of res.Parts ?? []) {
      if (p.PartNumber && p.ETag) parts.push({ PartNumber: p.PartNumber, ETag: p.ETag, Size: p.Size ?? 0 });
    }
    marker = res.IsTruncated ? res.NextPartNumberMarker : undefined;
  } while (marker);
  return parts;
}

export async function completeMultipart(key: string, uploadId: string, parts: CompletedPart[]) {
  const sorted = [...parts].sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0));
  await storageClient().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sorted },
    }),
  );
}

export async function abortMultipart(key: string, uploadId: string) {
  await storageClient().send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId }));
}

export async function headObject(key: string): Promise<{ size: number; contentType?: string } | null> {
  try {
    const res = await storageClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return { size: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch (err) {
    const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw err;
  }
}

export async function deleteKeys(keys: string[]) {
  const list = keys.filter(Boolean);
  for (let i = 0; i < list.length; i += 1000) {
    const chunk = list.slice(i, i + 1000);
    await storageClient().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  }
}

/** Apaga todos os arquivos de uma "pasta" (ex.: albums/ID/). */
export async function deletePrefix(prefix: string) {
  let token: string | undefined;
  do {
    const res = await storageClient().send(
      new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix, ContinuationToken: token }),
    );
    const keys = (res.Contents ?? []).map((o) => o.Key).filter((k): k is string => Boolean(k));
    if (keys.length) await deleteKeys(keys);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
}

/** URL temporária que força o navegador a BAIXAR o arquivo original com o nome original. */
export async function presignDownload(key: string, filename: string): Promise<string> {
  const safe = dispositionFilename(filename);
  const disposition = `attachment; filename="${safe.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
  return getSignedUrl(
    storageClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: disposition }),
    { expiresIn: DOWNLOAD_URL_TTL },
  );
}
