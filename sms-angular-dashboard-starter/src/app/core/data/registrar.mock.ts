import {
  AcademicRecord,
  DepEdFormRecord,
  DocumentRequest,
  DocumentRequirement,
  EnrollmentApplication,
  IdQrRecord,
  LearnerMovement,
  RegistrarKpi,
  RegistrarReportCard,
  SectionRecord,
  StudentRecord
} from '../models/registrar.models';
export { gradeLevels } from './grade-levels';

export const studentTypes = ['New', 'Continuing', 'Transferee', 'Returning'];

export const registrarKpis: RegistrarKpi[] = [
  { label: 'Active Learners', value: '0', helper: 'Across all grade levels', icon: 'groups', tone: 'green' },
  { label: 'For Enrollment Review', value: '0', helper: 'Applications pending', icon: 'assignment_turned_in', tone: 'blue' },
  { label: 'Document Deficiencies', value: '0', helper: 'Need follow-up', icon: 'folder_off', tone: 'amber' },
  { label: 'Section Slots Open', value: '0', helper: 'Available capacity', icon: 'event_seat', tone: 'cyan' }
];

export const students: StudentRecord[] = [
  {
    id: 'stu-001',
    studentNo: 'S-2026-0001',
    lrn: '103456789012',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    gradeLevel: 'Grade 7',
    section: 'St. Matthew',
    adviser: 'Ms. Jecille F. Buizon',
    studentType: 'New',
    enrollmentStatus: 'For Review',
    documentStatus: 'Complete',
    financeStatus: 'For Assessment',
    guardian: 'Ana Dela Cruz',
    contactNo: '0917 123 4567',
    address: 'Barangay San Roque, Quezon City',
    lastUpdated: 'Jun 10, 2026'
  },
  {
    id: 'stu-002',
    studentNo: 'S-2026-0002',
    lrn: '103456789013',
    firstName: 'Maria',
    lastName: 'Santos',
    gradeLevel: 'Grade 7',
    section: 'Unassigned',
    adviser: 'Pending',
    studentType: 'Transferee',
    enrollmentStatus: 'Missing Requirements',
    documentStatus: 'Incomplete',
    financeStatus: 'Unassessed',
    guardian: 'Ramon Santos',
    contactNo: '0918 222 3344',
    address: 'Barangay Bagong Pag-asa, Quezon City',
    lastUpdated: 'Jun 9, 2026'
  },
  {
    id: 'stu-003',
    studentNo: 'S-2026-0003',
    lrn: '103456789014',
    firstName: 'Angela',
    lastName: 'Reyes',
    gradeLevel: 'Kindergarten',
    section: 'Love',
    adviser: 'Mrs. Loida B. Peteros',
    studentType: 'Continuing',
    enrollmentStatus: 'Approved',
    documentStatus: 'Complete',
    financeStatus: 'Partially Paid',
    guardian: 'Mila Reyes',
    contactNo: '0919 777 4411',
    address: 'Project 8, Quezon City',
    lastUpdated: 'Jun 8, 2026'
  },
  {
    id: 'stu-004',
    studentNo: 'S-2026-0004',
    lrn: '103456789015',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    gradeLevel: 'Grade 8',
    section: 'St. Luke',
    adviser: 'Mr. Alvin Ramos',
    studentType: 'Returning',
    enrollmentStatus: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'Cleared',
    guardian: 'Elena Mendoza',
    contactNo: '0920 111 9087',
    address: 'Novaliches, Quezon City',
    lastUpdated: 'Jun 7, 2026'
  },
  {
    id: 'stu-005',
    studentNo: 'S-2026-0005',
    lrn: '103456789016',
    firstName: 'Lia',
    lastName: 'Garcia',
    gradeLevel: 'Grade 9',
    section: 'St. John',
    adviser: 'Ms. Karen Abad',
    studentType: 'Continuing',
    enrollmentStatus: 'Approved',
    documentStatus: 'Complete',
    financeStatus: 'With Balance',
    guardian: 'Nestor Garcia',
    contactNo: '0921 555 1002',
    address: 'Commonwealth, Quezon City',
    lastUpdated: 'Jun 7, 2026'
  }
];

export const enrollmentApplications: EnrollmentApplication[] = [
  {
    id: 'enr-001',
    applicationNo: 'ENR-2026-0001',
    studentName: 'Juan Dela Cruz',
    gradeLevel: 'Grade 7',
    studentType: 'New',
    status: 'For Review',
    documentStatus: 'Complete',
    financeStatus: 'For Assessment',
    submittedAt: 'Jun 10, 2026',
    reviewedBy: 'Registrar Staff',
    remarks: 'Ready for registrar approval.'
  },
  {
    id: 'enr-002',
    applicationNo: 'ENR-2026-0002',
    studentName: 'Maria Santos',
    gradeLevel: 'Grade 7',
    studentType: 'Transferee',
    status: 'Missing Requirements',
    documentStatus: 'Incomplete',
    financeStatus: 'Unassessed',
    submittedAt: 'Jun 9, 2026',
    reviewedBy: 'Registrar Staff',
    remarks: 'Waiting for SF9 upload.'
  },
  {
    id: 'enr-003',
    applicationNo: 'ENR-2026-0003',
    studentName: 'Angela Reyes',
    gradeLevel: 'Kindergarten',
    studentType: 'Continuing',
    status: 'Approved',
    documentStatus: 'Complete',
    financeStatus: 'Partially Paid',
    submittedAt: 'Jun 8, 2026',
    reviewedBy: 'Registrar Head',
    remarks: 'For final section confirmation.'
  },
  {
    id: 'enr-004',
    applicationNo: 'ENR-2026-0004',
    studentName: 'Carlos Mendoza',
    gradeLevel: 'Grade 8',
    studentType: 'Returning',
    status: 'Officially Enrolled',
    documentStatus: 'Complete',
    financeStatus: 'Cleared',
    submittedAt: 'Jun 7, 2026',
    reviewedBy: 'Registrar Head',
    remarks: 'Completed.'
  }
];

export const documentRequirements: DocumentRequirement[] = [
  { id: 'doc-001', studentName: 'Juan Dela Cruz', studentNo: 'S-2026-0001', requirement: 'PSA Birth Certificate', status: 'Verified', uploadedAt: 'Jun 10, 2026', verifiedBy: 'Registrar Staff', remarks: 'Clear copy' },
  { id: 'doc-002', studentName: 'Juan Dela Cruz', studentNo: 'S-2026-0001', requirement: 'SF9 / Report Card', status: 'Verified', uploadedAt: 'Jun 10, 2026', verifiedBy: 'Registrar Staff', remarks: 'Grade 6 completed' },
  { id: 'doc-003', studentName: 'Maria Santos', studentNo: 'S-2026-0002', requirement: 'SF9 / Report Card', status: 'Missing', uploadedAt: '-', verifiedBy: '-', remarks: 'Parent follow-up needed' },
  { id: 'doc-004', studentName: 'Maria Santos', studentNo: 'S-2026-0002', requirement: 'Good Moral Certificate', status: 'For Verification', uploadedAt: 'Jun 9, 2026', verifiedBy: 'Pending', remarks: 'Review stamp and signature' },
  { id: 'doc-005', studentName: 'Angela Reyes', studentNo: 'S-2026-0003', requirement: '2x2 Photo', status: 'Verified', uploadedAt: 'Jun 8, 2026', verifiedBy: 'Registrar Staff', remarks: 'Ready for ID' }
];

export const sections: SectionRecord[] = [
  { id: 'sec-001', gradeLevel: 'Pre-Kindergarten', sectionName: 'Joy', adviser: 'Ms. Jianne B. Briones', room: 'Room 101', capacity: 25, enrolled: 18, availableSlots: 7, status: 'Open' },
  { id: 'sec-002', gradeLevel: 'Kindergarten', sectionName: 'Love', adviser: 'Mrs. Loida B. Peteros', room: 'Room 102', capacity: 30, enrolled: 27, availableSlots: 3, status: 'Nearly Full' },
  { id: 'sec-003', gradeLevel: 'Grade 7', sectionName: 'St. Matthew', adviser: 'Ms. Jecille F. Buizon', room: 'Room 301', capacity: 40, enrolled: 36, availableSlots: 4, status: 'Open' },
  { id: 'sec-004', gradeLevel: 'Grade 8', sectionName: 'St. Luke', adviser: 'Mr. Alvin Ramos', room: 'Room 302', capacity: 40, enrolled: 38, availableSlots: 2, status: 'Nearly Full' },
  { id: 'sec-005', gradeLevel: 'Grade 9', sectionName: 'St. John', adviser: 'Ms. Karen Abad', room: 'Room 303', capacity: 40, enrolled: 31, availableSlots: 9, status: 'Open' }
];

export const academicRecords: AcademicRecord[] = [
  { id: 'acad-001', studentName: 'Juan Dela Cruz', gradeLevel: 'Grade 6', section: 'Faith', schoolYear: '2025–2026', generalAverage: '91.25', remarks: 'Promoted', status: 'Validated' },
  { id: 'acad-002', studentName: 'Maria Santos', gradeLevel: 'Grade 6', section: 'External School', schoolYear: '2025–2026', generalAverage: '88.40', remarks: 'For validation', status: 'For Review' },
  { id: 'acad-003', studentName: 'Angela Reyes', gradeLevel: 'Pre-Kindergarten', section: 'Joy', schoolYear: '2025–2026', generalAverage: '94.00', remarks: 'Promoted', status: 'Validated' },
  { id: 'acad-004', studentName: 'Carlos Mendoza', gradeLevel: 'Grade 7', section: 'St. Mark', schoolYear: '2025–2026', generalAverage: '89.50', remarks: 'Promoted', status: 'Validated' }
];

export const learnerMovements: LearnerMovement[] = [
  { id: 'mov-001', studentName: 'Juan Dela Cruz', movementType: 'New Enrollment', from: 'No previous record', to: 'Grade 7 - St. Matthew', effectiveDate: 'Jun 10, 2026', status: 'For Approval', requestedBy: 'Registrar Staff' },
  { id: 'mov-002', studentName: 'Maria Santos', movementType: 'Transfer In', from: 'Previous School', to: 'Grade 7 - Unassigned', effectiveDate: 'Jun 9, 2026', status: 'Pending Documents', requestedBy: 'Registrar Staff' },
  { id: 'mov-003', studentName: 'Angela Reyes', movementType: 'Promotion', from: 'Pre-Kindergarten - Joy', to: 'Kindergarten - Love', effectiveDate: 'Jun 8, 2026', status: 'Approved', requestedBy: 'Registrar Head' }
];

export const documentRequests: DocumentRequest[] = [
  { id: 'req-001', requestNo: 'DOC-2026-0001', studentName: 'Carlos Mendoza', documentType: 'Certificate of Enrollment', paymentStatus: 'Paid', requestStatus: 'Ready for Release', requestedAt: 'Jun 10, 2026', releaseDate: 'Jun 11, 2026' },
  { id: 'req-002', requestNo: 'DOC-2026-0002', studentName: 'Lia Garcia', documentType: 'Good Moral Certificate', paymentStatus: 'For Payment', requestStatus: 'For Verification', requestedAt: 'Jun 10, 2026', releaseDate: 'Pending' },
  { id: 'req-003', requestNo: 'DOC-2026-0003', studentName: 'Angela Reyes', documentType: 'Certified True Copy of SF9', paymentStatus: 'Paid', requestStatus: 'Processing', requestedAt: 'Jun 9, 2026', releaseDate: 'Jun 12, 2026' }
];

export const depedForms: DepEdFormRecord[] = [
  { id: 'sf1', formCode: 'SF1', formName: 'School Register', description: 'Official list of enrolled learners by section.', scope: 'Per section', status: 'Ready', lastGenerated: 'Jun 10, 2026' },
  { id: 'sf2', formCode: 'SF2', formName: 'Daily Attendance Report', description: 'Learner attendance monitoring report.', scope: 'Per class', status: 'Needs attendance data', lastGenerated: 'Not generated' },
  { id: 'sf9', formCode: 'SF9', formName: 'Learner Progress Report Card', description: 'Student report card per grading period.', scope: 'Per learner', status: 'Template ready', lastGenerated: 'Jun 8, 2026' },
  { id: 'sf10', formCode: 'SF10', formName: 'Learner Permanent Academic Record', description: 'Permanent academic record history.', scope: 'Per learner', status: 'For validation', lastGenerated: 'Jun 7, 2026' }
];

export const idQrRecords: IdQrRecord[] = [
  { id: 'qr-001', studentName: 'Juan Dela Cruz', studentNo: 'S-2026-0001', gradeSection: 'Grade 7 - St. Matthew', qrStatus: 'Generated', idStatus: 'For Printing', lastPrinted: 'Not printed', remarks: 'Ready for ID layout' },
  { id: 'qr-002', studentName: 'Maria Santos', studentNo: 'S-2026-0002', gradeSection: 'Grade 7 - Unassigned', qrStatus: 'Pending', idStatus: 'Blocked', lastPrinted: 'Not printed', remarks: 'Complete documents first' },
  { id: 'qr-003', studentName: 'Angela Reyes', studentNo: 'S-2026-0003', gradeSection: 'Kindergarten - Love', qrStatus: 'Generated', idStatus: 'Printed', lastPrinted: 'Jun 9, 2026', remarks: 'Issued to parent' }
];

export const registrarReports: RegistrarReportCard[] = [
  { title: 'Enrollment Summary', description: 'Enrollment count by grade level, section, student type, and status.', icon: 'summarize', frequency: 'Daily', owner: 'Registrar' },
  { title: 'Masterlist by Section', description: 'Printable class list with adviser, LRN, gender, and student number.', icon: 'groups', frequency: 'On demand', owner: 'Registrar' },
  { title: 'Document Deficiency Report', description: 'List of learners with missing or rejected requirements.', icon: 'folder_off', frequency: 'Weekly', owner: 'Registrar' },
  { title: 'Learner Movement Report', description: 'Transfer in/out, dropped, retained, promoted, and returning learner records.', icon: 'sync_alt', frequency: 'Monthly', owner: 'Registrar Head' },
  { title: 'DepEd Forms Export', description: 'Export-ready reports for SF1, SF2, SF9, and SF10 preparation.', icon: 'file_download', frequency: 'Quarterly', owner: 'Registrar Head' },
  { title: 'Finance Clearance List', description: 'Registrar view of finance clearance status for final enrollment.', icon: 'verified', frequency: 'Daily', owner: 'Registrar + Finance' }
];

export const requiredDocumentChecklist = [
  'PSA Birth Certificate',
  'SF9 / Report Card',
  'Good Moral Certificate',
  'Parent / Guardian ID',
  '2x2 Learner Photo',
  'Medical Record'
];
