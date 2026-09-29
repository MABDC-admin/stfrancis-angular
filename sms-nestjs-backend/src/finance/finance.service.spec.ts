import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FinanceService } from './finance.service';
import { createDrizzleMock } from '../test/drizzle-mock';
import * as schema from '../drizzle/schema';

describe('FinanceService academic-year-safe rules', () => {
  function createService() {
    const db = createDrizzleMock({
      query: {
        feeType: { findMany: jest.fn() },
        feeTemplate: { findMany: jest.fn(), findFirst: jest.fn() },
        feeTemplateLineItem: {},
        studentAssessment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        payment: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        paymentReceiptAudit: {},
        student: { update: jest.fn() },
        academicYear: { findFirst: jest.fn() },
        studentAssessmentLineItem: {},
      },
    });
    (db as any).transaction = jest.fn(async (callback: (tx: typeof db) => unknown) => callback(db));

    return {
      db,
      service: new FinanceService({ db } as never),
    };
  }

  it('rejects deleting a payment that does not exist', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.deletePayment('payment-missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects discounts that exceed 100% total', async () => {
    const { service } = createService();

    await expect(
      service.saveAssessment({
        studentId: 'student-1',
        academicYearId: 'ay-1',
        regularDiscountPercent: 60,
        siblingDiscountPercent: 30,
        scholarshipDiscountPercent: 20,
        lineItems: [{ feeTypeId: 'tuition', description: 'Tuition', amount: 1000 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates existing assessment and replaces line items for same learner and academic year', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      paidAmount: 0,
      netAmount: 900,
    });
    db.__queue.pushMany('update', [
      {
        id: 'assessment-1',
        studentId: 'student-1',
        academicYearId: 'ay-1',
        netAmount: 900,
        paidAmount: 0,
        balance: 900,
      },
      { deleted: true },
    ]);
    db.__queue.push('insert', {
      id: 'line-item-1',
      studentAssessmentId: 'assessment-1',
    });

    const result = await service.saveAssessment({
      studentId: 'student-1',
      academicYearId: 'ay-1',
      regularDiscountPercent: 10,
      siblingDiscountPercent: 0,
      scholarshipDiscountPercent: 0,
      lineItems: [{ feeTypeId: 'tuition', description: 'Tuition', amount: 1000 }],
    });

    expect(result.id).toBe('assessment-1');
    expect(db.insert).toHaveBeenCalledWith(schema.studentAssessmentLineItem);
    expect(db.delete).toHaveBeenCalledWith(schema.studentAssessmentLineItem);
  });

  it('accepts partial payment and keeps balance due', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 1000,
      financeStatus: 'With Balance',
    });
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue(null);
    db.__queue.pushMany('insert', [
      {
        id: 'payment-1',
        amount: 400,
        studentAssessmentId: 'assessment-1',
      },
    ]);
    db.__queue.pushMany('update', [
      {
        id: 'assessment-1',
        financeStatus: 'With Balance',
        paidAmount: 400,
        balance: 600,
      },
    ]);
    db.__queue.push('select', [{ id: 'ay-1', isActive: false }]);

    const result = await service.recordPayment({
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
    expect(db.insert).toHaveBeenCalledWith(schema.payment);
    expect(db.update).toHaveBeenCalledWith(schema.studentAssessment);
  });

  it('clears balance on full payment and mirrors finance status only when AY is active', async () => {
    const { db, service } = createService();
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({ id: 'ay-1', isActive: true });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 400,
      balance: 600,
      financeStatus: 'With Balance',
    });
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue(null);
    db.__queue.push('insert', {
      id: 'payment-2',
      amount: 600,
      studentAssessmentId: 'assessment-1',
    });
    db.__queue.push('update', {
      id: 'assessment-1',
      netAmount: 1000,
      paidAmount: 1000,
      balance: 0,
      financeStatus: 'Cleared',
    });
    db.__queue.push('update', {
      id: 'student-1',
      financeStatus: 'Cleared',
    });

    const result = await service.recordPayment({
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
    expect(db.update).toHaveBeenCalledWith(schema.studentAssessment);
    expect(db.update).toHaveBeenCalledWith(schema.student);
  });

  it('blocks overpayment against remaining balance', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 600,
      financeStatus: 'With Balance',
    });

    await expect(
      service.recordPayment({
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

  it('blocks cross-year payment posting', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 1000,
      financeStatus: 'With Balance',
    });

    await expect(
      service.recordPayment({
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

  it('blocks duplicate receipt within a year', async () => {
    const { db, service } = createService();
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 600,
      financeStatus: 'With Balance',
    });
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-existing',
      receiptNumber: 'OR-001',
    });

    await expect(
      service.recordPayment({
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

  it('hard deleting a payment recomputes assessment totals', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-2',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 400,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 700,
      balance: 300,
      financeStatus: 'With Balance',
    });
    (db.query.payment.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'payment-1',
        studentAssessmentId: 'assessment-1',
        academicYearId: 'ay-1',
        amount: 300,
      },
    ]);
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      isActive: false,
    });
    db.__queue.push('delete', {
      id: 'payment-2',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 400,
    });
    db.__queue.push('update', {
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 300,
      balance: 700,
      financeStatus: 'With Balance',
    });

    const result = await service.deletePayment('payment-2');

    expect(result.deletedPayment.id).toBe('payment-2');
    expect(result.assessment.paidAmount).toBe(300);
    expect(result.assessment.balance).toBe(700);
    expect(result.assessment.financeStatus).toBe('With Balance');
    expect(db.delete).toHaveBeenCalledWith(schema.payment);
    expect(db.update).toHaveBeenCalledWith(schema.studentAssessment);
  });

  it('deleting the only payment returns the learner to full balance', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 1000,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 1000,
      balance: 0,
      financeStatus: 'Cleared',
    });
    (db.query.payment.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      isActive: true,
    });
    db.__queue.push('delete', {
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 1000,
    });
    db.__queue.push('update', {
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 0,
      balance: 1000,
      financeStatus: 'With Balance',
    });
    db.__queue.push('update', {
      id: 'student-1',
      financeStatus: 'With Balance',
    });

    const result = await service.deletePayment('payment-1');

    expect(result.assessment.paidAmount).toBe(0);
    expect(result.assessment.balance).toBe(1000);
    expect(result.assessment.financeStatus).toBe('With Balance');
    expect(db.update).toHaveBeenCalledWith(schema.student);
  });

  it('deleting rejects missing assessment', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      studentAssessmentId: 'assessment-missing',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      amount: 250,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(service.deletePayment('payment-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deleting rejects cross-year mismatch between payment and assessment', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock).mockResolvedValue({
      id: 'payment-1',
      studentAssessmentId: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-2',
      amount: 250,
    });
    (db.query.studentAssessment.findFirst as jest.Mock).mockResolvedValue({
      id: 'assessment-1',
      studentId: 'student-1',
      academicYearId: 'ay-1',
      netAmount: 1000,
      paidAmount: 250,
      balance: 750,
      financeStatus: 'With Balance',
    });

    await expect(service.deletePayment('payment-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('blocks hard deletion of fee types already used in assessments', async () => {
    const { db, service } = createService();
    db.__queue.push('select', [{ id: 'used-line-item' }]);

    await expect(service.deleteFeeType('fee-type-1')).rejects.toBeInstanceOf(ConflictException);
    expect(db.delete).not.toHaveBeenCalledWith(schema.feeType);
  });

  it('updates payment receipt and records an audit entry', async () => {
    const { db, service } = createService();
    (db.query.payment.findFirst as jest.Mock)
      .mockResolvedValueOnce({
        id: 'payment-1',
        academicYearId: 'ay-1',
        receiptNumber: 'OR-001',
      })
      .mockResolvedValueOnce(null);
    db.__queue.pushMany('insert', [{ id: 'audit-1' }]);
    db.__queue.push('update', {
      id: 'payment-1',
      receiptNumber: 'OR-001-A',
    });

    await service.updatePaymentReceipt({
      paymentId: 'payment-1',
      newReceiptNumber: 'OR-001-A',
      editedById: 'user-1',
    });

    expect(db.insert).toHaveBeenCalledWith(schema.paymentReceiptAudit);
    expect(db.update).toHaveBeenCalledWith(schema.payment);
    expect(db.insert).toHaveBeenCalledWith(schema.paymentReceiptAudit);
  });
});
