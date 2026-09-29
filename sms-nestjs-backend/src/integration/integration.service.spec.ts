import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { createDrizzleMock } from '../test/drizzle-mock';
import * as schema from '../drizzle/schema';

describe('IntegrationService registrar-finance data sharing', () => {
  function createService() {
    const db = createDrizzleMock({
      query: {
        student: {
          findFirst: jest.fn(),
        },
        academicYear: {
          findFirst: jest.fn(),
        },
        academicRecord: {
          findMany: jest.fn(),
        },
        studentAssessment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        integrationLog: {},
      },
    });

    return { db, service: new IntegrationService({ db } as never) };
  }

  it('requires academicYearId for finance profile reads', async () => {
    const { service } = createService();

    await expect(service.getStudentFinanceProfile('student-1', '')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns registrar and finance data for a student in one academic year', async () => {
    const { db, service } = createService();
    (db.query.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      gradeLevel: 'G1',
      academicYearId: 'ay-1',
    });
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      code: 'SY2026-2027',
      isActive: true,
    });
    (db.query.academicRecord.findMany as jest.Mock).mockResolvedValue([
      { id: 'record-1', studentName: 'Juan Dela Cruz', academicYearId: 'ay-1', generalAverage: '95' },
    ]);
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      academicYearId: 'ay-1',
      financeStatus: 'With Balance',
      balance: 600,
      payments: [{ id: 'payment-1', amount: 500 }],
    });

    const profile = await service.getStudentFinanceProfile('student-1', 'ay-1', 'admin-1');

    expect(profile.student.id).toBe('student-1');
    expect(profile.academicYear!.code).toBe('SY2026-2027');
    expect(profile.academicRecords).toHaveLength(1);
    expect(profile.finance.assessment!.id).toBe('assessment-1');
    expect(db.insert).toHaveBeenCalledWith(schema.integrationLog);
    expect(db.insert).toHaveBeenCalledWith(
      expect.anything(),
    );
  });

  it('logs and throws on missing students', async () => {
    const { db, service } = createService();
    (db.query.student.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.getStudentFinanceProfile('missing', 'ay-1', 'admin-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(db.insert).toHaveBeenCalledWith(schema.integrationLog);
  });

  it('returns clearance rows scoped to the requested academic year', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findMany as jest.Mock).mockResolvedValue([
      {
        studentId: 'student-1',
        financeStatus: 'Cleared',
        netAmount: 1000,
        paidAmount: 1000,
        balance: 0,
        student: {
          id: 'student-1',
          firstName: 'Ana',
          lastName: 'Santos',
          gradeLevel: 'G2',
          section: 'G2A',
        },
      },
    ]);

    const rows = await service.getFinanceClearance('ay-1', 'admin-1');

    expect(rows).toEqual([
      expect.objectContaining({
        studentId: 'student-1',
        financeStatus: 'Cleared',
        balance: 0,
      }),
    ]);
  });

  it('syncs assessment finance status back to student when AY is active', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      financeStatus: 'Cleared',
    });
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      isActive: true,
    });
    db.__queue.push('update', {
      id: 'student-1',
      financeStatus: 'Cleared',
    });

    const result = await service.syncStudentFinanceStatus('student-1', 'ay-1', 'admin-1');

    expect(result.financeStatus).toBe('Cleared');
    expect(db.update).toHaveBeenCalledWith(schema.student);
  });

  it('returns unchanged when the academic year is not active', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-2',
      financeStatus: 'With Balance',
    });
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-2',
      isActive: false,
    });

    const result = await service.syncStudentFinanceStatus('student-1', 'ay-2', 'admin-1');

    expect(result.financeStatus).toBe('With Balance');
    expect(db.update).not.toHaveBeenCalled();
  });
});
