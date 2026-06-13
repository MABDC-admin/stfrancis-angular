import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
  StudentAssignment,
  StudentAssignmentStatus,
  StudentAttendance,
  StudentClass,
  StudentGrade,
  StudentResource,
  StudentResourceType,
} from './student-portal.util';

export interface StudentProfile {
  name: string;
  email: string;
  studentNo: string;
  gradeLevel: string;
  section: string;
  adviser: string;
  contact: string;
  guardian: string;
  address: string;
}

export interface StudentAnnouncement {
  id: string;
  scope: 'School-wide' | 'Class';
  classId?: string;
  title: string;
  body: string;
  postedAt: string;
  important: boolean;
  read: boolean;
}

export interface StudentMessage {
  id: string;
  thread: string;
  sender: string;
  message: string;
  sentAt: string;
  mine: boolean;
}

export interface StudentLesson {
  id: string;
  classId: string;
  title: string;
  description: string;
  status: 'New' | 'Viewed' | 'Completed';
}

export interface StudentSubmission {
  id: string;
  assignmentId: string;
  submittedAt: string;
  fileName: string;
  note: string;
}

export interface StudentPortalState {
  profile: StudentProfile;
  classes: StudentClass[];
  lessons: StudentLesson[];
  assignments: StudentAssignment[];
  submissions: StudentSubmission[];
  attendance: StudentAttendance[];
  grades: StudentGrade[];
  resources: StudentResource[];
  announcements: StudentAnnouncement[];
  messages: StudentMessage[];
}

const STORAGE_KEY = 'sfxsai.student.portal.state.v1';
const today = new Date().toISOString().slice(0, 10);

const initialState: StudentPortalState = {
  profile: {
    name: 'Lee Brent Cubian',
    email: 'student1@sfxsai.com',
    studentNo: 'SFX-2026-2027-001',
    gradeLevel: 'G7',
    section: 'St. Clare',
    adviser: 'Maria Santos',
    contact: '09606527032',
    guardian: 'Elygen Ruado',
    address: 'Brgy. Maljo, Inopacan, Leyte',
  },
  classes: [
    { id: 'class-math', subject: 'Mathematics', teacher: 'Ms. Maria Santos', schedule: 'Mon/Wed/Fri 8:00 AM', room: 'Room 201', progress: 72 },
    { id: 'class-science', subject: 'Science', teacher: 'Mr. Carlo Reyes', schedule: 'Tue/Thu 9:30 AM', room: 'Science Lab', progress: 64 },
    { id: 'class-english', subject: 'English', teacher: 'Ms. Ana Lim', schedule: 'Mon/Wed 1:00 PM', room: 'Room 305', progress: 81 },
    { id: 'class-filipino', subject: 'Filipino', teacher: 'Mr. Noel Cruz', schedule: 'Tue/Fri 2:00 PM', room: 'Room 204', progress: 58 },
  ],
  lessons: [
    { id: 'lesson-1', classId: 'class-math', title: 'Equivalent Fractions', description: 'Compare, simplify, and order fractions.', status: 'Viewed' },
    { id: 'lesson-2', classId: 'class-science', title: 'Cell Structure', description: 'Identify parts of plant and animal cells.', status: 'New' },
    { id: 'lesson-3', classId: 'class-english', title: 'Narrative Writing', description: 'Plan a clear beginning, middle, and ending.', status: 'Completed' },
  ],
  assignments: [
    { id: 'assignment-1', classId: 'class-math', title: 'Fraction Worksheet', dueDate: '2026-06-15', status: 'In progress' },
    { id: 'assignment-2', classId: 'class-science', title: 'Lab Reflection', dueDate: '2026-06-16', status: 'Not started' },
    { id: 'assignment-3', classId: 'class-english', title: 'Short Story Draft', dueDate: '2026-06-12', status: 'Submitted' },
    { id: 'assignment-4', classId: 'class-filipino', title: 'Talata Exercise', dueDate: '2026-06-10', status: 'Graded' },
  ],
  submissions: [
    { id: 'submission-1', assignmentId: 'assignment-3', submittedAt: '2026-06-11 7:22 PM', fileName: 'short-story-draft.docx', note: 'Submitted first draft.' },
  ],
  attendance: [
    { id: 'att-1', classId: 'class-math', date: today, status: 'Present' },
    { id: 'att-2', classId: 'class-science', date: today, status: 'Late' },
    { id: 'att-3', classId: 'class-english', date: '2026-06-12', status: 'Present' },
    { id: 'att-4', classId: 'class-filipino', date: '2026-06-11', status: 'Absent' },
  ],
  grades: [
    { id: 'grade-1', classId: 'class-math', quarter: 'Q1', written: 91, performance: 93, exam: 92 },
    { id: 'grade-2', classId: 'class-science', quarter: 'Q1', written: 84, performance: 86, exam: 83 },
    { id: 'grade-3', classId: 'class-english', quarter: 'Q1', written: 89, performance: 91, exam: 88 },
    { id: 'grade-4', classId: 'class-filipino', quarter: 'Q1', written: 82, performance: 85, exam: 84 },
  ],
  resources: [
    { id: 'resource-1', classId: 'class-math', title: 'Fractions Reviewer', subject: 'Mathematics', type: 'PDF', size: '2.1 MB' },
    { id: 'resource-2', classId: 'class-science', title: 'Cell Structure Video', subject: 'Science', type: 'Video', size: '18 MB' },
    { id: 'resource-3', classId: 'class-english', title: 'Narrative Planner', subject: 'English', type: 'Worksheet', size: '800 KB' },
  ],
  announcements: [
    { id: 'ann-1', scope: 'School-wide', title: 'Flag Ceremony Reminder', body: 'All learners must be in proper uniform before 7:20 AM.', postedAt: '2026-06-13', important: true, read: false },
    { id: 'ann-2', scope: 'Class', classId: 'class-math', title: 'Math Quiz', body: 'Review equivalent fractions and mixed numbers.', postedAt: '2026-06-12', important: false, read: false },
  ],
  messages: [
    { id: 'msg-1', thread: 'Ms. Maria Santos', sender: 'Ms. Santos', message: 'Please review your worksheet before Friday.', sentAt: '8:15 AM', mine: false },
  ],
};

@Injectable({ providedIn: 'root' })
export class StudentPortalService {
  private readonly stateSubject = new BehaviorSubject<StudentPortalState>(this.loadState());
  readonly state$ = this.stateSubject.asObservable();

  snapshot(): StudentPortalState {
    return this.stateSubject.value;
  }

  updateProfile(profile: StudentProfile) {
    this.patch({ profile });
  }

  markAnnouncementRead(id: string) {
    this.patch({
      announcements: this.snapshot().announcements.map(item => item.id === id ? { ...item, read: true } : item),
    });
  }

  submitAssignment(assignmentId: string, fileName: string, note: string) {
    const current = this.snapshot();
    this.patch({
      assignments: current.assignments.map(item => item.id === assignmentId ? { ...item, status: 'Submitted' as StudentAssignmentStatus } : item),
      submissions: [
        {
          id: crypto.randomUUID(),
          assignmentId,
          submittedAt: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
          fileName: fileName || 'Text submission',
          note,
        },
        ...current.submissions,
      ],
    });
  }

  addResource(classId: string, title: string, subject: string, type: StudentResourceType) {
    this.patch({
      resources: [
        { id: crypto.randomUUID(), classId, title, subject, type, size: 'Ready' },
        ...this.snapshot().resources,
      ],
    });
  }

  sendMessage(thread: string, message: string) {
    this.patch({
      messages: [
        { id: crypto.randomUUID(), thread, sender: 'You', message, sentAt: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), mine: true },
        ...this.snapshot().messages,
      ],
    });
  }

  private patch(partial: Partial<StudentPortalState>) {
    const next = { ...this.snapshot(), ...partial };
    this.stateSubject.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  private loadState(): StudentPortalState {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return initialState;
    }

    try {
      return JSON.parse(stored) as StudentPortalState;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return initialState;
    }
  }
}
