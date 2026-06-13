import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const count = await this.prisma.enrollmentApplication.count();
    const sequence = (count + 1).toString().padStart(3, '0');
    const applicationNo = `APP-2026-${sequence}`;

    return this.prisma.enrollmentApplication.create({
      data: {
        ...data,
        applicationNo,
      },
    });
  }

  findAll(ayId?: string) {
    return this.prisma.enrollmentApplication.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.enrollmentApplication.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.enrollmentApplication.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.enrollmentApplication.delete({ where: { id } });
  }
}
