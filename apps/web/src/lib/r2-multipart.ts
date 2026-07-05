import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getR2Bucket, getR2Client } from "@/lib/r2";

export async function createMultipartUpload(key: string, contentType: string): Promise<string> {
  const result = await getR2Client().send(
    new CreateMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
    })
  );
  if (!result.UploadId) throw new Error("Could not start multipart upload");
  return result.UploadId;
}

export async function uploadMultipartPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer | Uint8Array
): Promise<string> {
  const result = await getR2Client().send(
    new UploadPartCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    })
  );
  if (!result.ETag) throw new Error(`Upload part ${partNumber} failed`);
  return result.ETag;
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<void> {
  await getR2Client().send(
    new CompleteMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts
          .slice()
          .sort((a, b) => a.partNumber - b.partNumber)
          .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
      },
    })
  );
}

export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  await getR2Client().send(
    new AbortMultipartUploadCommand({
      Bucket: getR2Bucket(),
      Key: key,
      UploadId: uploadId,
    })
  );
}
