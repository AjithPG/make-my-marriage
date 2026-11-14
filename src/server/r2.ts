import "server-only";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Env } from "./env";

/** Presigned upload URLs expire after 5 minutes (System Design §5). */
const UPLOAD_URL_TTL_SECONDS = 5 * 60;

let client: S3Client | undefined;

function r2(): S3Client {
  if (client) return client;
  const env = r2Env();
  client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true, // https://<account>.r2.cloudflarestorage.com/<bucket>/<key>
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    // Newer SDKs add CRC32 checksums by default; browsers can't compute them
    // for presigned PUTs, so only send checksums when an operation requires one.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export interface PresignedUpload {
  url: string;
  /** Headers the browser must send with the PUT, exactly as given. */
  headers: Record<string, string>;
  expiresAt: Date;
}

/** Presigned PUT locked to the content type and exact size. */
export async function presignPut(input: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<PresignedUpload> {
  const command = new PutObjectCommand({
    Bucket: r2Env().R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(r2(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
    signableHeaders: new Set(["content-type", "content-length"]),
  });
  return {
    url,
    headers: { "Content-Type": input.contentType },
    expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000),
  };
}

/** Deletes every object under `prefix` in batches of up to 1,000 keys. Returns the count. */
export async function deletePrefix(prefix: string): Promise<number> {
  if (!prefix.endsWith("/")) {
    throw new Error(
      `deletePrefix expects a folder prefix ending in "/": ${prefix}`,
    );
  }
  const bucket = r2Env().R2_BUCKET;
  let deleted = 0;
  let continuationToken: string | undefined;

  do {
    const page = await r2().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      }),
    );
    const objects = (page.Contents ?? []).flatMap((o) =>
      o.Key ? [{ Key: o.Key }] : [],
    );
    if (objects.length > 0) {
      await r2().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects, Quiet: true },
        }),
      );
      deleted += objects.length;
    }
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return deleted;
}

/** Public URL for a processed object under media/ on the media domain. */
export function publicUrl(key: string): string {
  return `${r2Env().R2_PUBLIC_URL}/${key}`;
}
