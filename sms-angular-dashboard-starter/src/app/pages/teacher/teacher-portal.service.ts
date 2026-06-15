import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import {
  AttendanceStatus,
  buildTeacherPortalInitialState,
  DailyLessonLog,
  isLegacyTeacherSeedState,
  Quarter,
  ResourceType,
  TeacherMessage,
  TeacherPortalState,
} from './teacher-portal.util';

const STORAGE_KEY = 'sfxsai.teacher.portal.state.v2';
const LEGACY_STORAGE_KEY = 'sfxsai.teacher.portal.state.v1';

@Injectable({ providedIn: 'root' })
export class TeacherPortalService {
  private readonly auth = inject(AuthService);
  private readonly stateSubject = new BehaviorSubject<TeacherPortalState>(this.loadState());
  readonly state$ = this.stateSubject.asObservable();

  snapshot(): TeacherPortalState {
    return this.stateSubject.value;
  }

  updateTeacherProfile(profile: TeacherPortalState['teacher']) {
    this.patch({ teacher: profile });
    this.auth.updateCurrentUser({ name: profile.name, email: profile.email });
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
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    const fallback = buildTeacherPortalInitialState(this.currentUser());
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return fallback;
    }

    try {
      const state = JSON.parse(stored) as TeacherPortalState;
      if (!state || typeof state !== 'object') {
        localStorage.removeItem(STORAGE_KEY);
        return fallback;
      }

      if (isLegacyTeacherSeedState(state)) {
        localStorage.removeItem(STORAGE_KEY);
        return fallback;
      }

      return this.normalizeState(state, fallback);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return fallback;
    }
  }

  private normalizeState(state: TeacherPortalState, fallback: TeacherPortalState): TeacherPortalState {
    return {
      teacher: { ...fallback.teacher, ...(state.teacher ?? {}) },
      classes: Array.isArray(state.classes) ? state.classes : [],
      students: Array.isArray(state.students) ? state.students : [],
      attendance: Array.isArray(state.attendance) ? state.attendance : [],
      grades: Array.isArray(state.grades) ? state.grades : [],
      resources: Array.isArray(state.resources) ? state.resources : [],
      dlls: Array.isArray(state.dlls) ? state.dlls : [],
      announcements: Array.isArray(state.announcements) ? state.announcements : [],
      messages: Array.isArray(state.messages) ? state.messages : [],
    };
  }

  private currentUser() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as { email?: string; name?: string; firstName?: string; lastName?: string };
    } catch {
      return null;
    }
  }
}
