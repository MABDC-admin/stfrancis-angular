import { StudentRecord } from './registrar.models';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'GCash' | 'Card/POS';

export interface FeeType {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface FeeTemplateLineItem {
  id?: string;
  feeTemplateId?: string;
  feeTypeId: string;
  feeType?: FeeType;
  description: string;
  amount: number;
  sortOrder?: number;
}

export interface FeeTemplate {
  id: string;
  academicYearId: string;
  gradeLevel: string;
  name: string;
  isActive: boolean;
  lineItems: FeeTemplateLineItem[];
}

export interface StudentAssessmentLineItem {
  id?: string;
  feeTypeId: string;
  feeType?: FeeType;
  description: string;
  amount: number;
  sourceFeeTemplateLineItemId?: string | null;
}

export interface StudentAssessment {
  id: string;
  studentId: string;
  student?: StudentRecord;
  academicYearId: string;
  feeTemplateId?: string | null;
  regularDiscountPercent: number;
  siblingDiscountPercent: number;
  scholarshipDiscountPercent: number;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balance: number;
  financeStatus: string;
  lineItems?: StudentAssessmentLineItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  studentAssessmentId: string;
  studentId: string;
  student?: StudentRecord;
  academicYearId: string;
  receiptNumber: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  remarks?: string | null;
}

export interface SaveAssessmentPayload {
  studentId: string;
  academicYearId: string;
  feeTemplateId?: string;
  regularDiscountPercent: number;
  siblingDiscountPercent: number;
  scholarshipDiscountPercent: number;
  lineItems: StudentAssessmentLineItem[];
}

export interface RecordPaymentPayload {
  studentAssessmentId: string;
  studentId: string;
  academicYearId: string;
  receiptNumber: string;
  method: PaymentMethod;
  amount: number;
  paymentDate: string;
  remarks?: string;
}
