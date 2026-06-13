import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentRequestsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.documentRequest.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.documentRequest.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.documentRequest.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.documentRequest.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.documentRequest.delete({ where: { id } });
  }
}
