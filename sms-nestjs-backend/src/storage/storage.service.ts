import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, rename, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import {
  buildStoredFileName,
  isAllowedStorageMimeType,
  normalizeStorageToken,
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
    const finalPath = join(this.storageRoot, relativePath);

    await mkdir(dirname(finalPath), { recursive: true });
    await rename(input.file.path, finalPath);

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
        publicUrl: toPublicStorageUrl(input.apiOrigin, relativePath),
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

  async deleteFile(id: string) {
    const file = await this.prisma.storedFile.findUnique({ where: { id } });
    if (!file) {
      throw new NotFoundException('Stored file not found.');
    }

    await this.prisma.storedFile.delete({ where: { id } });
    await rm(join(this.storageRoot, file.relativePath), { force: true });
    return { deleted: true };
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
