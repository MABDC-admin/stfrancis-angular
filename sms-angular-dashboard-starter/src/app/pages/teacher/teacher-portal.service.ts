import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, of, tap, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import {
  AttendanceStatus,
  buildTeacherPortalInitialState,
  DailyLessonLog,
  isLegacyTeacherSeedState,
  Quarter,
  ResourceType,
  TeacherMessage,
  TeacherPortalState,
  TeacherScheduleWeekday,
} from './teacher-portal.util';

const LEGACY_STORAGE_KEY = 'sfxsai.teacher.portal.state.v1';

@Injectable({ providedIn: 'root' })
export class TeacherPortalService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/teacher`;
  private readonly stateSubject = new BehaviorSubject<TeacherPortalState>(
    buildTeacherPortalInitialState(this.currentUser()),
  );
  readonly state$ = this.stateSubject.asObservable();

  private readonly aiInsightsSubject = new BehaviorSubject<string>('');
  readonly aiInsights$ = this.aiInsightsSubject.asObservable();

  constructor() {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    this.loadPortal();
  }

  snapshot(): TeacherPortalState {
    return this.stateSubject.value;
  }

  loadAnalyticsInsights() {
    this.aiInsightsSubject.next('Analyzing class data...');
    this.http.get<{ insights: string }>(`${this.apiUrl}/analytics/insights`).pipe(
      tap(res => this.aiInsightsSubject.next(res.insights)),
      catchError(() => {
        this.aiInsightsSubject.next('Failed to load AI insights. Please try again later.');
        return of(null);
      })
    ).subscribe();
  }

  updateTeacherProfile(profile: TeacherPortalState['teacher']) {
    this.auth.updateCurrentUser({ name: profile.name, email: profile.email });
    this.mutate('patch', 'profile', profile);
  }

  markAttendance(classId: string, studentId: string, date: string, status: AttendanceStatus, reason = '') {
    this.mutate('post', 'attendance', { classId, studentId, date, status, reason });
  }

  upsertGrade(classId: string, studentId: string, quarter: Quarter, written: number | null, performance: number | null, exam: number | null) {
    this.mutate('post', 'grades', { classId, studentId, quarter, written, performance, exam });
  }

  addResource(classId: string, title: string, type: ResourceType, subject: string) {
    this.mutate('post', 'resources', { classId, title, type, subject });
  }

  deleteResource(id: string) {
    this.deleteAndRefresh(`resources/${id}`);
  }

  addDll(entry: Omit<DailyLessonLog, 'id'>) {
    this.mutate('post', 'dlls', entry);
  }

  deleteDll(id: string) {
    this.deleteAndRefresh(`dlls/${id}`);
  }

  addAnnouncement(audience: string, title: string, body: string) {
    this.mutate('post', 'announcements', { audience, title, body });
  }

  deleteAnnouncement(id: string) {
    this.deleteAndRefresh(`announcements/${id}`);
  }

  sendMessage(thread: string, audience: TeacherMessage['audience'], message: string) {
    this.mutate('post', 'messages', { thread, audience, message });
  }

  addScheduleEntry(weekday: TeacherScheduleWeekday, title: string, startTime: string) {
    this.mutate('post', 'schedule-entries', { weekday, title, startTime });
  }

  deleteScheduleEntry(id: string) {
    this.deleteAndRefresh(`schedule-entries/${id}`);
  }

  loadPortal() {
    this.http.get<TeacherPortalState>(`${this.apiUrl}/portal`).pipe(
      tap(state => this.stateSubject.next(this.normalizeState(state, this.snapshot()))),
      catchError(() => of(null)),
    ).subscribe();
  }

  private mutate(method: 'post' | 'patch', path: string, body: unknown) {
    const request = method === 'post'
      ? this.http.post<TeacherPortalState>(`${this.apiUrl}/${path}`, body)
      : this.http.patch<TeacherPortalState>(`${this.apiUrl}/${path}`, body);

    request.pipe(
      tap(state => this.stateSubject.next(this.normalizeState(state, this.snapshot()))),
      catchError(() => of(null)),
    ).subscribe();
  }

  private deleteAndRefresh(path: string) {
    this.http.delete<TeacherPortalState>(`${this.apiUrl}/${path}`).pipe(
      tap(state => this.stateSubject.next(this.normalizeState(state, this.snapshot()))),
      catchError(() => of(null)),
    ).subscribe();
  }

  private normalizeState(state: TeacherPortalState, fallback: TeacherPortalState): TeacherPortalState {
    if (isLegacyTeacherSeedState(state)) {
      return fallback;
    }

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
      scheduleEntries: Array.isArray(state.scheduleEntries) ? state.scheduleEntries : [],
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

  getStudentAcademicProfile(studentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/students/${studentId}/academic-profile`);
  }

  getStudentAcademicInsights(studentId: string): Observable<{ insights: string }> {
    return this.http.get<{ insights: string }>(`${this.apiUrl}/students/${studentId}/academic-insights`);
  }
}
