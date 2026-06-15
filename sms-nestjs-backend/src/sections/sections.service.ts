import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.section.create({ data });
  }

  findAll(ayId?: string) {
    return this.prisma.section.findMany({
      where: ayId ? { academicYearId: ayId } : undefined,
    });
  }

  getTeachers() {
    return this.prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: { teacherProfile: true }
    });
  }

  findOne(id: string) {
    return this.prisma.section.findUnique({ where: { id } });
  }

  update(id: string, data: any) {
    return this.prisma.section.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.section.delete({ where: { id } });
  }

  async batchAssign(sectionId: string, studentIds: string[]) {
    // 1. Get the section
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new Error('Section not found');

    // 2. Update students
    await this.prisma.student.updateMany({
      where: { id: { in: studentIds } },
      data: { section: section.sectionName, enrollmentStatus: 'Assigned' },
    });

    // 3. Recalculate section enrollment
    const newEnrolled = section.enrolled + studentIds.length;
    const newAvailable = section.capacity - newEnrolled;

    return this.prisma.section.update({
      where: { id: sectionId },
      data: { enrolled: newEnrolled, availableSlots: newAvailable },
    });
  }
}
