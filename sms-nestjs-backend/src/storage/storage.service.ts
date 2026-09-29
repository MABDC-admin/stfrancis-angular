import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { mkdir, readFile, rename, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStoredFileName,
  getStorageProvider,
  isAllowedStorageMimeType,
  normalizeStorageToken,
  toStoredFileContentUrl,
  toPublicStorageUrl,
} from './storage.util';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
};

type StoreFileInput = {
  file: UploadedFile;
  ownerType: string;
  ownerId?: string;
  category: string;
  uploadedById?: string;
  apiOrigin: string;
};

@Injectable()
export class StorageService {
  private readonly storageRoot =
    process.env.STORAGE_DIR || join(process.cwd(), 'storage');
  private r2Client: S3Client | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async storeFile(input: StoreFileInput) {
    if (!input.file) {
      throw new BadRequestException('Upload file is required.');
    }

    if (!isAllowedStorageMimeType(input.file.mimetype)) {
      await rm(input.file.path, { force: true });
      throw new BadRequestException('Only PDF and image uploads are allowed.');
    }

    const ownerType = normalizeStorageToken(input.ownerType);
    const category = normalizeStorageToken(input.category);
    const ownerId = input.ownerId ? normalizeStorageToken(input.ownerId) : 'shared';
    const id = randomUUID();
    const storedName = buildStoredFileName(input.file.originalname, id);
    const relativePath = join(ownerType, ownerId, category, storedName).replace(
      /\\/g,
      '/',
    );
    const provider = getStorageProvider();

    if (provider === 'r2') {
      await this.uploadToR2(input.file, relativePath);
      await rm(input.file.path, { force: true });
    } else {
      const finalPath = join(this.storageRoot, relativePath);
      await mkdir(dirname(finalPath), { recursive: true });
      await rename(input.file.path, finalPath);
    }

    const record = await this.prisma.storedFile.create({
      data: {
        id,
        ownerType,
        ownerId: input.ownerId || null,
        category,
        originalName: input.file.originalname,
        storedName,
        mimeType: input.file.mimetype,
        size: input.file.size,
        relativePath,
        publicUrl:
          provider === 'r2'
            ? this.buildR2PublicUrl(input.apiOrigin, id, relativePath)
            : toPublicStorageUrl(input.apiOrigin, relativePath),
        uploadedById: input.uploadedById || null,
      },
    });

    await this.applyOwnerSideEffect(record);
    return record;
  }

  listFiles(filters: { ownerType?: string; ownerId?: string; category?: string }) {
    return this.prisma.storedFile.findMany({
      where: {
        ownerType: filters.ownerType
          ? normalizeStorageToken(filters.ownerType)
          : undefined,
        ownerId: filters.ownerId || undefined,
        category: filters.category
          ? normalizeStorageToken(filters.category)
          : undefined,
      },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async getFileContent(id: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('Stored file not found.');
    }

    if (this.getRecordStorageProvider(file) === 'r2') {
      const result = await this.getR2Client().send(
        new GetObjectCommand({
          Bucket: this.getR2Bucket(),
          Key: file.relativePath,
        }),
      );

      const body = result.Body;
      if (!body || typeof body.transformToByteArray !== 'function') {
        throw new NotFoundException('Stored file content not found.');
      }

      const bytes = await body.transformToByteArray();
      return {
        file,
        buffer: Buffer.from(bytes),
      };
    }

    return {
      file,
      buffer: await readFile(join(this.storageRoot, file.relativePath)),
    };
  }

  async deleteFile(id: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('Stored file not found.');
    }

    await this.prisma.storedFile.delete({ where: { id } });

    if (this.getRecordStorageProvider(file) === 'r2') {
      await this.getR2Client().send(
        new DeleteObjectCommand({
          Bucket: this.getR2Bucket(),
          Key: file.relativePath,
        }),
      );
    } else {
      await rm(join(this.storageRoot, file.relativePath), { force: true });
    }

    return { deleted: true };
  }

  private getRecordStorageProvider(file: {
    id: string;
    publicUrl?: string | null;
  }) {
    const publicUrl = file.publicUrl || '';
    return publicUrl.includes(`/storage/files/${file.id}/content`) ? 'r2' : 'local';
  }

  private buildR2PublicUrl(
    apiOrigin: string,
    fileId: string,
    relativePath: string,
  ) {
    const baseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, '')}/${relativePath.replace(/^\/+/, '')}`;
    }
    return toStoredFileContentUrl(apiOrigin, fileId);
  }

  private getR2Bucket() {
    const bucket = process.env.R2_BUCKET?.trim();
    if (!bucket) {
      throw new BadRequestException('R2_BUCKET is required when R2 storage is enabled.');
    }
    return bucket;
  }

  private getR2Client() {
    if (this.r2Client) {
      return this.r2Client;
    }

    const endpoint = process.env.R2_ENDPOINT?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const region = process.env.R2_REGION?.trim() || 'auto';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException(
        'R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are required when R2 storage is enabled.',
      );
    }

    this.r2Client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    return this.r2Client;
  }

  private async uploadToR2(file: UploadedFile, relativePath: string) {
    const body = await readFile(file.path);
    await this.getR2Client().send(
      new PutObjectCommand({
        Bucket: this.getR2Bucket(),
        Key: relativePath,
        Body: body,
        ContentType: file.mimetype,
      }),
    );
  }

  private async applyOwnerSideEffect(file: {
    id: string;
    publicUrl: string;
    ownerType: string;
    ownerId: string | null;
    category: string;
  }) {
    if (file.ownerType === 'staff' && file.category === 'avatar' && file.ownerId) {
      await this.prisma.user.update({
        where: { id: file.ownerId },
        data: { avatarUrl: file.publicUrl, avatarFileId: file.id },
      });
    }

    if (file.ownerType === 'student' && file.category === 'photo' && file.ownerId) {
      await this.prisma.student.update({
        where: { id: file.ownerId },
        data: { photoUrl: file.publicUrl, photoFileId: file.id },
      });
    }
  }
}
