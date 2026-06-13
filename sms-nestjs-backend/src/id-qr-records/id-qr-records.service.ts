import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdQrRecordsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.idQrRecord.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.idQrRecord.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.idQrRecord.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.idQrRecord.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.idQrRecord.delete({ where: { id } });
  }
}
