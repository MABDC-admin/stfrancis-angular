import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Roles } from '../auth/roles.decorator';
import { StorageService } from './storage.service';

const tempUploadDir =
  process.env.STORAGE_TMP_DIR || join(process.cwd(), 'storage', '.tmp');

function apiOrigin(req: any): string {
  return `${req.protocol}://${req.get('host')}`;
}

@Roles('REGISTRAR', 'FINANCE', 'TEACHER', 'STUDENT', 'ADMIN')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(tempUploadDir, { recursive: true });
          cb(null, tempUploadDir);
        },
      }),
    }),
  )
  uploadGeneric(
    @UploadedFile() file: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    return this.storageService.storeFile({
      file,
      ownerType: body.ownerType,
      ownerId: body.ownerId,
      category: body.category || 'other',
      uploadedById: req.user?.userId,
      apiOrigin: apiOrigin(req),
    });
  }

  @Post('students/:studentId/documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(tempUploadDir, { recursive: true });
          cb(null, tempUploadDir);
        },
      }),
    }),
  )
  uploadStudentDocument(
    @Param('studentId') studentId: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.storageService.storeFile({
      file,
      ownerType: 'student',
      ownerId: studentId,
      category: 'document',
      uploadedById: req.user?.userId,
      apiOrigin: apiOrigin(req),
    });
  }

  @Post('students/:studentId/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(tempUploadDir, { recursive: true });
          cb(null, tempUploadDir);
        },
      }),
    }),
  )
  uploadStudentPhoto(
    @Param('studentId') studentId: string,
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.storageService.storeFile({
      file,
      ownerType: 'student',
      ownerId: studentId,
      category: 'photo',
      uploadedById: req.user?.userId,
      apiOrigin: apiOrigin(req),
    });
  }

  @Post('staff/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(tempUploadDir, { recursive: true });
          cb(null, tempUploadDir);
        },
      }),
    }),
  )
  uploadStaffAvatar(@UploadedFile() file: any, @Req() req: any) {
    return this.storageService.storeFile({
      file,
      ownerType: 'staff',
      ownerId: req.user?.userId,
      category: 'avatar',
      uploadedById: req.user?.userId,
      apiOrigin: apiOrigin(req),
    });
  }

  @Get('files')
  listFiles(
    @Query('ownerType') ownerType?: string,
    @Query('ownerId') ownerId?: string,
    @Query('category') category?: string,
  ) {
    return this.storageService.listFiles({ ownerType, ownerId, category });
  }

  @Delete('files/:id')
  deleteFile(@Param('id') id: string) {
    return this.storageService.deleteFile(id);
  }
}
