import { CreateBucketCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvFile() {
  const envFile = process.env.ENV_FILE || '../.env.vps';
  const absolutePath = resolve(process.cwd(), envFile);
  if (!existsSync(absolutePath)) {
    return;
  }

  const content = readFileSync(absolutePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex < 0) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

loadEnvFile();

const endpoint = required('R2_ENDPOINT');
const bucket = required('R2_BUCKET');
const accessKeyId = required('R2_ACCESS_KEY_ID');
const secretAccessKey = required('R2_SECRET_ACCESS_KEY');
const region = process.env.R2_REGION?.trim() || 'auto';
const accountId =
  process.env.CLOUDFLARE_ACCOUNT_ID?.trim() ||
  endpoint.replace(/^https?:\/\//, '').split('.')[0];
const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN?.trim() || '';
const checkOnly = process.argv.includes('--check');

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function bucketExists() {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    const name = error?.name;
    if (status === 404 || name === 'NotFound' || name === 'NoSuchBucket') {
      return false;
    }
    throw error;
  }
}

async function cloudflareRequest(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cloudflareApiToken}`,
      ...(init.headers || {}),
    },
  });
  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(
      `Cloudflare API request failed (${response.status}): ${JSON.stringify(payload.errors || payload)}`,
    );
  }
  return payload.result;
}

async function bucketExistsViaCloudflare() {
  const result = await cloudflareRequest(`/accounts/${accountId}/r2/buckets`);
  return Array.isArray(result?.buckets)
    ? result.buckets.some((item) => item.name === bucket)
    : Array.isArray(result)
      ? result.some((item) => item.name === bucket)
      : false;
}

async function createBucketViaCloudflare() {
  await cloudflareRequest(`/accounts/${accountId}/r2/buckets`, {
    method: 'POST',
    body: JSON.stringify({ name: bucket }),
  });
}

async function resolveBucketExists() {
  if (!cloudflareApiToken) {
    return bucketExists();
  }

  try {
    return await bucketExistsViaCloudflare();
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('Authentication error') || message.includes('(403)')) {
      return bucketExists();
    }
    throw error;
  }
}

const exists = await resolveBucketExists();

if (checkOnly) {
  if (!exists) {
    console.error(`R2 bucket missing: ${bucket}`);
    process.exit(1);
  }

  console.log(`R2 bucket exists: ${bucket}`);
  process.exit(0);
}

if (!exists) {
  if (!cloudflareApiToken) {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created R2 bucket via S3 API: ${bucket}`);
  } else {
    try {
      await createBucketViaCloudflare();
      console.log(`Created R2 bucket via Cloudflare API: ${bucket}`);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('Authentication error') || message.includes('(403)')) {
        throw new Error(
          `Bucket ${bucket} is not visible to the Cloudflare control-plane token and could not be created. The S3 credentials are valid for object access, but bucket creation requires broader R2 account permissions.`,
        );
      }
      throw error;
    }
  }
} else {
  console.log(`R2 bucket already exists: ${bucket}`);
}
