export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type ResourceType = 'PDF' | 'Video' | 'Document' | 'Link';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const DEFAULT_FEMALE_LEARNER_AVATAR = 'assets/learner-default-female.png';
export const DEFAULT_MALE_LEARNER_AVATAR = 'assets/learner-default-male.png';

export interface AuthenticatedPortalUser {
  email?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface TeacherProfile {
  name: string;
  email: string;
  department: string;
  phone: string;
  advisoryClass: string;
}

export interface TeacherClass {
  id: string;
  section: string;
  subject: string;
  schedule: string;
  room: string;
  studentIds: string[];
}

export interface TeacherStudent {
  id: string;
  name: string;
  studentNo: string;
  gradeLevel: string;
  gender?: string;
  guardian: string;
  contact: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
}

export interface GradeRecord {
  id: string;
  classId: string;
  studentId: string;
  quarter: Quarter;
  written: number | null;
  performance: number | null;
  exam: number | null;
}

export interface TeacherResource {
  id: string;
  classId: string;
  title: string;
  type: ResourceType;
  subject: string;
  size: string;
  uploadedAt: string;
}

export interface TeacherAnnouncement {
  id: string;
  audience: string;
  title: string;
  body: string;
  postedAt: string;
}

export interface DailyLessonLog {
  id: string;
  classId: string;
  date: string;
  objectives: string;
  activities: string;
  materials: string;
  remarks: string;
}

export interface TeacherMessage {
  id: string;
  thread: string;
  sender: string;
  audience: 'Student' | 'Parent' | 'Admin';
  message: string;
  sentAt: string;
}

export interface TeacherPortalState {
  teacher: TeacherProfile;
  classes: TeacherClass[];
  students: TeacherStudent[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  resources: TeacherResource[];
  dlls: DailyLessonLog[];
  announcements: TeacherAnnouncement[];
  messages: TeacherMessage[];
}

export interface DashboardSummary {
  myClasses: number;
  totalStudents: number;
  pendingGrades: number;
  attendanceToday: number;
}

export function buildTeacherDashboardSummary(
  classes: TeacherClass[],
  attendance: AttendanceRecord[],
  grades: GradeRecord[],
  today: string,
): DashboardSummary {
  const totalStudents = new Set(classes.flatMap(section => section.studentIds)).size;
  return {
    myClasses: classes.length,
    totalStudents,
    pendingGrades: grades.filter(grade => calculateQuarterAverage(grade) === null).length,
    attendanceToday: attendance.filter(record => record.date === today).length,
  };
}

export function calculateQuarterAverage(grade: Pick<GradeRecord, 'written' | 'performance' | 'exam'>): number | null {
  if (grade.written === null || grade.performance === null || grade.exam === null) {
    return null;
  }

  return Math.round((grade.written + grade.performance + grade.exam) / 3);
}

export function buildAttendanceSummary(records: AttendanceRecord[]): Record<AttendanceStatus, number> {
  return records.reduce<Record<AttendanceStatus, number>>(
    (summary, record) => {
      summary[record.status] += 1;
      return summary;
    },
    { Present: 0, Absent: 0, Late: 0, Excused: 0 },
  );
}

export function buildLearnerAttendanceInsights(
  records: AttendanceRecord[],
  studentId: string,
  year: number,
  monthIndex: number,
) {
  const emptyTotals = (): Record<AttendanceStatus, number> => ({ Present: 0, Absent: 0, Late: 0, Excused: 0 });
  const studentRecords = records
    .filter(record => record.studentId === studentId)
    .sort((first, second) => first.date.localeCompare(second.date));
  const yearMonths = Array.from({ length: 12 }, emptyTotals);
  const monthRecords: AttendanceRecord[] = [];

  for (const record of studentRecords) {
    const date = new Date(`${record.date}T00:00:00`);
    if (date.getFullYear() !== year) {
      continue;
    }

    yearMonths[date.getMonth()][record.status] += 1;
    if (date.getMonth() === monthIndex) {
      monthRecords.push(record);
    }
  }

  return {
    totals: buildAttendanceSummary(monthRecords),
    monthRecords,
    yearMonths,
  };
}

export function filterTeacherResources(resources: TeacherResource[], query: string): TeacherResource[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return resources;
  }

  return resources.filter(resource =>
    [resource.title, resource.type, resource.subject, resource.size]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}

export function buildTeacherDisplayName(user?: AuthenticatedPortalUser | null): string {
  const explicitName = user?.name?.trim();
  if (explicitName) {
    return explicitName;
  }

  const fullName = [user?.firstName, user?.lastName]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(' ');

  if (fullName) {
    return fullName;
  }

  return user?.email?.trim() || 'Teacher';
}

export function buildTeacherStudentInitials(student: Pick<TeacherStudent, 'name' | 'studentNo'>): string {
  const nameParts = student.name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return student.studentNo.trim()[0]?.toUpperCase() || 'L';
}

export function teacherStudentAvatarSource(student: Pick<TeacherStudent, 'gender' | 'photoUrl'>): string {
  const uploadedPhoto = student.photoUrl?.trim();
  if (uploadedPhoto) {
    return uploadedPhoto;
  }

  const gender = student.gender?.trim().toLowerCase();
  if (gender === 'female') {
    return DEFAULT_FEMALE_LEARNER_AVATAR;
  }
  if (gender === 'male') {
    return DEFAULT_MALE_LEARNER_AVATAR;
  }

  return '';
}

export function buildTeacherPortalInitialState(user?: AuthenticatedPortalUser | null): TeacherPortalState {
  return {
    teacher: {
      name: buildTeacherDisplayName(user),
      email: user?.email?.trim() || '',
      department: '',
      phone: '',
      advisoryClass: 'No advisory class assigned',
    },
    classes: [],
    students: [],
    attendance: [],
    grades: [],
    resources: [],
    dlls: [],
    announcements: [],
    messages: [],
  };
}

export function isLegacyTeacherSeedState(state: Pick<TeacherPortalState, 'teacher' | 'students' | 'classes'>): boolean {
  return (
    (state.teacher?.department === 'Basic Education' && state.teacher?.phone === '0917 100 2026') ||
    state.classes?.some(section => section.id.startsWith('class-g')) ||
    state.students?.some(student => /^stu-\d{3}$/.test(student.id))
  );
}
