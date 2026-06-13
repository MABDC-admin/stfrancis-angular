export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type ResourceType = 'PDF' | 'Video' | 'Document' | 'Link';
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

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
  guardian: string;
  contact: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
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
