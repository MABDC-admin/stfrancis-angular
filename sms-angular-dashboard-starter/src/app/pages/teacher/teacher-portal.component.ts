import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AttendanceStatus,
  buildAttendanceSummary,
  buildTeacherDashboardSummary,
  calculateQuarterAverage,
  filterTeacherResources,
  GradeRecord,
  Quarter,
  ResourceType,
  TeacherClass,
  TeacherPortalState,
  TeacherStudent,
} from './teacher-portal.util';
import { TeacherPortalService } from './teacher-portal.service';

type TeacherView =
  | 'dashboard'
  | 'profile'
  | 'classes'
  | 'attendance'
  | 'grades'
  | 'schedule'
  | 'resources'
  | 'dll'
  | 'announcements'
  | 'messages'
  | 'analytics'
  | 'settings';

@Component({
  selector: 'app-teacher-portal',
  standalone: true,
  imports: [FormsModule, NgClass, NgFor, NgIf, RouterLink],
  templateUrl: './teacher-portal.component.html',
  styleUrl: './teacher-portal.component.scss',
})
export class TeacherPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly teacherStore = inject(TeacherPortalService);

  readonly state = signal<TeacherPortalState>(this.teacherStore.snapshot());
  readonly currentView = signal<TeacherView>('dashboard');
  readonly selectedClassId = signal('');
  readonly selectedQuarter = signal<Quarter>('Q1');
  readonly attendanceDate = signal(new Date().toISOString().slice(0, 10));
  readonly resourceSearch = signal('');

  profileForm = { ...this.state().teacher };
  resourceForm = { title: '', type: 'PDF' as ResourceType, subject: '' };
  dllForm = { objectives: '', activities: '', materials: '', remarks: '' };
  announcementForm = { audience: 'All students', title: '', body: '' };
  messageForm: { thread: string; audience: 'Student' | 'Parent' | 'Admin'; message: string } = { thread: '', audience: 'Admin', message: '' };
  passwordForm = { current: '', next: '', confirm: '' };
  readonly toast = signal<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  readonly selectedClass = computed(() => this.state().classes.find(section => section.id === this.selectedClassId()) ?? this.state().classes[0] ?? null);
  readonly selectedClassStudents = computed(() => this.studentsForClass(this.selectedClass()?.id));
  readonly hasClasses = computed(() => this.state().classes.length > 0);
  readonly selectedClassSectionName = computed(() => this.selectedClass()?.section || 'No class selected');
  readonly selectedClassSubjectName = computed(() => this.selectedClass()?.subject || 'Class');
  readonly teacherMeta = computed(() => [
    this.state().teacher.department || 'Department not set',
    this.state().teacher.advisoryClass || 'No advisory class assigned',
    'SFXSAI',
  ].join(' • '));
  readonly dashboardSummary = computed(() =>
    buildTeacherDashboardSummary(this.state().classes, this.state().attendance, this.state().grades, this.attendanceDate()),
  );
  readonly attendanceSummary = computed(() => buildAttendanceSummary(this.state().attendance));
  readonly filteredResources = computed(() => filterTeacherResources(this.state().resources, this.resourceSearch()));

  readonly attendanceStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
  readonly quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  readonly resourceTypes: ResourceType[] = ['PDF', 'Video', 'Document', 'Link'];
  readonly modules = [
    { label: 'Dashboard', route: 'dashboard', icon: 'space_dashboard' },
    { label: 'Profile', route: 'profile', icon: 'badge' },
    { label: 'My Classes', route: 'classes', icon: 'class' },
    { label: 'Attendance', route: 'attendance', icon: 'fact_check' },
    { label: 'Grades', route: 'grades', icon: 'leaderboard' },
    { label: 'Schedule', route: 'schedule', icon: 'calendar_month' },
    { label: 'Resources', route: 'resources', icon: 'folder' },
    { label: 'DLL', route: 'dll', icon: 'menu_book' },
    { label: 'Announcements', route: 'announcements', icon: 'campaign' },
    { label: 'Messages', route: 'messages', icon: 'chat' },
    { label: 'Analytics', route: 'analytics', icon: 'query_stats' },
    { label: 'Settings', route: 'settings', icon: 'settings' },
  ];

  ngOnInit(): void {
    this.teacherStore.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state.set(state);
      this.profileForm = { ...state.teacher };
      if (!state.classes.some(section => section.id === this.selectedClassId())) {
        this.selectedClassId.set(state.classes[0]?.id ?? '');
      }
    });

    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.currentView.set((data['teacherView'] ?? 'dashboard') as TeacherView);
    });
  }

  studentsForClass(classId?: string): TeacherStudent[] {
    const section = this.state().classes.find(item => item.id === classId);
    if (!section) {
      return [];
    }

    return section.studentIds
      .map(id => this.state().students.find(student => student.id === id))
      .filter((student): student is TeacherStudent => !!student);
  }

  attendanceFor(studentId: string): AttendanceStatus {
    return this.state().attendance.find(record =>
      record.classId === this.selectedClass()?.id &&
      record.studentId === studentId &&
      record.date === this.attendanceDate()
    )?.status ?? 'Present';
  }

  setAttendance(studentId: string, status: AttendanceStatus) {
    const section = this.selectedClass();
    if (!section) return;
    this.teacherStore.markAttendance(section.id, studentId, this.attendanceDate(), status);
    this.showToast('success', 'Attendance updated.');
  }

  gradeFor(studentId: string): GradeRecord | undefined {
    const section = this.selectedClass();
    return this.state().grades.find(grade => grade.classId === section?.id && grade.studentId === studentId && grade.quarter === this.selectedQuarter());
  }

  gradeValue(studentId: string, key: 'written' | 'performance' | 'exam'): number | null {
    return this.gradeFor(studentId)?.[key] ?? null;
  }

  updateGrade(studentId: string, key: 'written' | 'performance' | 'exam', value: string) {
    const section = this.selectedClass();
    if (!section) return;

    const current = this.gradeFor(studentId);
    const nextValue = value === '' ? null : Math.max(0, Math.min(100, Number(value)));
    this.teacherStore.upsertGrade(
      section.id,
      studentId,
      this.selectedQuarter(),
      key === 'written' ? nextValue : current?.written ?? null,
      key === 'performance' ? nextValue : current?.performance ?? null,
      key === 'exam' ? nextValue : current?.exam ?? null,
    );
  }

  averageFor(studentId: string): number | null {
    const grade = this.gradeFor(studentId);
    return grade ? calculateQuarterAverage(grade) : null;
  }

  saveProfile() {
    const form = this.profileForm;
    if (!form.name.trim() || !form.email.trim()) {
      this.showToast('error', 'Name and email are required.');
      return;
    }

    this.teacherStore.updateTeacherProfile(form);
    this.showToast('success', 'Profile settings saved.');
  }

  addResource() {
    const form = this.resourceForm;
    const section = this.selectedClass();
    if (!section || !form.title.trim() || !form.subject.trim()) {
      this.showToast('error', section ? 'Resource title and subject are required.' : 'Assign a class before adding resources.');
      return;
    }

    this.teacherStore.addResource(section.id, form.title, form.type, form.subject);
    this.resourceForm = { title: '', type: 'PDF', subject: '' };
    this.showToast('success', 'Resource added.');
  }

  addDll() {
    const form = this.dllForm;
    const section = this.selectedClass();
    if (!section || !form.objectives.trim() || !form.activities.trim()) {
      this.showToast('error', section ? 'Objectives and activities are required.' : 'Assign a class before saving a DLL.');
      return;
    }

    this.teacherStore.addDll({ classId: section.id, date: this.attendanceDate(), ...form });
    this.dllForm = { objectives: '', activities: '', materials: '', remarks: '' };
    this.showToast('success', 'Daily Lesson Log saved.');
  }

  addAnnouncement() {
    const form = this.announcementForm;
    if (!form.title.trim() || !form.body.trim()) {
      this.showToast('error', 'Announcement title and message are required.');
      return;
    }

    this.teacherStore.addAnnouncement(form.audience, form.title, form.body);
    this.announcementForm = { audience: 'All students', title: '', body: '' };
    this.showToast('success', 'Announcement posted.');
  }

  sendMessage() {
    const form = this.messageForm;
    if (!form.thread.trim() || !form.message.trim()) {
      this.showToast('error', 'Recipient and message are required.');
      return;
    }

    this.teacherStore.sendMessage(form.thread, form.audience, form.message);
    this.messageForm = { ...form, message: '' };
    this.showToast('success', 'Message sent.');
  }

  changePassword() {
    const form = this.passwordForm;
    if (!form.current || !form.next || form.next !== form.confirm) {
      this.showToast('error', 'Password fields are incomplete or do not match.');
      return;
    }

    this.passwordForm = { current: '', next: '', confirm: '' };
    this.showToast('success', 'Password change request validated.');
  }

  classCompletionPercent(section: TeacherClass): number {
    const completed = section.studentIds.filter(studentId => this.averageForStudentInClass(section.id, studentId) !== null).length;
    return section.studentIds.length ? Math.round((completed / section.studentIds.length) * 100) : 0;
  }

  averageForStudentInClass(classId: string, studentId: string): number | null {
    const grade = this.state().grades.find(item => item.classId === classId && item.studentId === studentId && item.quarter === this.selectedQuarter());
    return grade ? calculateQuarterAverage(grade) : null;
  }

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ show: true, type, message });
    window.setTimeout(() => this.toast.set({ ...this.toast(), show: false }), 2500);
  }
}
