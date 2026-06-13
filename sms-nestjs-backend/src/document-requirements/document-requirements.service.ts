import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentRequirementsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.documentRequirement.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.documentRequirement.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.documentRequirement.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.documentRequirement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.documentRequirement.delete({ where: { id } });
  }
}
