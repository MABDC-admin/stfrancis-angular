import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  buildAssignmentCompletionRate,
  buildAttendancePercentage,
  buildStudentDashboardSummary,
  calculateGeneralAverage,
  filterPendingAssignments,
  filterStudentResources,
  isPendingAssignmentStatus,
  nextPendingAssignmentId,
  performanceLabelFor,
  StudentAssignment,
  StudentClass,
  StudentQuarter,
  subjectAverage,
} from './student-portal.util';
import { StudentPortalService, StudentPortalState } from './student-portal.service';
import { displayGradeLevel } from '../../core/data/grade-levels';
import { PortalVideoBackdropComponent } from '../../shared/portal-video-backdrop/portal-video-backdrop.component';

type StudentView =
  | 'dashboard'
  | 'profile'
  | 'classes'
  | 'assignments'
  | 'grades'
  | 'attendance'
  | 'schedule'
  | 'resources'
  | 'announcements'
  | 'messages'
  | 'submissions'
  | 'progress'
  | 'settings';

@Component({
  selector: 'app-student-portal',
  standalone: true,
  imports: [FormsModule, NgClass, NgFor, NgIf, RouterLink, PortalVideoBackdropComponent],
  templateUrl: './student-portal.component.html',
  styleUrl: './student-portal.component.scss',
})
export class StudentPortalComponent implements OnInit {
  readonly store = inject(StudentPortalService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<StudentPortalState>(this.store.snapshot());
  readonly currentView = signal<StudentView>('dashboard');
  readonly selectedClassId = signal('class-math');
  readonly selectedQuarter = signal<StudentQuarter>('Q1');
  readonly resourceSearch = signal('');
  readonly selectedAssignmentId = signal('assignment-1');
  readonly toast = signal<{ show: boolean; type: 'success' | 'error'; message: string }>({ show: false, type: 'success', message: '' });

  profileForm = { ...this.state().profile };
  submissionForm = { fileName: '', note: '' };
  resourceForm = { title: '', subject: '', type: 'PDF' as const };
  messageForm = { thread: 'Ms. Maria Santos', message: '' };
  settingsForm = { currentPassword: '', newPassword: '', confirmPassword: '', emailAlerts: true, assignmentAlerts: true, themePreview: false };

  readonly today = new Date().toISOString().slice(0, 10);
  readonly modules = [
    { label: 'Dashboard', route: 'dashboard', icon: 'space_dashboard' },
    { label: 'Profile', route: 'profile', icon: 'account_circle' },
    { label: 'My Classes', route: 'classes', icon: 'class' },
    { label: 'Assignments', route: 'assignments', icon: 'assignment' },
    { label: 'Grades', route: 'grades', icon: 'bar_chart' },
    { label: 'Attendance', route: 'attendance', icon: 'fact_check' },
    { label: 'Schedule', route: 'schedule', icon: 'calendar_month' },
    { label: 'Resources', route: 'resources', icon: 'folder' },
    { label: 'Announcements', route: 'announcements', icon: 'campaign' },
    { label: 'Messages', route: 'messages', icon: 'chat' },
    { label: 'Submit Work', route: 'submissions', icon: 'upload_file' },
    { label: 'Progress', route: 'progress', icon: 'query_stats' },
    { label: 'Settings', route: 'settings', icon: 'settings' },
  ];

  readonly dashboardSummary = computed(() =>
    buildStudentDashboardSummary(this.state().classes, this.state().assignments, this.state().attendance, this.state().grades, this.today),
  );
  readonly selectedClass = computed(() => this.state().classes.find(item => item.id === this.selectedClassId()) ?? this.state().classes[0]);
  readonly filteredResources = computed(() => filterStudentResources(this.state().resources, this.resourceSearch()));
  readonly attendancePercent = computed(() => buildAttendancePercentage(this.state().attendance));
  readonly assignmentPercent = computed(() => buildAssignmentCompletionRate(this.state().assignments));
  readonly generalAverage = computed(() => calculateGeneralAverage(this.state().grades));
  readonly unreadAnnouncements = computed(() => this.state().announcements.filter(item => !item.read).length);
  readonly pendingAssignments = computed(() => filterPendingAssignments(this.state().assignments));
  readonly completedAssignments = computed(() => this.state().assignments.filter(item => !isPendingAssignmentStatus(item.status)));
  readonly displayGradeLevel = displayGradeLevel;

  ngOnInit(): void {
    this.store.state$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state.set(state);
      this.profileForm = { ...state.profile };
      this.selectedAssignmentId.set(nextPendingAssignmentId(state.assignments, this.selectedAssignmentId()));
    });

    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.currentView.set((data['studentView'] ?? 'dashboard') as StudentView);
    });
  }

  className(classId: string): string {
    return this.state().classes.find(item => item.id === classId)?.subject ?? 'Class';
  }

  classResources(classId: string) {
    return this.state().resources.filter(item => item.classId === classId);
  }

  classAssignments(classId: string) {
    return this.state().assignments.filter(item => item.classId === classId);
  }

  classLessons(classId: string) {
    return this.state().lessons.filter(item => item.classId === classId);
  }

  gradeFor(section: StudentClass) {
    return this.state().grades.find(item => item.classId === section.id && item.quarter === this.selectedQuarter());
  }

  averageFor(section: StudentClass): number {
    const grade = this.gradeFor(section);
    return grade ? subjectAverage(grade) : 0;
  }

  performanceFor(section: StudentClass): string {
    return performanceLabelFor(this.averageFor(section));
  }

  performanceLabel(average: number): string {
    return performanceLabelFor(average);
  }

  assignmentTitle(assignmentId: string): string {
    return this.state().assignments.find(item => item.id === assignmentId)?.title ?? 'Assignment';
  }

  selectedAssignment(): StudentAssignment | undefined {
    return this.state().assignments.find(item => item.id === this.selectedAssignmentId());
  }

  statusClass(status: StudentAssignment['status']): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  saveProfile() {
    if (!this.profileForm.contact.trim() || !this.profileForm.guardian.trim()) {
      this.showToast('error', 'Contact and guardian are required.');
      return;
    }
    this.store.updateProfile(this.profileForm);
    this.showToast('success', 'Profile contact details saved.');
  }

  submitSelectedAssignment() {
    const assignment = this.selectedAssignment();
    if (!assignment) {
      this.showToast('error', 'Select an assignment first.');
      return;
    }
    if (!this.submissionForm.fileName.trim() && !this.submissionForm.note.trim()) {
      this.showToast('error', 'Add a file name or text submission note.');
      return;
    }
    this.store.submitAssignment(assignment.id, this.submissionForm.fileName, this.submissionForm.note);
    this.submissionForm = { fileName: '', note: '' };
    this.showToast('success', 'Assignment submitted.');
  }

  addResourceMock() {
    if (!this.resourceForm.title.trim() || !this.resourceForm.subject.trim()) {
      this.showToast('error', 'Resource title and subject are required.');
      return;
    }
    this.store.addResource(this.selectedClass().id, this.resourceForm.title, this.resourceForm.subject, this.resourceForm.type);
    this.resourceForm = { title: '', subject: '', type: 'PDF' };
    this.showToast('success', 'Resource entry added.');
  }

  sendMessage() {
    if (!this.messageForm.message.trim()) {
      this.showToast('error', 'Message cannot be blank.');
      return;
    }
    this.store.sendMessage(this.messageForm.thread, this.messageForm.message);
    this.messageForm = { ...this.messageForm, message: '' };
    this.showToast('success', 'Message sent.');
  }

  changePassword() {
    if (!this.settingsForm.currentPassword || !this.settingsForm.newPassword || this.settingsForm.newPassword !== this.settingsForm.confirmPassword) {
      this.showToast('error', 'Password fields are incomplete or do not match.');
      return;
    }
    this.settingsForm = { ...this.settingsForm, currentPassword: '', newPassword: '', confirmPassword: '' };
    this.showToast('success', 'Password change request validated.');
  }

  markRead(id: string) {
    this.store.markAnnouncementRead(id);
    this.showToast('success', 'Announcement marked as read.');
  }

  private showToast(type: 'success' | 'error', message: string) {
    this.toast.set({ show: true, type, message });
    window.setTimeout(() => this.toast.set({ ...this.toast(), show: false }), 2500);
  }
}
