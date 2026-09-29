export type TeacherAccountStatus = 'Active' | 'Inactive' | 'Locked';
export type TeacherRole = 'Teacher' | 'Adviser' | 'Subject Teacher' | 'Coordinator' | 'Admin';

export interface AdminTeacherRecord {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  assignedGradeLevel: string;
  advisoryClass: string;
  subjects: string[];
  accountStatus: TeacherAccountStatus;
  role: TeacherRole;
  dateCreated: string;
  profilePhotoUrl: string;
  sectionAssignment: string;
  totalClassesHandled: number;
  numberOfStudents: number;
  weeklyHours: number;
  loginHistory: string[];
}

export interface TeacherFormModel {
  fullName: string;
  email: string;
  contactNumber: string;
  password: string;
  role: TeacherRole;
  assignedGradeLevel: string;
  sectionAssignment: string;
  advisoryClass: string;
  subjects: string[];
  profilePhotoUrl: string;
}

export interface TeacherLoadSummary {
  teacherId: string;
  fullName: string;
  totalClassesHandled: number;
  advisoryClass: string;
  hasAdvisoryClass: boolean;
  numberOfStudents: number;
  subjectsAssigned: string;
  weeklyTeachingLoad: string;
}

import { getSubjectsForGradeLevel } from '../../../shared/utils/curriculum.util';

export const adminTeacherRoles: TeacherRole[] = ['Teacher', 'Adviser', 'Subject Teacher', 'Coordinator', 'Admin'];

export const defaultAdminTeachers: AdminTeacherRecord[] = [
  {
    id: 'teacher-nursery-briones',
    fullName: 'J Briones',
    email: 'jbriones.13579@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'Nursery',
    advisoryClass: 'Nursery',
    subjects: getSubjectsForGradeLevel('Nursery'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Nursery',
    totalClassesHandled: 3,
    numberOfStudents: 10,
    weeklyHours: 18,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g1-ychemlie',
    fullName: 'Ychemlie',
    email: 'ychemlie@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G1',
    advisoryClass: 'Grade 1',
    subjects: getSubjectsForGradeLevel('G1'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 1',
    totalClassesHandled: 3,
    numberOfStudents: 8,
    weeklyHours: 18,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g2-johninmae',
    fullName: 'Johnin Mae Dadula',
    email: 'johninmae26dadula@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G2',
    advisoryClass: 'Grade 2',
    subjects: getSubjectsForGradeLevel('G2'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 2',
    totalClassesHandled: 3,
    numberOfStudents: 7,
    weeklyHours: 18,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g3-melody',
    fullName: 'Melody Dawn Dadios',
    email: 'melodydawndadios@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G3',
    advisoryClass: 'Grade 3',
    subjects: getSubjectsForGradeLevel('G3'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 3',
    totalClassesHandled: 3,
    numberOfStudents: 7,
    weeklyHours: 18,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g3-shaylene',
    fullName: 'Shaylene',
    email: 'shaylene0622@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G3',
    advisoryClass: '',
    subjects: getSubjectsForGradeLevel('G3').slice(0, 3),
    accountStatus: 'Active',
    role: 'Subject Teacher',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 3',
    totalClassesHandled: 3,
    numberOfStudents: 7,
    weeklyHours: 15,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g7-casandra',
    fullName: 'Casandra Dante',
    email: 'casandradante18@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G7',
    advisoryClass: 'Grade 7',
    subjects: getSubjectsForGradeLevel('G7'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 7',
    totalClassesHandled: 4,
    numberOfStudents: 9,
    weeklyHours: 22,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g8-alwina',
    fullName: 'Alwina Marie Estremos',
    email: 'alwinamarieestremos@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G8',
    advisoryClass: 'Grade 8',
    subjects: getSubjectsForGradeLevel('G8'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 8',
    totalClassesHandled: 4,
    numberOfStudents: 8,
    weeklyHours: 22,
    loginHistory: ['No login recorded locally'],
  },
  {
    id: 'teacher-g9-ababatsyrah',
    fullName: 'Ababatsyrah',
    email: 'ababatsyrah@gmail.com',
    contactNumber: '',
    assignedGradeLevel: 'G9',
    advisoryClass: 'Grade 9',
    subjects: getSubjectsForGradeLevel('G9'),
    accountStatus: 'Active',
    role: 'Adviser',
    dateCreated: '2026-06-15',
    profilePhotoUrl: '',
    sectionAssignment: 'Grade 9',
    totalClassesHandled: 4,
    numberOfStudents: 8,
    weeklyHours: 22,
    loginHistory: ['No login recorded locally'],
  },
];

export function createInitialTeacherForm(): TeacherFormModel {
  return {
    fullName: '',
    email: '',
    contactNumber: '',
    password: generateTeacherPassword('Teacher'),
    role: 'Teacher',
    assignedGradeLevel: 'Nursery',
    sectionAssignment: '',
    advisoryClass: '',
    subjects: [],
    profilePhotoUrl: '',
  };
}

export function generateTeacherPassword(seed: string): string {
  const clean = seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'SFXSAI';
  const stamp = Date.now().toString(36).slice(-4).toUpperCase();
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1).toLowerCase()}${stamp}26`;
}

export function validateTeacherForm(form: TeacherFormModel): string[] {
  const errors: string[] = [];

  if (!form.fullName.trim()) {
    errors.push('Full name is required.');
  }

  if (!form.email.trim()) {
    errors.push('Email address is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.push('Enter a valid email address.');
  }

  if (!form.contactNumber.trim()) {
    errors.push('Contact number is required.');
  }

  if (!form.subjects.length) {
    errors.push('At least one subject is required.');
  }

  return errors;
}

export function teacherLoadSummaries(teachers: AdminTeacherRecord[]): TeacherLoadSummary[] {
  return teachers.map(teacher => ({
    teacherId: teacher.id,
    fullName: teacher.fullName,
    totalClassesHandled: teacher.totalClassesHandled,
    advisoryClass: teacher.advisoryClass || 'No advisory class',
    hasAdvisoryClass: Boolean(teacher.advisoryClass),
    numberOfStudents: teacher.numberOfStudents,
    subjectsAssigned: teacher.subjects.join(', ') || 'No subjects assigned',
    weeklyTeachingLoad: `${teacher.weeklyHours} hrs/week`,
  }));
}

export function buildTeacherRecord(form: TeacherFormModel): AdminTeacherRecord {
  const advisoryClass = form.role === 'Adviser' ? (form.advisoryClass || form.sectionAssignment || form.assignedGradeLevel) : form.advisoryClass;

  return {
    id: `teacher-${Date.now()}`,
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    contactNumber: form.contactNumber.trim(),
    assignedGradeLevel: form.assignedGradeLevel,
    advisoryClass,
    subjects: [...form.subjects],
    accountStatus: 'Active',
    role: form.role,
    dateCreated: new Date().toISOString().slice(0, 10),
    profilePhotoUrl: form.profilePhotoUrl,
    sectionAssignment: form.sectionAssignment,
    totalClassesHandled: Math.max(1, form.subjects.length),
    numberOfStudents: 0,
    weeklyHours: Math.max(6, form.subjects.length * 5),
    loginHistory: ['Created locally by admin'],
  };
}
