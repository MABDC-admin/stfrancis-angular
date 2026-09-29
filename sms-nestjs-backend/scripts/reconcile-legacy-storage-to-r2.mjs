import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import prismaPkg from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { access, readFile } from 'fs/promises';
import { join, resolve } from 'path';

const { PrismaClient } = prismaPkg;

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

function toContentUrl(origin, id) {
  return `${origin.replace(/\/+$/, '')}/storage/files/${id}/content`;
}

function isLegacyRecord(file) {
  return !String(file.publicUrl || '').includes(`/storage/files/${file.id}/content`);
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fetchRemoteFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) {
    return null;
  }

  return {
    buffer: bytes,
    contentType: response.headers.get('content-type') || undefined,
  };
}

loadEnvFile();

const apply = process.argv.includes('--apply');
const publicOrigin = required('PUBLIC_APP_ORIGIN');
const storageDir = process.env.STORAGE_DIR?.trim() || '/app/storage';
const bucket = required('R2_BUCKET');
const endpoint = required('R2_ENDPOINT');
const accessKeyId = required('R2_ACCESS_KEY_ID');
const secretAccessKey = required('R2_SECRET_ACCESS_KEY');
const region = process.env.R2_REGION?.trim() || 'auto';

const prisma = new PrismaClient();
const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const legacyFiles = await prisma.storedFile.findMany({
  orderBy: { uploadedAt: 'desc' },
});

const targets = legacyFiles.filter(isLegacyRecord);

const userRefs = await prisma.user.findMany({
  where: { avatarFileId: { in: targets.map((item) => item.id) } },
  select: { id: true, email: true, avatarFileId: true },
});
const studentRefs = await prisma.student.findMany({
  where: { photoFileId: { in: targets.map((item) => item.id) } },
  select: { id: true, firstName: true, lastName: true, photoFileId: true },
});

const activeUserRefByFileId = new Map(userRefs.map((item) => [item.avatarFileId, item]));
const activeStudentRefByFileId = new Map(
  studentRefs.map((item) => [item.photoFileId, item]),
);

const summary = {
  totalLegacy: targets.length,
  migrated: [],
  clearedBrokenActive: [],
  deletedStale: [],
  unchanged: [],
};

for (const file of targets) {
  const storagePath = join(storageDir, file.relativePath);
  const activeUserRef = activeUserRefByFileId.get(file.id);
  const activeStudentRef = activeStudentRefByFileId.get(file.id);
  const isActivelyReferenced = Boolean(activeUserRef || activeStudentRef);

  let source = null;
  if (await fileExists(storagePath)) {
    source = {
      buffer: await readFile(storagePath),
      contentType: file.mimeType,
      source: 'local-disk',
    };
  } else if (/^https?:\/\//i.test(file.publicUrl)) {
    const remote = await fetchRemoteFile(file.publicUrl);
    if (remote) {
      source = {
        ...remote,
        source: 'remote-url',
      };
    }
  }

  if (source) {
    const newPublicUrl = toContentUrl(publicOrigin, file.id);

    if (apply) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: file.relativePath,
          Body: source.buffer,
          ContentType: file.mimeType || source.contentType,
        }),
      );

      await prisma.storedFile.update({
        where: { id: file.id },
        data: { publicUrl: newPublicUrl },
      });

      if (file.ownerType === 'staff' && file.category === 'avatar' && file.ownerId) {
        await prisma.user.updateMany({
          where: { id: file.ownerId, avatarFileId: file.id },
          data: { avatarUrl: newPublicUrl, avatarFileId: file.id },
        });
      }

      if (file.ownerType === 'student' && file.category === 'photo' && file.ownerId) {
        await prisma.student.updateMany({
          where: { id: file.ownerId, photoFileId: file.id },
          data: { photoUrl: newPublicUrl, photoFileId: file.id },
        });
      }
    }

    summary.migrated.push({
      id: file.id,
      ownerType: file.ownerType,
      ownerId: file.ownerId,
      source: source.source,
      active: isActivelyReferenced,
      newPublicUrl,
    });
    continue;
  }

  if (isActivelyReferenced) {
    if (apply) {
      if (activeUserRef) {
        await prisma.user.update({
          where: { id: activeUserRef.id },
          data: { avatarUrl: null, avatarFileId: null },
        });
      }
      if (activeStudentRef) {
        await prisma.student.update({
          where: { id: activeStudentRef.id },
          data: { photoUrl: null, photoFileId: null },
        });
      }
      await prisma.storedFile.delete({ where: { id: file.id } });
    }

    summary.clearedBrokenActive.push({
      id: file.id,
      ownerType: file.ownerType,
      ownerId: file.ownerId,
      publicUrl: file.publicUrl,
      userEmail: activeUserRef?.email,
      studentName: activeStudentRef
        ? `${activeStudentRef.firstName} ${activeStudentRef.lastName}`
        : undefined,
    });
    continue;
  }

  if (apply) {
    await prisma.storedFile.delete({ where: { id: file.id } });
  }

  summary.deletedStale.push({
    id: file.id,
    ownerType: file.ownerType,
    ownerId: file.ownerId,
    publicUrl: file.publicUrl,
  });
}

console.log(JSON.stringify({ apply, publicOrigin, summary }, null, 2));
await prisma.$disconnect();
