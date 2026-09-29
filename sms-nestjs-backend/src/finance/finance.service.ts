import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ne } from 'drizzle-orm';
import * as crypto from 'crypto';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

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
  constructor(private drizzle: DrizzleService) {}

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
    return this.drizzle.db.query.feeType.findMany({
      orderBy: [asc(schema.feeType.name)],
    });
  }

  async createFeeType(input: { name: string; description?: string }) {
    const now = new Date().toISOString();
    const [created] = await this.drizzle.db.insert(schema.feeType).values({
      id: crypto.randomUUID(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      updatedAt: now,
    }).returning();

    return created;
  }

  async updateFeeType(
    id: string,
    input: { name?: string; description?: string; isActive?: boolean },
  ) {
    const [updated] = await this.drizzle.db
      .update(schema.feeType)
      .set({
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description.trim() || null }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.feeType.id, id))
      .returning();

    return updated;
  }

  async deactivateFeeType(id: string) {
    const [updated] = await this.drizzle.db
      .update(schema.feeType)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(schema.feeType.id, id))
      .returning();
    return updated;
  }

  async deleteFeeType(id: string) {
    const [used] = await this.drizzle.db
      .select({ id: schema.studentAssessmentLineItem.id })
      .from(schema.studentAssessmentLineItem)
      .where(eq(schema.studentAssessmentLineItem.feeTypeId, id))
      .limit(1);

    if (used?.id) {
      throw new ConflictException(
        'Fee type is already used in an assessment. Deactivate it instead.',
      );
    }

    const [deleted] = await this.drizzle.db
      .delete(schema.feeType)
      .where(eq(schema.feeType.id, id))
      .returning();
    return deleted;
  }

  async listFeeTemplates(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.drizzle.db.query.feeTemplate.findMany({
      where: eq(schema.feeTemplate.academicYearId, academicYearId),
      with: {
        feeTemplateLineItems: {
          with: { feeType: true },
          orderBy: [asc(schema.feeTemplateLineItem.sortOrder)],
        },
      },
      orderBy: [asc(schema.feeTemplate.gradeLevel), asc(schema.feeTemplate.name)],
    });
  }

  async createFeeTemplate(input: {
    academicYearId: string;
    gradeLevel: string;
    name: string;
    lineItems: AssessmentLineItemInput[];
  }) {
    this.validateAcademicYear(input.academicYearId);
    const now = new Date().toISOString();

    const [template] = await this.drizzle.db
      .insert(schema.feeTemplate)
      .values({
        id: crypto.randomUUID(),
        academicYearId: input.academicYearId,
        gradeLevel: input.gradeLevel,
        name: input.name,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (input.lineItems.length) {
      await this.drizzle.db.insert(schema.feeTemplateLineItem).values(
        input.lineItems.map((item, index) => ({
          id: crypto.randomUUID(),
          feeTypeId: item.feeTypeId,
          feeTemplateId: template.id,
          description: item.description,
          amount: Number(item.amount),
          sortOrder: index,
        })),
      );
    }

    return this.drizzle.db.query.feeTemplate.findFirst({
      where: eq(schema.feeTemplate.id, template.id),
      with: {
        feeTemplateLineItems: {
          with: { feeType: true },
          orderBy: [asc(schema.feeTemplateLineItem.sortOrder)],
        },
      },
    });
  }

  async deactivateFeeTemplate(id: string) {
    const [updated] = await this.drizzle.db
      .update(schema.feeTemplate)
      .set({ isActive: false })
      .where(eq(schema.feeTemplate.id, id))
      .returning();
    return updated;
  }

  async deleteFeeTemplate(id: string) {
    const [used] = await this.drizzle.db
      .select({ id: schema.studentAssessment.id })
      .from(schema.studentAssessment)
      .where(eq(schema.studentAssessment.feeTemplateId, id))
      .limit(1);

    if (used?.id) {
      throw new ConflictException(
        'Fee template is already used in an assessment. Deactivate it instead.',
      );
    }

    const [deleted] = await this.drizzle.db
      .delete(schema.feeTemplate)
      .where(eq(schema.feeTemplate.id, id))
      .returning();
    return deleted;
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
    const existing = await this.drizzle.db.query.studentAssessment.findFirst({
      where: and(
        eq(schema.studentAssessment.studentId, input.studentId),
        eq(schema.studentAssessment.academicYearId, input.academicYearId),
      ),
    });

    const paidAmount = Number(existing?.paidAmount ?? 0);
    if (paidAmount > computed.netAmount) {
      throw new BadRequestException(
        'Updated assessment net amount cannot be lower than already paid amount.',
      );
    }

    const balance = computed.netAmount - paidAmount;
    const financeStatus = balance === 0 ? 'Cleared' : 'With Balance';
    const now = new Date().toISOString();

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
      updatedAt: now,
      updatedById: input.userId ?? null,
    };

    let assessment;
    if (existing) {
      [assessment] = await this.drizzle.db
        .update(schema.studentAssessment)
        .set(assessmentData)
        .where(eq(schema.studentAssessment.id, existing.id))
        .returning();

      await this.drizzle.db
        .delete(schema.studentAssessmentLineItem)
        .where(eq(schema.studentAssessmentLineItem.studentAssessmentId, existing.id));
    } else {
      [assessment] = await this.drizzle.db
        .insert(schema.studentAssessment)
        .values({
          ...assessmentData,
          id: crypto.randomUUID(),
          createdAt: now,
          createdById: input.userId ?? null,
        })
        .returning();
    }

    await this.drizzle.db.insert(schema.studentAssessmentLineItem).values(
      input.lineItems.map((item) => ({
        id: crypto.randomUUID(),
        studentAssessmentId: assessment.id,
        feeTypeId: item.feeTypeId,
        description: item.description,
        amount: Number(item.amount),
        sourceFeeTemplateLineItemId: item.sourceFeeTemplateLineItemId ?? null,
      })),
    );

    return assessment;
  }

  async listAssessments(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.drizzle.db.query.studentAssessment.findMany({
      where: eq(schema.studentAssessment.academicYearId, academicYearId),
      with: {
        student: true,
        studentAssessmentLineItems: { with: { feeType: true } },
        payments: {
          orderBy: [desc(schema.payment.paymentDate)],
        },
      },
      orderBy: [desc(schema.studentAssessment.updatedAt)],
    });
  }

  async getStudentAssessment(studentId: string, academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.drizzle.db.query.studentAssessment.findFirst({
      where: and(
        eq(schema.studentAssessment.studentId, studentId),
        eq(schema.studentAssessment.academicYearId, academicYearId),
      ),
      with: {
        student: true,
        studentAssessmentLineItems: {
          with: { feeType: true },
        },
        payments: {
          orderBy: [desc(schema.payment.paymentDate)],
        },
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

    const assessment = await this.drizzle.db.query.studentAssessment.findFirst({
      where: eq(schema.studentAssessment.id, input.studentAssessmentId),
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

    const duplicateReceipt = await this.drizzle.db.query.payment.findFirst({
      where: and(
        eq(schema.payment.academicYearId, input.academicYearId),
        eq(schema.payment.receiptNumber, input.receiptNumber.trim()),
      ),
    });
    if (duplicateReceipt) {
      throw new ConflictException(
        'Receipt/reference number already exists in this academic year.',
      );
    }

    const [payment] = await this.drizzle.db
      .insert(schema.payment)
      .values({
        id: crypto.randomUUID(),
        studentAssessmentId: input.studentAssessmentId,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        receiptNumber: input.receiptNumber.trim(),
        method: input.method,
        amount: Number(input.amount),
        paymentDate: input.paymentDate,
        remarks: input.remarks ?? null,
        encodedById: input.encodedById ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const paidAmount = Number(assessment.paidAmount) + Number(input.amount);
    const balance = Number(assessment.netAmount) - paidAmount;
    const [updatedAssessment] = await this.drizzle.db
      .update(schema.studentAssessment)
      .set({
        paidAmount,
        balance,
        financeStatus: balance === 0 ? 'Cleared' : 'With Balance',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.studentAssessment.id, assessment.id))
      .returning();

    const academicYear = await this.drizzle.db.query.academicYear.findFirst({
      where: eq(schema.academicYear.id, input.academicYearId),
    });
    if (academicYear?.isActive) {
      await this.drizzle.db.update(schema.student).set({
        financeStatus: updatedAssessment.financeStatus,
      }).where(eq(schema.student.id, input.studentId));
    }

    return { payment, assessment: updatedAssessment };
  }

  async listPayments(academicYearId: string) {
    this.validateAcademicYear(academicYearId);
    return this.drizzle.db.query.payment.findMany({
      where: eq(schema.payment.academicYearId, academicYearId),
      with: {
        student: true,
        studentAssessment: true,
      },
      orderBy: [desc(schema.payment.paymentDate)],
    });
  }

  async deletePayment(paymentId: string) {
    return this.drizzle.db.transaction(async (tx) => {
      const payment = await tx.query.payment.findFirst({
        where: eq(schema.payment.id, paymentId),
      });
      if (!payment) {
        throw new NotFoundException('Payment was not found.');
      }

      const assessment = await tx.query.studentAssessment.findFirst({
        where: eq(schema.studentAssessment.id, payment.studentAssessmentId),
      });
      if (!assessment) {
        throw new NotFoundException('Student assessment was not found.');
      }
      if (payment.academicYearId !== assessment.academicYearId) {
        throw new BadRequestException(
          'Payment academic year must match assessment academic year.',
        );
      }

      const [deletedPayment] = await tx
        .delete(schema.payment)
        .where(eq(schema.payment.id, paymentId))
        .returning();

      const remainingPayments = await tx.query.payment.findMany({
        where: and(
          eq(schema.payment.studentAssessmentId, assessment.id),
          eq(schema.payment.academicYearId, assessment.academicYearId),
        ),
      });

      const paidAmount = remainingPayments.reduce(
        (sum, entry) => sum + Number(entry.amount ?? 0),
        0,
      );
      const balance = Number(assessment.netAmount) - paidAmount;
      const financeStatus = balance === 0 ? 'Cleared' : 'With Balance';
      const now = new Date().toISOString();

      const [updatedAssessment] = await tx
        .update(schema.studentAssessment)
        .set({
          paidAmount,
          balance,
          financeStatus,
          updatedAt: now,
        })
        .where(eq(schema.studentAssessment.id, assessment.id))
        .returning();

      const academicYear = await tx.query.academicYear.findFirst({
        where: eq(schema.academicYear.id, assessment.academicYearId),
      });
      if (academicYear?.isActive) {
        await tx
          .update(schema.student)
          .set({
            financeStatus: updatedAssessment.financeStatus,
          })
          .where(eq(schema.student.id, assessment.studentId));
      }

      return { deletedPayment, assessment: updatedAssessment };
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

    const payment = await this.drizzle.db.query.payment.findFirst({
      where: eq(schema.payment.id, input.paymentId),
    });
    if (!payment) {
      throw new NotFoundException('Payment was not found.');
    }

    const newReceiptNumber = input.newReceiptNumber.trim();
    const duplicateReceipt = await this.drizzle.db.query.payment.findFirst({
      where: and(
        eq(schema.payment.academicYearId, payment.academicYearId),
        eq(schema.payment.receiptNumber, newReceiptNumber),
        ne(schema.payment.id, payment.id),
      ),
    });
    if (duplicateReceipt) {
      throw new ConflictException(
        'Receipt/reference number already exists in this academic year.',
      );
    }

    await this.drizzle.db.insert(schema.paymentReceiptAudit).values({
      id: crypto.randomUUID(),
      paymentId: input.paymentId,
      oldReceiptNumber: payment.receiptNumber,
      newReceiptNumber,
      editedById: input.editedById ?? null,
      editedAt: new Date().toISOString(),
    });

    const [updated] = await this.drizzle.db
      .update(schema.payment)
      .set({
        receiptNumber: newReceiptNumber,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.payment.id, input.paymentId))
      .returning();
    return updated;
  }

  async getLedger(studentId: string, academicYearId: string) {
    const assessment = await this.getStudentAssessment(studentId, academicYearId);
    if (!assessment) {
      return null;
    }
    return assessment;
  }
}
