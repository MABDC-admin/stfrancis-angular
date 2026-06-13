import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  buildExecutiveSummary,
  buildGradeEnrollment,
  findAtRiskStudents,
  PrincipalAudience,
  sortTeachersByWorkload,
  subjectPerformance,
} from './principal-portal.util';
import { PrincipalPortalService, PrincipalPortalState } from './principal-portal.service';

type PrincipalView =
  | 'dashboard'
  | 'teachers'
  | 'students'
  | 'classes'
  | 'performance'
  | 'attendance'
  | 'enrollment'
  | 'announcements'
  | 'reports'
  | 'alerts'
  | 'messages'
  | 'settings';

@Component({
  selector: 'app-principal-portal',
  standalone: true,
  imports: [FormsModule, NgClass, NgFor, NgIf, RouterLink],
  templateUrl: './principal-portal.component.html',
  styleUrl: './principal-portal.component.scss',
})
export class PrincipalPortalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly store = inject(PrincipalPortalService);

  readonly state = signal<PrincipalPortalState>(this.store.snapshot());
  readonly currentView = signal<PrincipalView>('dashboard');
  readonly gradeFilter = signal('All');
  readonly subjectFilter = signal('All');
  readonly toast = signal<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  profileForm = { ...this.state().principal };
  announcementForm = { audience: 'Entire school' as PrincipalAudience, title: '', body: '', pinned: false, scheduledFor: '2026-06-17 08:00' };
  messageForm = { recipient: 'Faculty Group', channel: 'Teacher' as const, body: '' };
  settingsForm = { academicYear: 'SY2026-2027', gradeConfig: 'Nursery, G1-G12', roleMode: 'View and audit only' };

  readonly modules = [
    { label: 'Executive Dashboard', route: 'dashboard', icon: 'space_dashboard' },
    { label: 'Teacher Overview', route: 'teachers', icon: 'groups_3' },
    { label: 'Student Analytics', route: 'students', icon: 'school' },
    { label: 'Classes & Sections', route: 'classes', icon: 'domain' },
    { label: 'Academic Performance', route: 'performance', icon: 'monitoring' },
    { label: 'Attendance Monitoring', route: 'attendance', icon: 'fact_check' },
    { label: 'Enrollment', route: 'enrollment', icon: 'how_to_reg' },
    { label: 'Announcements', route: 'announcements', icon: 'campaign' },
    { label: 'Reports Center', route: 'reports', icon: 'summarize' },
    { label: 'Alerts', route: 'alerts', icon: 'notification_important' },
    { label: 'Messaging', route: 'messages', icon: 'chat' },
    { label: 'Settings', route: 'settings', icon: 'settings' },
  ];

  readonly summary = computed(() => buildExecutiveSummary(this.state().students, this.state().teachers, this.state().classes));
  readonly gradeEnrollment = computed(() => buildGradeEnrollment(this.state().students));
  readonly atRiskStudents = computed(() => findAtRiskStudents(this.filteredStudents()));
  readonly teacherWorkload = computed(() => sortTeachersByWorkload(this.state().teachers));
  readonly subjectLeaders = computed(() => subjectPerformance(this.filteredSubjects()));
  readonly gradeLevels = computed(() => ['All', ...Array.from(new Set(this.state().students.map(student => student.gradeLevel)))]);
  readonly subjects = computed(() => ['All', ...Array.from(new Set(this.state().subjects.map(subject => subject.subject)))]);
  readonly filteredStudents = computed(() => {
    const grade = this.gradeFilter();
    return grade === 'All' ? this.state().students : this.state().students.filter(student => student.gradeLevel === grade);
  });
  readonly filteredSubjects = computed(() => {
    const subject = this.subjectFilter();
    return subject === 'All' ? this.state().subjects : this.state().subjects.filter(item => item.subject === subject);
  });

  ngOnInit(): void {
    this.store.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state.set(state);
      this.profileForm = { ...state.principal };
    });

    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.currentView.set((data['principalView'] ?? 'dashboard') as PrincipalView);
    });
  }

  percent(value: number): string {
    return `${Math.max(4, Math.min(100, value))}%`;
  }

  alertClass(severity: string): string {
    return severity.toLowerCase();
  }

  saveProfile() {
    if (!this.profileForm.name.trim() || !this.profileForm.email.trim()) {
      this.showToast('error', 'Principal name and email are required.');
      return;
    }
    this.store.updateProfile(this.profileForm);
    this.showToast('success', 'Principal profile settings saved.');
  }

  postAnnouncement() {
    if (!this.announcementForm.title.trim() || !this.announcementForm.body.trim()) {
      this.showToast('error', 'Announcement title and body are required.');
      return;
    }
    this.store.postAnnouncement({ ...this.announcementForm });
    this.announcementForm = { ...this.announcementForm, title: '', body: '', pinned: false };
    this.showToast('success', 'Announcement posted.');
  }

  sendMessage() {
    if (!this.messageForm.body.trim()) {
      this.showToast('error', 'Message cannot be blank.');
      return;
    }
    this.store.sendMessage(this.messageForm);
    this.messageForm = { ...this.messageForm, body: '' };
    this.showToast('success', 'Message sent.');
  }

  exportReport(type: string) {
    this.showToast('success', `${type} export prepared.`);
  }

  saveSettings() {
    this.showToast('success', 'System settings validated for leadership review.');
  }

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ show: true, type, message });
    window.setTimeout(() => this.toast.set({ ...this.toast(), show: false }), 2500);
  }
}
