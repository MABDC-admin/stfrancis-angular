import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type PaymentMethod = 'Cash' | 'Bank Transfer' | 'GCash' | 'Card/POS';

interface AssessmentLineItemInput {
  feeTypeId: string;
  description: string;
  amount: number;
  sourceFeeTemplateLineItemId?: string;
}

interface SaveAssessmentInput {
  studentId: string;
  academicYearId: string;
  feeTemplateId?: string;
  regularDiscountPercent?: number;
  siblingDiscountPercent?: number;
  scholarshipDiscountPercent?: number;
  lineItems: AssessmentLineItemInput[];
  userId?: string;
}

interface RecordPaymentInput {
  studentAssessmentId: string;
  studentId: string;
  academicYearId: string;
  receiptNumber: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  remarks?: string;
  encodedById?: string;
}

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  private normalizePercent(value?: number): number {
    return Number(value ?? 0);
  }

  private validateAcademicYear(academicYearId?: string): string {
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required.');
    }
    return academicYearId;
  }

  private validateDiscounts(input: SaveAssessmentInput) {
    const regular = this.normalizePercent(input.regularDiscountPercent);
    const sibling = this.normalizePercent(input.siblingDiscountPercent);
    const scholarship = this.normalizePercent(input.scholarshipDiscountPercent);
    const total = regular + sibling + scholarship;

    if ([regular, sibling, scholarship].some((value) => value < 0)) {
      throw new BadRequestException('Discount percentages cannot be negative.');
    }
    if (total > 100) {
      throw new BadRequestException('Total discount cannot exceed 100%.');
    }

    return { regular, sibling, scholarship, total };
  }

  private computeAssessment(input: SaveAssessmentInput) {
    const discounts = this.validateDiscounts(input);
    const grossAmount = input.lineItems.reduce((sum, item) => {
      if (item.amount < 0) {
        throw new BadRequestException('Line item amounts cannot be negative.');
      }
      return sum + Number(item.amount);
    }, 0);
    const discountAmount = grossAmount * (discounts.total / 100);
    const netAmount = grossAmount - discountAmount;

    return {
      ...discounts,
      grossAmount,
      discountAmount,
      netAmount,
    };
  }

  async listFeeTypes() {
    return this.prisma.feeType.findMany({ orderBy: { name: 'asc' } });
  }

  async createFeeType(input: { name: string; description?: string }) {
    return this.prisma.feeType.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim() || null,
      },
    });
  }

  async updateFeeType(id: string, input: { name?: string; description?: string; isActive?: boolean }) {
    return this.prisma.feeType.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
  }

  async deactivateFeeType(id: string) {
    return this.prisma.feeType.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteFeeType(id: string) {
    const used = await (this.prisma as never as { studentAssessmentLineItem: { findFirst: Function } })
      .studentAssessmentLineItem.findFirst({ where: { feeTypeId: id } });
    if (used) {
      throw new ConflictException(
        'Fee type is already used in an assessment. Deactivate it instead.',
      );
    }
    return this.prisma.feeType.delete({ where: { id } });
  }

  async listFeeTemplates(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.prisma.feeTemplate.findMany({
      where: { academicYearId },
      include: { lineItems: { include: { feeType: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
    });
  }

  async createFeeTemplate(input: {
    academicYearId: string;
    gradeLevel: string;
    name: string;
    lineItems: AssessmentLineItemInput[];
  }) {
    this.validateAcademicYear(input.academicYearId);
    return this.prisma.feeTemplate.create({
      data: {
        academicYearId: input.academicYearId,
        gradeLevel: input.gradeLevel,
        name: input.name,
        lineItems: {
          create: input.lineItems.map((item, index) => ({
            feeTypeId: item.feeTypeId,
            description: item.description,
            amount: Number(item.amount),
            sortOrder: index,
          })),
        },
      },
      include: { lineItems: { include: { feeType: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async deactivateFeeTemplate(id: string) {
    return this.prisma.feeTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async deleteFeeTemplate(id: string) {
    const used = await this.prisma.studentAssessment.findFirst({
      where: { feeTemplateId: id },
    });
    if (used) {
      throw new ConflictException(
        'Fee template is already used in an assessment. Deactivate it instead.',
      );
    }
    return this.prisma.feeTemplate.delete({ where: { id } });
  }

  async saveAssessment(input: SaveAssessmentInput) {
    this.validateAcademicYear(input.academicYearId);
    if (!input.studentId) {
      throw new BadRequestException('studentId is required.');
    }
    if (!input.lineItems.length) {
      throw new BadRequestException('At least one line item is required.');
    }

    const computed = this.computeAssessment(input);
    const existing = await this.prisma.studentAssessment.findFirst({
      where: { studentId: input.studentId, academicYearId: input.academicYearId },
    });
    const paidAmount = Number(existing?.paidAmount ?? 0);
    if (paidAmount > computed.netAmount) {
      throw new BadRequestException(
        'Updated assessment net amount cannot be lower than already paid amount.',
      );
    }
    const balance = computed.netAmount - paidAmount;
    const financeStatus = balance === 0 ? 'Cleared' : 'With Balance';
    const assessmentData = {
      studentId: input.studentId,
      academicYearId: input.academicYearId,
      feeTemplateId: input.feeTemplateId ?? null,
      regularDiscountPercent: computed.regular,
      siblingDiscountPercent: computed.sibling,
      scholarshipDiscountPercent: computed.scholarship,
      grossAmount: computed.grossAmount,
      discountAmount: computed.discountAmount,
      netAmount: computed.netAmount,
      paidAmount,
      balance,
      financeStatus,
      updatedById: input.userId ?? null,
    };

    let assessment;
    if (existing) {
      assessment = await this.prisma.studentAssessment.update({
        where: { id: existing.id },
        data: assessmentData,
      });
      await this.prisma.studentAssessmentLineItem.deleteMany({
        where: { studentAssessmentId: existing.id },
      });
    } else {
      assessment = await this.prisma.studentAssessment.create({
        data: {
          ...assessmentData,
          createdById: input.userId ?? null,
        },
      });
    }

    await this.prisma.studentAssessmentLineItem.createMany({
      data: input.lineItems.map((item) => ({
        studentAssessmentId: assessment.id,
        feeTypeId: item.feeTypeId,
        description: item.description,
        amount: Number(item.amount),
        sourceFeeTemplateLineItemId: item.sourceFeeTemplateLineItemId ?? null,
      })),
    });

    return assessment;
  }

  async listAssessments(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.prisma.studentAssessment.findMany({
      where: { academicYearId },
      include: {
        student: true,
        lineItems: { include: { feeType: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getStudentAssessment(studentId: string, academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.prisma.studentAssessment.findFirst({
      where: { studentId, academicYearId },
      include: {
        student: true,
        lineItems: { include: { feeType: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
  }

  async recordPayment(input: RecordPaymentInput) {
    this.validateAcademicYear(input.academicYearId);
    if (!input.receiptNumber?.trim()) {
      throw new BadRequestException('Receipt/reference number is required.');
    }
    if (input.amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const assessment = await this.prisma.studentAssessment.findUnique({
      where: { id: input.studentAssessmentId },
    });
    if (!assessment) {
      throw new NotFoundException('Student assessment was not found.');
    }
    if (assessment.academicYearId !== input.academicYearId) {
      throw new BadRequestException(
        'Payment academic year must match assessment academic year.',
      );
    }
    if (assessment.studentId !== input.studentId) {
      throw new BadRequestException('Payment student must match assessment student.');
    }
    if (input.amount > Number(assessment.balance)) {
      throw new BadRequestException('Payment amount cannot exceed remaining balance.');
    }

    const duplicateReceipt = await this.prisma.payment.findFirst({
      where: {
        academicYearId: input.academicYearId,
        receiptNumber: input.receiptNumber.trim(),
      },
    });
    if (duplicateReceipt) {
      throw new ConflictException(
        'Receipt/reference number already exists in this academic year.',
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        studentAssessmentId: input.studentAssessmentId,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        receiptNumber: input.receiptNumber.trim(),
        method: input.method,
        amount: Number(input.amount),
        paymentDate: new Date(input.paymentDate),
        remarks: input.remarks ?? null,
        encodedById: input.encodedById ?? null,
      },
    });

    const paidAmount = Number(assessment.paidAmount) + Number(input.amount);
    const balance = Number(assessment.netAmount) - paidAmount;
    const updatedAssessment = await this.prisma.studentAssessment.update({
      where: { id: assessment.id },
      data: {
        paidAmount,
        balance,
        financeStatus: balance === 0 ? 'Cleared' : 'With Balance',
      },
    });

    const academicYear = await this.prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });
    if (academicYear?.isActive) {
      await this.prisma.student.update({
        where: { id: input.studentId },
        data: { financeStatus: updatedAssessment.financeStatus },
      });
    }

    return { payment, assessment: updatedAssessment };
  }

  async listPayments(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.prisma.payment.findMany({
      where: { academicYearId },
      include: { student: true, studentAssessment: true },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async updatePaymentReceipt(input: {
    paymentId: string;
    newReceiptNumber: string;
    editedById?: string;
  }) {
    if (!input.newReceiptNumber?.trim()) {
      throw new BadRequestException('Receipt/reference number is required.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: input.paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment was not found.');
    }

    const newReceiptNumber = input.newReceiptNumber.trim();
    const duplicateReceipt = await this.prisma.payment.findFirst({
      where: {
        academicYearId: payment.academicYearId,
        receiptNumber: newReceiptNumber,
        NOT: { id: input.paymentId },
      },
    });
    if (duplicateReceipt) {
      throw new ConflictException(
        'Receipt/reference number already exists in this academic year.',
      );
    }

    await this.prisma.paymentReceiptAudit.create({
      data: {
        paymentId: input.paymentId,
        oldReceiptNumber: payment.receiptNumber,
        newReceiptNumber,
        editedById: input.editedById,
      },
    });

    return this.prisma.payment.update({
      where: { id: input.paymentId },
      data: { receiptNumber: newReceiptNumber },
    });
  }

  async getLedger(studentId: string, academicYearId: string) {
    const assessment = await this.getStudentAssessment(studentId, academicYearId);
    if (!assessment) {
      return null;
    }
    return assessment;
  }
}
