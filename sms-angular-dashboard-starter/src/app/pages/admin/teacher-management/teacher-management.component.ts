import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { displayGradeLevel, gradeLevels } from '../../../core/data/grade-levels';
import { environment } from '../../../../environments/environment';
import {
  AdminTeacherRecord,
  TeacherAccountStatus,
  TeacherRole,
  adminTeacherRoles,
  buildTeacherRecord,
  createInitialTeacherForm,
  defaultAdminTeachers,
  generateTeacherPassword,
  teacherLoadSummaries,
  validateTeacherForm,
} from './teacher-management.util';
import { getSubjectsForGradeLevel } from '../../../shared/utils/curriculum.util';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-management.component.html',
  styleUrl: './teacher-management.component.scss',
})
export class TeacherManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/teachers`;

  readonly gradeLevels = gradeLevels;
  readonly roles = adminTeacherRoles;
  readonly displayGradeLevel = displayGradeLevel;

  get availableSubjects(): string[] {
    return getSubjectsForGradeLevel(this.form.assignedGradeLevel);
  }

  readonly teachers = signal<AdminTeacherRecord[]>([]);
  readonly selectedTeacherId = signal(defaultAdminTeachers[0]?.id ?? '');
  readonly selectedStatus = signal<'All' | TeacherAccountStatus>('All');
  readonly searchTerm = signal('');
  readonly toast = signal('');
  readonly errors = signal<string[]>([]);
  readonly isLoading = signal(false);

  form = createInitialTeacherForm();

  readonly filteredTeachers = computed(() => {
    const status = this.selectedStatus();
    const query = this.searchTerm().trim().toLowerCase();

    return this.teachers().filter(teacher => {
      const matchesStatus = status === 'All' || teacher.accountStatus === status;
      const haystack = [
        teacher.fullName,
        teacher.email,
        teacher.contactNumber,
        teacher.assignedGradeLevel,
        teacher.advisoryClass,
        teacher.subjects.join(' '),
        teacher.role,
      ].join(' ').toLowerCase();

      return matchesStatus && (!query || haystack.includes(query));
    });
  });

  readonly selectedTeacher = computed(() => {
    const teachers = this.teachers();
    return teachers.find(teacher => teacher.id === this.selectedTeacherId()) ?? teachers[0] ?? null;
  });

  readonly loadSummaries = computed(() => teacherLoadSummaries(this.teachers()));

  readonly totals = computed(() => {
    const teachers = this.teachers();
    return {
      total: teachers.length,
      active: teachers.filter(teacher => teacher.accountStatus === 'Active').length,
      advisory: teachers.filter(teacher => teacher.advisoryClass).length,
      locked: teachers.filter(teacher => teacher.accountStatus === 'Locked').length,
    };
  });

  ngOnInit() {
    this.loadTeachers();
  }

  createTeacher() {
    const errors = validateTeacherForm(this.form);
    this.errors.set(errors);
    if (errors.length) {
      return;
    }

    this.http.post<AdminTeacherRecord>(this.apiUrl, this.form).subscribe({
      next: record => {
        this.teachers.update(teachers => [record, ...teachers.filter(item => item.id !== record.id)]);
        this.selectedTeacherId.set(record.id);
        this.form = createInitialTeacherForm();
        this.showToast('Teacher account created.');
      },
      error: () => this.showToast('Unable to create teacher account. Check the API connection.'),
    });
  }

  setGeneratedPassword() {
    this.form.password = generateTeacherPassword(this.form.fullName || this.form.assignedGradeLevel || 'Teacher');
  }

  resetPassword(teacher: AdminTeacherRecord) {
    const password = generateTeacherPassword(teacher.fullName);
    this.http.patch<AdminTeacherRecord>(`${this.apiUrl}/${teacher.id}/password`, { password }).subscribe({
      next: record => {
        this.replaceTeacher({
          ...record,
          loginHistory: [`Password reset by admin`, ...record.loginHistory],
        });
        this.showToast(`Password reset prepared for ${teacher.fullName}.`);
      },
      error: () => this.showToast('Unable to reset password. Check the API connection.'),
    });
  }

  setStatus(teacher: AdminTeacherRecord, status: TeacherAccountStatus) {
    this.patchTeacher(teacher, { accountStatus: status }, `${teacher.fullName} status changed to ${status}.`);
  }

  promote(teacher: AdminTeacherRecord, role: TeacherRole) {
    this.patchTeacher(teacher, { role }, `${teacher.fullName} role updated to ${role}.`);
  }

  updateAssignment(teacher: AdminTeacherRecord, patch: Partial<AdminTeacherRecord>) {
    const optimistic = { ...teacher, ...patch };
    this.replaceTeacher(optimistic);
    this.http.patch<AdminTeacherRecord>(`${this.apiUrl}/${teacher.id}`, patch).subscribe({
      next: record => this.replaceTeacher(record),
      error: () => {
        this.replaceTeacher(teacher);
        this.showToast('Unable to save assignment change. Check the API connection.');
      },
    });
  }

  toggleSubject(subject: string, checked: boolean) {
    if (checked && !this.form.subjects.includes(subject)) {
      this.form.subjects = [...this.form.subjects, subject];
    } else if (!checked) {
      this.form.subjects = this.form.subjects.filter(item => item !== subject);
    }
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.form.profilePhotoUrl = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  }

  importCsv(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result ?? '').split(/\r?\n/).slice(1).filter(Boolean);
      const imported = rows.map(row => row.split(',')).filter(cells => cells.length >= 3).map(cells => ({
        ...buildTeacherRecord({
          ...createInitialTeacherForm(),
          fullName: cells[0]?.trim() ?? '',
          email: cells[1]?.trim() ?? '',
          contactNumber: cells[2]?.trim() ?? '',
          assignedGradeLevel: cells[3]?.trim() || 'Nursery',
          role: (cells[4]?.trim() as TeacherRole) || 'Teacher',
          subjects: (cells[5] ?? 'Homeroom').split('|').map(subject => subject.trim()).filter(Boolean),
        }),
        loginHistory: ['Imported from local CSV'],
      }));

      if (imported.length) {
        let completed = 0;
        imported.forEach(record => {
          this.http.post<AdminTeacherRecord>(this.apiUrl, {
            fullName: record.fullName,
            email: record.email,
            contactNumber: record.contactNumber,
            password: generateTeacherPassword(record.fullName),
            role: record.role,
            assignedGradeLevel: record.assignedGradeLevel,
            sectionAssignment: record.sectionAssignment,
            advisoryClass: record.advisoryClass,
            subjects: record.subjects,
            profilePhotoUrl: record.profilePhotoUrl,
          }).subscribe({
            next: created => {
              this.teachers.update(teachers => [created, ...teachers.filter(item => item.id !== created.id)]);
              completed += 1;
              if (completed === imported.length) {
                this.showToast(`${completed} teacher records imported.`);
              }
            },
            error: () => this.showToast('Some teacher records could not be imported.'),
          });
        });
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  exportTeachers() {
    const header = ['Full Name', 'Email', 'Contact Number', 'Grade Level', 'Advisory Class', 'Subjects', 'Status', 'Role', 'Date Created'];
    const rows = this.teachers().map(teacher => [
      teacher.fullName,
      teacher.email,
      teacher.contactNumber,
      teacher.assignedGradeLevel,
      teacher.advisoryClass,
      teacher.subjects.join('|'),
      teacher.accountStatus,
      teacher.role,
      teacher.dateCreated,
    ]);
    this.downloadCsv('sfxsai-teacher-list.csv', [header, ...rows]);
    this.showToast('Teacher list exported.');
  }

  generateLoadReport() {
    const header = ['Teacher', 'Classes', 'Advisory Class', 'Students', 'Subjects', 'Weekly Load'];
    const rows = this.loadSummaries().map(summary => [
      summary.fullName,
      String(summary.totalClassesHandled),
      summary.advisoryClass,
      String(summary.numberOfStudents),
      summary.subjectsAssigned,
      summary.weeklyTeachingLoad,
    ]);
    this.downloadCsv('sfxsai-teacher-load-report.csv', [header, ...rows]);
    this.showToast('Load report generated.');
  }

  resetAllPasswords() {
    const teachers = this.teachers();
    if (!teachers.length) {
      return;
    }

    let completed = 0;
    teachers.forEach(teacher => {
      this.http.patch<AdminTeacherRecord>(`${this.apiUrl}/${teacher.id}/password`, {
        password: generateTeacherPassword(teacher.fullName),
      }).subscribe({
        next: record => {
          this.replaceTeacher({
            ...record,
            loginHistory: ['Bulk password reset by admin', ...record.loginHistory],
          });
          completed += 1;
          if (completed === teachers.length) {
            this.showToast('All teacher password resets were prepared.');
          }
        },
        error: () => this.showToast('Some password resets failed. Check the API connection.'),
      });
    });
  }

  private downloadCsv(fileName: string, rows: string[][]) {
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private showToast(message: string) {
    this.toast.set(message);
    window.setTimeout(() => this.toast.set(''), 2500);
  }

  private loadTeachers() {
    this.isLoading.set(true);
    this.http.get<AdminTeacherRecord[]>(this.apiUrl).subscribe({
      next: teachers => {
        const source = teachers.length ? teachers : defaultAdminTeachers;
        this.teachers.set(source);
        this.selectedTeacherId.set(source[0]?.id ?? '');
        this.isLoading.set(false);
      },
      error: () => {
        this.teachers.set(defaultAdminTeachers);
        this.selectedTeacherId.set(defaultAdminTeachers[0]?.id ?? '');
        this.isLoading.set(false);
        this.showToast('API unavailable. Showing configured teacher records only.');
      },
    });
  }

  private patchTeacher(teacher: AdminTeacherRecord, patch: Partial<AdminTeacherRecord>, successMessage: string) {
    const optimistic = { ...teacher, ...patch };
    this.replaceTeacher(optimistic);
    this.http.patch<AdminTeacherRecord>(`${this.apiUrl}/${teacher.id}`, patch).subscribe({
      next: record => {
        this.replaceTeacher(record);
        this.showToast(successMessage);
      },
      error: () => {
        this.replaceTeacher(teacher);
        this.showToast('Unable to save teacher update. Check the API connection.');
      },
    });
  }

  private replaceTeacher(record: AdminTeacherRecord) {
    this.teachers.update(teachers => teachers.map(item => item.id === record.id ? record : item));
  }
}
