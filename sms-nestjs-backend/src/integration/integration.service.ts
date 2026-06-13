import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface IntegrationLogInput {
  action: string;
  sourceModule: string;
  targetModule: string;
  studentId?: string;
  academicYearId?: string;
  status: 'SUCCESS' | 'ERROR';
  message?: string;
  performedById?: string;
}

@Injectable()
export class IntegrationService {
  constructor(private prisma: PrismaService) {}

  private requireAcademicYear(academicYearId?: string) {
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required.');
    }
    return academicYearId;
  }

  private log(input: IntegrationLogInput) {
    return this.prisma.integrationLog.create({
      data: {
        action: input.action,
        sourceModule: input.sourceModule,
        targetModule: input.targetModule,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        status: input.status,
        message: input.message,
        performedById: input.performedById,
      },
    });
  }

  async getStudentFinanceProfile(
    studentId: string,
    academicYearId: string,
    performedById?: string,
  ) {
    this.requireAcademicYear(academicYearId);
    const action = 'READ_STUDENT_FINANCE_PROFILE';

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        studentNo: true,
        lrn: true,
        firstName: true,
        middleName: true,
        lastName: true,
        gradeLevel: true,
        section: true,
        adviser: true,
        enrollmentStatus: true,
        documentStatus: true,
        financeStatus: true,
        academicYearId: true,
      },
    });

    if (!student) {
      await this.log({
        action,
        sourceModule: 'REGISTRAR',
        targetModule: 'FINANCE',
        studentId,
        academicYearId,
        status: 'ERROR',
        message: 'Student was not found.',
        performedById,
      });
      throw new NotFoundException('Student was not found.');
    }

    const [academicYear, academicRecords, assessment] = await Promise.all([
      this.prisma.academicYear.findUnique({
        where: { id: academicYearId },
      }),
      this.prisma.academicRecord.findMany({
        where: { academicYearId, studentName: { contains: student.lastName } },
        orderBy: { schoolYear: 'desc' },
      }),
      this.prisma.studentAssessment.findFirst({
        where: { studentId, academicYearId },
        include: {
          lineItems: { include: { feeType: true } },
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      }),
    ]);

    await this.log({
      action,
      sourceModule: 'REGISTRAR',
      targetModule: 'FINANCE',
      studentId,
      academicYearId,
      status: 'SUCCESS',
      message: 'Integrated student finance profile read.',
      performedById,
    });

    return {
      student,
      academicYear,
      academicRecords,
      finance: {
        assessment,
        clearanceStatus: assessment?.financeStatus ?? student.financeStatus,
      },
    };
  }

  async getFinanceClearance(academicYearId: string, performedById?: string) {
    this.requireAcademicYear(academicYearId);
    const assessments = await this.prisma.studentAssessment.findMany({
      where: { academicYearId },
      include: {
        student: {
          select: {
            id: true,
            studentNo: true,
            lrn: true,
            firstName: true,
            lastName: true,
            gradeLevel: true,
            section: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    await this.log({
      action: 'READ_FINANCE_CLEARANCE',
      sourceModule: 'FINANCE',
      targetModule: 'REGISTRAR',
      academicYearId,
      status: 'SUCCESS',
      message: `Returned ${assessments.length} clearance rows.`,
      performedById,
    });

    return assessments.map((assessment) => ({
      studentId: assessment.studentId,
      student: assessment.student,
      academicYearId: assessment.academicYearId,
      financeStatus: assessment.financeStatus,
      netAmount: assessment.netAmount,
      paidAmount: assessment.paidAmount,
      balance: assessment.balance,
      updatedAt: assessment.updatedAt,
    }));
  }

  async syncStudentFinanceStatus(
    studentId: string,
    academicYearId: string,
    performedById?: string,
  ) {
    this.requireAcademicYear(academicYearId);
    const assessment = await this.prisma.studentAssessment.findFirst({
      where: { studentId, academicYearId },
    });
    if (!assessment) {
      await this.log({
        action: 'SYNC_STUDENT_FINANCE_STATUS',
        sourceModule: 'FINANCE',
        targetModule: 'REGISTRAR',
        studentId,
        academicYearId,
        status: 'ERROR',
        message: 'Assessment was not found.',
        performedById,
      });
      throw new NotFoundException('Assessment was not found.');
    }

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!academicYear?.isActive) {
      await this.log({
        action: 'SYNC_STUDENT_FINANCE_STATUS',
        sourceModule: 'FINANCE',
        targetModule: 'REGISTRAR',
        studentId,
        academicYearId,
        status: 'SUCCESS',
        message: 'Skipped mirror because academic year is not active.',
        performedById,
      });
      return assessment;
    }

    const student = await this.prisma.student.update({
      where: { id: studentId },
      data: { financeStatus: assessment.financeStatus },
    });

    await this.log({
      action: 'SYNC_STUDENT_FINANCE_STATUS',
      sourceModule: 'FINANCE',
      targetModule: 'REGISTRAR',
      studentId,
      academicYearId,
      status: 'SUCCESS',
      message: `Mirrored active-year finance status: ${assessment.financeStatus}.`,
      performedById,
    });

    return student;
  }

  getDataMap() {
    return {
      keys: ['studentId', 'academicYearId'],
      registrarToFinance: [
        { registrarField: 'Student.id', financeField: 'StudentAssessment.studentId' },
        { registrarField: 'Student.academicYearId', financeField: 'StudentAssessment.academicYearId' },
        { registrarField: 'Student.gradeLevel', financeField: 'FeeTemplate.gradeLevel' },
        { registrarField: 'Student.financeStatus', financeField: 'Active-year mirror of StudentAssessment.financeStatus' },
      ],
      financeToRegistrar: [
        { financeField: 'StudentAssessment.financeStatus', registrarField: 'Student.financeStatus for active year only' },
        { financeField: 'Payment.amount', registrarField: 'Read-only ledger visibility' },
        { financeField: 'StudentAssessment.balance', registrarField: 'Read-only clearance visibility' },
      ],
      roles: {
        FINANCE: ['read learner summary', 'write finance data', 'sync active-year finance status'],
        REGISTRAR: ['read finance profile', 'read clearance list'],
        ADMIN: ['all integration endpoints'],
      },
    };
  }
}
