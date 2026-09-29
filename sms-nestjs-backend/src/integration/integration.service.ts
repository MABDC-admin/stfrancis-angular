import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { and, desc, eq, like, or } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

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
  constructor(private drizzle: DrizzleService) {}

  private requireAcademicYear(academicYearId?: string) {
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required.');
    }
    return academicYearId;
  }

  private log(input: IntegrationLogInput) {
    return this.drizzle.db.insert(schema.integrationLog).values({
      id: crypto.randomUUID(),
      action: input.action,
      sourceModule: input.sourceModule,
      targetModule: input.targetModule,
      studentId: input.studentId ?? null,
      academicYearId: input.academicYearId ?? null,
      status: input.status,
      message: input.message ?? null,
      performedById: input.performedById ?? null,
    });
  }

  async getStudentFinanceProfile(
    studentId: string,
    academicYearId: string,
    performedById?: string,
  ) {
    this.requireAcademicYear(academicYearId);
    const action = 'READ_STUDENT_FINANCE_PROFILE';

    const student = await this.drizzle.db.query.student.findFirst({
      where: eq(schema.student.id, studentId),
      columns: {
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
      this.drizzle.db.query.academicYear.findFirst({
        where: eq(schema.academicYear.id, academicYearId),
      }),
      this.drizzle.db.query.academicRecord.findMany({
        where: and(
          eq(schema.academicRecord.academicYearId, academicYearId),
          or(
            like(schema.academicRecord.studentName, `%${student.lastName}%`),
            eq(schema.academicRecord.studentId, student.id),
          ),
        ),
        orderBy: [desc(schema.academicRecord.schoolYear)],
      }),
      this.drizzle.db.query.studentAssessment.findFirst({
        where: and(
          eq(schema.studentAssessment.studentId, studentId),
          eq(schema.studentAssessment.academicYearId, academicYearId),
        ),
        with: {
          studentAssessmentLineItems: {
            with: {
              feeType: true,
            },
          },
          payments: {
            orderBy: [desc(schema.payment.paymentDate)],
          },
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

    const assessments = await this.drizzle.db.query.studentAssessment.findMany({
      where: eq(schema.studentAssessment.academicYearId, academicYearId),
      with: {
        student: {
          columns: {
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
      orderBy: [desc(schema.studentAssessment.updatedAt)],
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
    const assessment = await this.drizzle.db.query.studentAssessment.findFirst({
      where: and(
        eq(schema.studentAssessment.studentId, studentId),
        eq(schema.studentAssessment.academicYearId, academicYearId),
      ),
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

    const academicYear = await this.drizzle.db.query.academicYear.findFirst({
      where: eq(schema.academicYear.id, academicYearId),
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

    const [updated] = await this.drizzle.db
      .update(schema.student)
      .set({ financeStatus: assessment.financeStatus })
      .where(eq(schema.student.id, studentId))
      .returning();

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

    if (!updated) {
      throw new NotFoundException('Student was not found.');
    }

    return updated;
  }

  getDataMap() {
    return {
      keys: ['studentId', 'academicYearId'],
      registrarToFinance: [
        { registrarField: 'Student.id', financeField: 'StudentAssessment.studentId' },
        {
          registrarField: 'Student.academicYearId',
          financeField: 'StudentAssessment.academicYearId',
        },
        { registrarField: 'Student.gradeLevel', financeField: 'FeeTemplate.gradeLevel' },
        {
          registrarField: 'Student.financeStatus',
          financeField: 'Active-year mirror of StudentAssessment.financeStatus',
        },
      ],
      financeToRegistrar: [
        {
          financeField: 'StudentAssessment.financeStatus',
          registrarField: 'Student.financeStatus for active year only',
        },
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
