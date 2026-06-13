import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DepedFormsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.depEdForm.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.depEdForm.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.depEdForm.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.depEdForm.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.depEdForm.delete({ where: { id } });
  }
}
