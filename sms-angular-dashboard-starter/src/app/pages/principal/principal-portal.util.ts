export type PrincipalStudentStatus = 'Active' | 'Pending' | 'Dropped';
export type PrincipalAudience = 'Entire school' | 'Teachers only' | 'Students only';

export interface PrincipalTeacher {
  id: string;
  name: string;
  department: string;
  classesHandled: number;
  attendanceRate: number;
  performance: number;
  status: string;
}

import { normalizeGradeLevel } from '../../core/data/grade-levels';

export interface PrincipalStudent {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  average: number;
  attendanceRate: number;
  status: PrincipalStudentStatus;
}

export interface PrincipalClassSection {
  id: string;
  gradeLevel: string;
  section: string;
  adviser: string;
  subject: string;
  enrollment: number;
  average: number;
  attendanceRate: number;
}

export interface PrincipalSubjectMetric {
  subject: string;
  gradeLevel: string;
  quarter: string;
  average: number;
  passRate: number;
}

export interface ExecutiveSummary {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  averagePerformance: number;
  enrollmentStatus: {
    active: number;
    pending: number;
    dropped: number;
  };
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function buildExecutiveSummary(
  students: PrincipalStudent[],
  teachers: PrincipalTeacher[],
  classes: PrincipalClassSection[],
): ExecutiveSummary {
  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    attendanceRate: average(students.map(student => student.attendanceRate)),
    averagePerformance: average(students.map(student => student.average)),
    enrollmentStatus: {
      active: students.filter(student => student.status === 'Active').length,
      pending: students.filter(student => student.status === 'Pending').length,
      dropped: students.filter(student => student.status === 'Dropped').length,
    },
  };
}

export function buildGradeEnrollment(students: PrincipalStudent[]): Array<{ gradeLevel: string; total: number }> {
  const counts = students.reduce<Record<string, number>>((acc, student) => {
    const gradeLevel = normalizeGradeLevel(student.gradeLevel);
    acc[gradeLevel] = (acc[gradeLevel] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([gradeLevel, total]) => ({ gradeLevel, total }))
    .sort((a, b) => a.gradeLevel.localeCompare(b.gradeLevel, undefined, { numeric: true }));
}

export function findAtRiskStudents(students: PrincipalStudent[]): PrincipalStudent[] {
  return students
    .filter(student => student.average < 75 || student.attendanceRate < 85)
    .sort((a, b) => (a.average + a.attendanceRate) - (b.average + b.attendanceRate));
}

export function sortTeachersByWorkload(teachers: PrincipalTeacher[]): PrincipalTeacher[] {
  return [...teachers].sort((a, b) => b.classesHandled - a.classesHandled || b.performance - a.performance);
}

export function subjectPerformance(subjects: PrincipalSubjectMetric[]): PrincipalSubjectMetric[] {
  return [...subjects].sort((a, b) => b.average - a.average || b.passRate - a.passRate);
}
