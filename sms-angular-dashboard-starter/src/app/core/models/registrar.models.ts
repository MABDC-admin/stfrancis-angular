export type RegistrarStatusTone = 'green' | 'blue' | 'amber' | 'rose' | 'violet' | 'slate' | 'cyan';

export interface RegistrarKpi {
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: RegistrarStatusTone;
}

export interface StudentRecord {
  id?: string;
  studentNo?: string;
  lrn: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthdate?: string;
  gender?: string;
  gradeLevel: string;
  section?: string;
  adviser?: string;
  studentType: string;
  enrollmentStatus: string;
  documentStatus: string;
  financeStatus: string;
  guardian?: string;
  contactNo?: string;
  address?: string;
  motherName?: string;
  motherContact?: string;
  fatherName?: string;
  fatherContact?: string;
  phAddress?: string;
  uaeAddress?: string;
  previousSchool?: string;
  enrollmentSubmittedAt?: string;
  lastUpdated?: string;
}

export interface EnrollmentApplication {
  id: string;
  applicationNo: string;
  studentName: string;
  gradeLevel: string;
  studentType: string;
  status: string;
  documentStatus: string;
  financeStatus: string;
  submittedAt: string;
  reviewedBy: string;
  remarks: string;
}

export interface DocumentRequirement {
  id: string;
  studentName: string;
  studentNo: string;
  requirement: string;
  status: string;
  uploadedAt: string;
  verifiedBy: string;
  remarks: string;
}

export interface SectionRecord {
  id: string;
  gradeLevel: string;
  sectionName: string;
  adviser: string;
  room: string;
  capacity: number;
  enrolled: number;
  availableSlots: number;
  status: string;
  academicYearId?: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  eventDate: string | Date;
  endDate?: string | Date;
  eventType: string; // 'Holiday', 'Exam', 'Meeting', 'Other'
  color?: string;
  academicYearId?: string;
}

export interface AcademicRecord {
  id: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  schoolYear: string;
  generalAverage: string;
  remarks: string;
  status: string;
  academicYearId?: string;
}

export interface LearnerMovement {
  id: string;
  studentName: string;
  movementType: string;
  from: string;
  to: string;
  effectiveDate: string;
  status: string;
  requestedBy: string;
}

export interface DocumentRequest {
  id: string;
  requestNo: string;
  studentName: string;
  documentType: string;
  paymentStatus: string;
  requestStatus: string;
  requestedAt: string;
  releaseDate: string;
}

export interface DepEdFormRecord {
  id: string;
  formCode: string;
  formName: string;
  description: string;
  scope: string;
  status: string;
  lastGenerated: string;
}

export interface IdQrRecord {
  id: string;
  studentName: string;
  studentNo: string;
  gradeSection: string;
  qrStatus: string;
  idStatus: string;
  lastPrinted: string;
  remarks: string;
}

export interface RegistrarReportCard {
  title: string;
  description: string;
  icon: string;
  frequency: string;
  owner: string;
}
