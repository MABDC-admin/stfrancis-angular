import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IntegrationService } from './integration.service';

type MockFn = jest.Mock;

describe('IntegrationService registrar-finance data sharing', () => {
  function createPrisma(overrides: Record<string, unknown> = {}) {
    return {
      student: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      academicRecord: {
        findMany: jest.fn(),
      },
      studentAssessment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      academicYear: {
        findUnique: jest.fn(),
      },
      integrationLog: {
        create: jest.fn(),
      },
      ...overrides,
    };
  }

  function service(prisma: Record<string, unknown>) {
    return new IntegrationService(prisma as never);
  }

  it('requires academicYearId for finance profile reads', async () => {
    const prisma = createPrisma();

    await expect(
      service(prisma).getStudentFinanceProfile('student-1', ''),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns registrar student, academic records, and finance assessment for one academic year', async () => {
    const prisma = createPrisma();
    (prisma.student.findUnique as MockFn).mockResolvedValue({
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      gradeLevel: 'G1',
      academicYearId: 'ay-1',
    });
    (prisma.academicRecord.findMany as MockFn).mockResolvedValue([
      { id: 'record-1', academicYearId: 'ay-1', generalAverage: '95' },
    ]);
    (prisma.academicYear.findUnique as MockFn).mockResolvedValue({
      id: 'ay-1',
      code: 'SY2026-2027',
      isActive: true,
    });
    (prisma.studentAssessment.findFirst as MockFn).mockResolvedValue({
      id: 'assessment-1',
      academicYearId: 'ay-1',
      financeStatus: 'With Balance',
      payments: [{ id: 'payment-1', amount: 500 }],
    });

    const profile = await service(prisma).getStudentFinanceProfile(
      'student-1',
      'ay-1',
      'user-1',
    );

    expect(profile.student.id).toBe('student-1');
    expect(profile.academicYear.id).toBe('ay-1');
    expect(profile.academicRecords).toHaveLength(1);
    expect(profile.finance.assessment.id).toBe('assessment-1');
    expect(prisma.integrationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'READ_STUDENT_FINANCE_PROFILE',
        sourceModule: 'REGISTRAR',
        targetModule: 'FINANCE',
        studentId: 'student-1',
        academicYearId: 'ay-1',
        status: 'SUCCESS',
        performedById: 'user-1',
      }),
    });
  });

  it('throws not found for an unknown student and logs the failure', async () => {
    const prisma = createPrisma();
    (prisma.student.findUnique as MockFn).mockResolvedValue(null);

    await expect(
      service(prisma).getStudentFinanceProfile('missing', 'ay-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.integrationLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'READ_STUDENT_FINANCE_PROFILE',
        status: 'ERROR',
        message: 'Student was not found.',
      }),
    });
  });

  it('returns clearance rows scoped to one academic year', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findMany as MockFn).mockResolvedValue([
      {
        studentId: 'student-1',
        financeStatus: 'Cleared',
        balance: 0,
        student: { id: 'student-1', firstName: 'Ana', lastName: 'Santos' },
      },
    ]);

    const rows = await service(prisma).getFinanceClearance('ay-1', 'user-1');

    expect(rows).toEqual([
      expect.objectContaining({
        studentId: 'student-1',
        financeStatus: 'Cleared',
        balance: 0,
      }),
    ]);
    expect(prisma.studentAssessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { academicYearId: 'ay-1' } }),
    );
  });

  it('mirrors active academic year assessment status to student.financeStatus', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findFirst as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      financeStatus: 'Cleared',
    });
    (prisma.academicYear.findUnique as MockFn).mockResolvedValue({
      id: 'ay-1',
      isActive: true,
    });
    (prisma.student.update as MockFn).mockResolvedValue({
      id: 'student-1',
      financeStatus: 'Cleared',
    });

    const result = await service(prisma).syncStudentFinanceStatus(
      'student-1',
      'ay-1',
      'user-1',
    );

    expect(result.financeStatus).toBe('Cleared');
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { financeStatus: 'Cleared' },
    });
  });
});
