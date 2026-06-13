import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearnerMovementsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.learnerMovement.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.learnerMovement.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.learnerMovement.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.learnerMovement.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.learnerMovement.delete({ where: { id } });
  }
}
