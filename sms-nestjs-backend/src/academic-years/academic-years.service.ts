import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.academicYear.create({ data });
  }

  findAll() {
    return this.prisma.academicYear.findMany();
  }

  findOne(id: string) {
    return this.prisma.academicYear.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.academicYear.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.academicYear.delete({ where: { id } });
  }
}
