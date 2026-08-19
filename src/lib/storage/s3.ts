import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

function getBucketName(): string {
  if (!BUCKET_NAME) {
    throw new Error("Missing AWS_S3_BUCKET_NAME environment variable");
  }
  return BUCKET_NAME;
}

const s3Client = new S3Client({
  region: AWS_REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

/**
 * Builds a namespaced object key so uploads from different institutes/courses
 * never collide, without trusting the client-supplied file name for anything
 * but the extension.
 */
export function buildObjectKey(
  scope: { instituteId: string; courseId: string },
  originalFileName: string
): string {
  const extension = originalFileName.includes(".")
    ? originalFileName.slice(originalFileName.lastIndexOf("."))
    : "";
  return `institutes/${scope.instituteId}/courses/${scope.courseId}/${randomUUID()}${extension}`;
}

export async function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function createReadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteObject(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  });
  await s3Client.send(command);
}
