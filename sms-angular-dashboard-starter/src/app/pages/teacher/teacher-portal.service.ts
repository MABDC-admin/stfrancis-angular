import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  AttendanceRecord,
  AttendanceStatus,
  GradeRecord,
  Quarter,
  ResourceType,
  TeacherClass,
  TeacherResource,
  TeacherStudent,
} from './teacher-portal.util';

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
  teacher: {
    name: string;
    email: string;
    department: string;
    phone: string;
    advisoryClass: string;
  };
  classes: TeacherClass[];
  students: TeacherStudent[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  resources: TeacherResource[];
  dlls: DailyLessonLog[];
  announcements: TeacherAnnouncement[];
  messages: TeacherMessage[];
}

const STORAGE_KEY = 'sfxsai.teacher.portal.state.v1';

const today = new Date().toISOString().slice(0, 10);

const initialState: TeacherPortalState = {
  teacher: {
    name: 'Maria Santos',
    email: 'teacher1@sfxsai.com',
    department: 'Basic Education',
    phone: '0917 100 2026',
    advisoryClass: 'G7 - St. Clare',
  },
  classes: [
    { id: 'class-g7-math', section: 'G7 - St. Clare', subject: 'Mathematics', schedule: 'Mon/Wed/Fri 8:00 AM', room: 'Room 201', studentIds: ['stu-001', 'stu-002', 'stu-003', 'stu-004'] },
    { id: 'class-g8-science', section: 'G8 - St. Agnes', subject: 'Science', schedule: 'Tue/Thu 9:30 AM', room: 'Science Lab', studentIds: ['stu-005', 'stu-006', 'stu-007'] },
    { id: 'class-g9-english', section: 'G9 - St. Ignatius', subject: 'English', schedule: 'Mon/Wed 1:00 PM', room: 'Room 305', studentIds: ['stu-008', 'stu-009', 'stu-010'] },
  ],
  students: [
    { id: 'stu-001', name: 'Lee Brent Cubian', studentNo: 'SFX-2026-2027-001', gradeLevel: 'G7', guardian: 'Elygen Ruado', contact: '09606527032' },
    { id: 'stu-002', name: 'Jean Kyrie Dadula', studentNo: 'SFX-2026-2027-002', gradeLevel: 'G7', guardian: 'Parent / Guardian', contact: '09000000002' },
    { id: 'stu-003', name: 'Mikhabellle Eilish Garbo', studentNo: 'SFX-2026-2027-003', gradeLevel: 'G7', guardian: 'Parent / Guardian', contact: '09000000003' },
    { id: 'stu-004', name: 'Austin Levi Lagario', studentNo: 'SFX-2026-2027-004', gradeLevel: 'G7', guardian: 'Parent / Guardian', contact: '09000000004' },
    { id: 'stu-005', name: 'Kyrztan Mark Llemit', studentNo: 'SFX-2026-2027-005', gradeLevel: 'G8', guardian: 'Parent / Guardian', contact: '09000000005' },
    { id: 'stu-006', name: 'Lance Pingal', studentNo: 'SFX-2026-2027-006', gradeLevel: 'G8', guardian: 'Parent / Guardian', contact: '09000000006' },
    { id: 'stu-007', name: 'Chris Louie Sayod', studentNo: 'SFX-2026-2027-007', gradeLevel: 'G8', guardian: 'Parent / Guardian', contact: '09000000007' },
    { id: 'stu-008', name: 'Danaya Selene Suralta', studentNo: 'SFX-2026-2027-008', gradeLevel: 'G9', guardian: 'Parent / Guardian', contact: '09000000008' },
    { id: 'stu-009', name: 'Zuriel Edelweiss Tabaranza', studentNo: 'SFX-2026-2027-009', gradeLevel: 'G9', guardian: 'Parent / Guardian', contact: '09000000009' },
    { id: 'stu-010', name: 'Alexys Verana', studentNo: 'SFX-2026-2027-010', gradeLevel: 'G9', guardian: 'Parent / Guardian', contact: '09000000010' },
  ],
  attendance: [
    { id: 'att-1', classId: 'class-g7-math', studentId: 'stu-001', date: today, status: 'Present' },
    { id: 'att-2', classId: 'class-g7-math', studentId: 'stu-002', date: today, status: 'Late' },
    { id: 'att-3', classId: 'class-g8-science', studentId: 'stu-005', date: today, status: 'Present' },
  ],
  grades: [
    { id: 'gr-1', classId: 'class-g7-math', studentId: 'stu-001', quarter: 'Q1', written: 90, performance: 92, exam: 91 },
    { id: 'gr-2', classId: 'class-g7-math', studentId: 'stu-002', quarter: 'Q1', written: null, performance: 87, exam: 89 },
    { id: 'gr-3', classId: 'class-g8-science', studentId: 'stu-005', quarter: 'Q1', written: 88, performance: 90, exam: 86 },
  ],
  resources: [
    { id: 'res-1', classId: 'class-g7-math', title: 'Week 1 Fraction Drills', type: 'PDF', subject: 'Mathematics', size: '1.2 MB', uploadedAt: '2026-06-10' },
    { id: 'res-2', classId: 'class-g8-science', title: 'Lab Safety Orientation', type: 'Video', subject: 'Science', size: '24 MB', uploadedAt: '2026-06-11' },
  ],
  dlls: [
    { id: 'dll-1', classId: 'class-g7-math', date: today, objectives: 'Compare and order fractions.', activities: 'Warm-up, guided examples, pair exercises.', materials: 'Worksheets, board, projector.', remarks: 'Need remediation for two learners.' },
  ],
  announcements: [
    { id: 'ann-1', audience: 'G7 - St. Clare', title: 'Quiz on Friday', body: 'Review equivalent fractions and basic operations.', postedAt: '2026-06-12' },
  ],
  messages: [
    { id: 'msg-1', thread: 'Admin Office', sender: 'Registrar', audience: 'Admin', message: 'Submit advisory attendance before 10 AM.', sentAt: '8:10 AM' },
  ],
};

@Injectable({ providedIn: 'root' })
export class TeacherPortalService {
  private readonly stateSubject = new BehaviorSubject<TeacherPortalState>(this.loadState());
  readonly state$ = this.stateSubject.asObservable();

  snapshot(): TeacherPortalState {
    return this.stateSubject.value;
  }

  updateTeacherProfile(profile: TeacherPortalState['teacher']) {
    this.patch({ teacher: profile });
  }

  markAttendance(classId: string, studentId: string, date: string, status: AttendanceStatus) {
    const current = this.snapshot();
    const existing = current.attendance.find(record => record.classId === classId && record.studentId === studentId && record.date === date);
    const attendance = existing
      ? current.attendance.map(record => record.id === existing.id ? { ...record, status } : record)
      : [...current.attendance, { id: crypto.randomUUID(), classId, studentId, date, status }];
    this.patch({ attendance });
  }

  upsertGrade(classId: string, studentId: string, quarter: Quarter, written: number | null, performance: number | null, exam: number | null) {
    const current = this.snapshot();
    const existing = current.grades.find(grade => grade.classId === classId && grade.studentId === studentId && grade.quarter === quarter);
    const nextGrade = { id: existing?.id ?? crypto.randomUUID(), classId, studentId, quarter, written, performance, exam };
    const grades = existing
      ? current.grades.map(grade => grade.id === existing.id ? nextGrade : grade)
      : [...current.grades, nextGrade];
    this.patch({ grades });
  }

  addResource(classId: string, title: string, type: ResourceType, subject: string) {
    this.patch({
      resources: [
        ...this.snapshot().resources,
        { id: crypto.randomUUID(), classId, title, type, subject, size: 'Pending upload', uploadedAt: new Date().toISOString().slice(0, 10) },
      ],
    });
  }

  deleteResource(id: string) {
    this.patch({ resources: this.snapshot().resources.filter(resource => resource.id !== id) });
  }

  addDll(entry: Omit<DailyLessonLog, 'id'>) {
    this.patch({ dlls: [{ ...entry, id: crypto.randomUUID() }, ...this.snapshot().dlls] });
  }

  deleteDll(id: string) {
    this.patch({ dlls: this.snapshot().dlls.filter(dll => dll.id !== id) });
  }

  addAnnouncement(audience: string, title: string, body: string) {
    this.patch({
      announcements: [{ id: crypto.randomUUID(), audience, title, body, postedAt: new Date().toISOString().slice(0, 10) }, ...this.snapshot().announcements],
    });
  }

  deleteAnnouncement(id: string) {
    this.patch({ announcements: this.snapshot().announcements.filter(announcement => announcement.id !== id) });
  }

  sendMessage(thread: string, audience: TeacherMessage['audience'], message: string) {
    this.patch({
      messages: [{ id: crypto.randomUUID(), thread, sender: 'You', audience, message, sentAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }, ...this.snapshot().messages],
    });
  }

  private patch(partial: Partial<TeacherPortalState>) {
    const state = { ...this.snapshot(), ...partial };
    this.stateSubject.next(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private loadState(): TeacherPortalState {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    try {
      return JSON.parse(stored) as TeacherPortalState;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
  }
}
