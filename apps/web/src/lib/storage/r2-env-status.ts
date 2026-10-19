import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getR2Bucket, getR2Client, isR2Configured } from "@/lib/r2";

export type R2EnvStatus = {
  configured: boolean;
  bucket: string | null;
  publicUrlSet: boolean;
  credentialsOk: boolean | null;
  credentialsError: string | null;
};

export async function getR2EnvStatus(): Promise<R2EnvStatus> {
  const configured = isR2Configured();
  const bucket = configured ? getR2Bucket() : null;
  const publicUrlSet = Boolean(process.env.R2_PUBLIC_URL?.trim());

  if (!configured) {
    return {
      configured: false,
      bucket: null,
      publicUrlSet,
      credentialsOk: null,
      credentialsError: null,
    };
  }

  try {
    await getR2Client().send(new HeadBucketCommand({ Bucket: bucket! }));
    return {
      configured: true,
      bucket,
      publicUrlSet,
      credentialsOk: true,
      credentialsError: null,
    };
  } catch (err) {
    return {
      configured: true,
      bucket,
      publicUrlSet,
      credentialsOk: false,
      credentialsError: err instanceof Error ? err.message : "Could not access bucket",
    };
  }
}
