import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicRecordsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.academicRecord.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.academicRecord.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.academicRecord.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.academicRecord.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.academicRecord.delete({ where: { id } });
  }
}
