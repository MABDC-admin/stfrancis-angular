import { BadRequestException, ConflictException } from '@nestjs/common';
import { FinanceService } from './finance.service';

type MockFn = jest.Mock;

describe('FinanceService academic-year-safe rules', () => {
  function createPrisma(overrides: Record<string, unknown> = {}) {
    return {
      feeType: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findUnique: jest.fn(),
      },
      feeTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      feeTemplateLineItem: {
        findMany: jest.fn(),
      },
      studentAssessment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      studentAssessmentLineItem: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      paymentReceiptAudit: {
        create: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      academicYear: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(async (callback: unknown) => {
        if (typeof callback === 'function') {
          return callback(createPrisma(overrides));
        }
        return callback;
      }),
      ...overrides,
    };
  }

  function service(prisma: Record<string, unknown>) {
    return new FinanceService(prisma as never);
  }

  it('rejects assessment discounts above 100 percent', async () => {
    const prisma = createPrisma();

    await expect(
      service(prisma).saveAssessment({
        studentId: 'student-1',
        academicYearId: 'ay-1',
        regularDiscountPercent: 60,
        siblingDiscountPercent: 30,
        scholarshipDiscountPercent: 20,
        lineItems: [{ feeTypeId: 'tuition', description: 'Tuition', amount: 1000 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates the existing assessment instead of creating a second active assessment for the same student and academic year', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findFirst as MockFn).mockResolvedValue({
      id: 'assessment-1',
      paidAmount: 0,
    });
    (prisma.studentAssessment.update as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 900,
      balance: 900,
    });

    const result = await service(prisma).saveAssessment({
      studentId: 'student-1',
      academicYearId: 'ay-1',
      regularDiscountPercent: 10,
      siblingDiscountPercent: 0,
      scholarshipDiscountPercent: 0,
      lineItems: [{ feeTypeId: 'tuition', description: 'Tuition', amount: 1000 }],
    });

    expect(result.id).toBe('assessment-1');
    expect(prisma.studentAssessment.create).not.toHaveBeenCalled();
    expect(prisma.studentAssessment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'assessment-1' } }),
    );
  });

  it('accepts a partial payment and keeps the assessment with balance', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 1000,
    });
    (prisma.payment.findFirst as MockFn).mockResolvedValue(null);
    (prisma.payment.create as MockFn).mockResolvedValue({ id: 'payment-1' });
    (prisma.studentAssessment.update as MockFn).mockResolvedValue({
      id: 'assessment-1',
      paidAmount: 400,
      balance: 600,
      financeStatus: 'With Balance',
    });

    const result = await service(prisma).recordPayment({
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-001',
      method: 'Cash',
      amount: 400,
      paymentDate: '2026-06-11',
    });

    expect(result.assessment.financeStatus).toBe('With Balance');
    expect(result.assessment.balance).toBe(600);
  });

  it('accepts exact final payment and clears the assessment', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 400,
      balance: 600,
    });
    (prisma.payment.findFirst as MockFn).mockResolvedValue(null);
    (prisma.payment.create as MockFn).mockResolvedValue({ id: 'payment-2' });
    (prisma.studentAssessment.update as MockFn).mockResolvedValue({
      id: 'assessment-1',
      paidAmount: 1000,
      balance: 0,
      financeStatus: 'Cleared',
    });

    const result = await service(prisma).recordPayment({
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-002',
      method: 'GCash',
      amount: 600,
      paymentDate: '2026-06-11',
    });

    expect(result.assessment.financeStatus).toBe('Cleared');
    expect(result.assessment.balance).toBe(0);
  });

  it('mirrors final payment clearance to student.financeStatus when academic year is active', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 400,
      balance: 600,
    });
    (prisma.payment.findFirst as MockFn).mockResolvedValue(null);
    (prisma.payment.create as MockFn).mockResolvedValue({ id: 'payment-2' });
    (prisma.studentAssessment.update as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      paidAmount: 1000,
      balance: 0,
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

    await service(prisma).recordPayment({
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-002',
      method: 'GCash',
      amount: 600,
      paymentDate: '2026-06-11',
    });

    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: { financeStatus: 'Cleared' },
    });
  });

  it('blocks overpayment', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      balance: 600,
    });

    await expect(
      service(prisma).recordPayment({
        studentAssessmentId: 'assessment-1',
        studentId: 'student-1',
        academicYearId: 'ay-1',
        receiptNumber: 'OR-003',
        method: 'Cash',
        amount: 601,
        paymentDate: '2026-06-11',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks cross-academic-year payment posting', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      balance: 600,
    });

    await expect(
      service(prisma).recordPayment({
        studentAssessmentId: 'assessment-1',
        studentId: 'student-1',
        academicYearId: 'ay-2',
        receiptNumber: 'OR-004',
        method: 'Cash',
        amount: 100,
        paymentDate: '2026-06-11',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks duplicate receipt number inside the same academic year', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessment.findUnique as MockFn).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      balance: 600,
    });
    (prisma.payment.findFirst as MockFn).mockResolvedValue({ id: 'payment-existing' });

    await expect(
      service(prisma).recordPayment({
        studentAssessmentId: 'assessment-1',
        studentId: 'student-1',
        academicYearId: 'ay-1',
        receiptNumber: 'OR-001',
        method: 'Cash',
        amount: 100,
        paymentDate: '2026-06-11',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects hard delete for used fee types', async () => {
    const prisma = createPrisma();
    (prisma.studentAssessmentLineItem as Record<string, MockFn>).findFirst =
      jest.fn().mockResolvedValue({ id: 'line-1' });

    await expect(service(prisma).deleteFeeType('fee-type-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.feeType.delete).not.toHaveBeenCalled();
  });

  it('edits a payment receipt number and stores an audit record', async () => {
    const prisma = createPrisma();
    (prisma.payment.findUnique as MockFn).mockResolvedValue({
      id: 'payment-1',
      academicYearId: 'ay-1',
      receiptNumber: 'OR-001',
    });
    (prisma.payment.findFirst as MockFn).mockResolvedValue(null);
    (prisma.payment.update as MockFn).mockResolvedValue({
      id: 'payment-1',
      receiptNumber: 'OR-001-A',
    });

    await service(prisma).updatePaymentReceipt({
      paymentId: 'payment-1',
      newReceiptNumber: 'OR-001-A',
      editedById: 'user-1',
    });

    expect(prisma.paymentReceiptAudit.create).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-1',
        oldReceiptNumber: 'OR-001',
        newReceiptNumber: 'OR-001-A',
        editedById: 'user-1',
      },
    });
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'payment-1' },
      data: { receiptNumber: 'OR-001-A' },
    });
  });
});
