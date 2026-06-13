export type StudentAssignmentStatus = 'Not started' | 'In progress' | 'Submitted' | 'Late' | 'Graded';
export type StudentAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type StudentResourceType = 'PDF' | 'Video' | 'Worksheet' | 'Document' | 'Link';
export type StudentQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface StudentClass {
  id: string;
  subject: string;
  teacher: string;
  schedule: string;
  room: string;
  progress: number;
}

export interface StudentGrade {
  id: string;
  classId: string;
  quarter: StudentQuarter;
  written: number;
  performance: number;
  exam: number;
}

export interface StudentAttendance {
  id: string;
  classId: string;
  date: string;
  status: StudentAttendanceStatus;
}

export interface StudentAssignment {
  id: string;
  classId: string;
  title: string;
  dueDate: string;
  status: StudentAssignmentStatus;
}

export interface StudentResource {
  id: string;
  classId: string;
  title: string;
  subject: string;
  type: StudentResourceType;
  size: string;
}

export interface StudentDashboardSummary {
  enrolledClasses: number;
  pendingAssignments: number;
  attendanceToday: string;
  generalAverage: number;
}

export function subjectAverage(grade: Pick<StudentGrade, 'written' | 'performance' | 'exam'>): number {
  return Math.round((grade.written + grade.performance + grade.exam) / 3);
}

export function calculateGeneralAverage(grades: Pick<StudentGrade, 'written' | 'performance' | 'exam'>[]): number {
  if (!grades.length) {
    return 0;
  }

  return Math.round(grades.reduce((sum, grade) => sum + subjectAverage(grade), 0) / grades.length);
}

export function buildAttendancePercentage(attendance: Pick<StudentAttendance, 'status'>[]): number {
  if (!attendance.length) {
    return 0;
  }

  const attended = attendance.filter(record => record.status === 'Present' || record.status === 'Late').length;
  return Math.round((attended / attendance.length) * 100);
}

export function buildAssignmentCompletionRate(assignments: Pick<StudentAssignment, 'status'>[]): number {
  if (!assignments.length) {
    return 0;
  }

  const completed = assignments.filter(item => item.status === 'Submitted' || item.status === 'Graded').length;
  return Math.round((completed / assignments.length) * 100);
}

export function isPendingAssignmentStatus(status: StudentAssignmentStatus): boolean {
  return status === 'Not started' || status === 'In progress' || status === 'Late';
}

export function filterPendingAssignments<T extends Pick<StudentAssignment, 'status'>>(assignments: T[]): T[] {
  return assignments.filter(assignment => isPendingAssignmentStatus(assignment.status));
}

export function nextPendingAssignmentId(assignments: StudentAssignment[], currentAssignmentId: string): string {
  const current = assignments.find(assignment => assignment.id === currentAssignmentId);
  if (current && isPendingAssignmentStatus(current.status)) {
    return current.id;
  }

  const firstPending = filterPendingAssignments(assignments)[0];
  if (firstPending) {
    return firstPending.id;
  }

  return current?.id ?? assignments[0]?.id ?? '';
}

export function performanceLabelFor(average: number): 'Excellent' | 'Good' | 'Needs Improvement' {
  if (average >= 90) {
    return 'Excellent';
  }

  if (average >= 80) {
    return 'Good';
  }

  return 'Needs Improvement';
}

export function buildStudentDashboardSummary(
  classes: StudentClass[],
  assignments: StudentAssignment[],
  attendance: StudentAttendance[],
  grades: StudentGrade[],
  today: string,
): StudentDashboardSummary {
  const todayStatuses = attendance
    .filter(record => record.date === today)
    .map(record => record.status);

  return {
    enrolledClasses: classes.length,
    pendingAssignments: filterPendingAssignments(assignments).length,
    attendanceToday: todayStatuses.length ? Array.from(new Set(todayStatuses)).join(' / ') : 'No class',
    generalAverage: calculateGeneralAverage(grades),
  };
}

export function filterStudentResources(resources: StudentResource[], query: string): StudentResource[] {
  const term = query.trim().toLowerCase();
  if (!term) {
    return resources;
  }

  return resources.filter(resource =>
    [resource.title, resource.subject, resource.type, resource.size]
      .join(' ')
      .toLowerCase()
      .includes(term),
  );
}
