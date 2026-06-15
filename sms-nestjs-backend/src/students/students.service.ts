import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

const DEFAULT_STUDENT_PASSWORD = 'ChangeMe123!';

function withoutPassword<T extends { user?: { password?: string } | null }>(
  record: T | null,
): T | null {
  if (!record?.user) {
    return record;
  }

  const { password, ...user } = record.user;
  void password;
  return { ...record, user };
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Omit<Prisma.StudentUncheckedCreateInput, 'studentNo'>) {
    const count = await this.prisma.student.count();
    const sequence = (count + 1).toString().padStart(3, '0');
    const studentNo = `STU-2026-${sequence}`;

    return this.prisma.student.create({
      data: {
        ...data,
        studentNo,
      },
    });
  }

  findAll(ayId?: string, search?: string) {
    const whereClause: Prisma.StudentWhereInput = {};
    if (ayId) whereClause.academicYearId = ayId;
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { lrn: { contains: search, mode: 'insensitive' } },
        { studentNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.student.findMany({
      where: whereClause,
      take: search ? 5 : undefined,
    });
  }

  findOne(id: string) {
    return this.prisma.student
      .findUnique({
        where: { id },
        include: {
          behaviorRecords: true,
          fees: true,
          siblings: true,
          user: true,
        },
      })
      .then(withoutPassword);
  }

  async update(id: string, data: Prisma.StudentUncheckedUpdateInput) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    // Auto-generate user account when marked as Officially Enrolled
    if (
      data.enrollmentStatus === 'Officially Enrolled' &&
      student &&
      student.enrollmentStatus !== 'Officially Enrolled' &&
      !student.user
    ) {
      const baseUsername = `${student.firstName.toLowerCase().replace(/\s+/g, '')}.${student.lastName.toLowerCase().replace(/\s+/g, '')}`;
      let email = baseUsername;

      // Ensure uniqueness
      let counter = 1;
      while (await this.prisma.user.findUnique({ where: { email } })) {
        email = `${baseUsername}${counter}`;
        counter++;
      }

      await this.prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
          role: 'STUDENT',
          studentId: id,
        },
      });
    }

    return this.prisma.student.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }

  addBehaviorRecord(
    studentId: string,
    data: Omit<Prisma.BehaviorRecordUncheckedCreateInput, 'studentId'>,
  ) {
    return this.prisma.behaviorRecord.create({
      data: { ...data, studentId },
    });
  }

  addStudentFee(
    studentId: string,
    data: Omit<Prisma.StudentFeeUncheckedCreateInput, 'studentId'>,
  ) {
    return this.prisma.studentFee.create({
      data: { ...data, studentId },
    });
  }

  addStudentSibling(
    studentId: string,
    data: Omit<Prisma.StudentSiblingUncheckedCreateInput, 'studentId'>,
  ) {
    return this.prisma.studentSibling.create({
      data: { ...data, studentId },
    });
  }

  async resetPassword(studentId: string) {
    const user = await this.prisma.user.update({
      where: { studentId },
      data: { password: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10) },
    });
    const { password, ...safeUser } = user;
    void password;
    return safeUser;
  }
}
