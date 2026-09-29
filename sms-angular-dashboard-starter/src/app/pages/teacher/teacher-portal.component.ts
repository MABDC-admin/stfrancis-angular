import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AttendanceRecord,
  AttendanceStatus,
  buildLearnerAttendanceInsights,
  buildAttendanceSummary,
  buildTeacherDashboardSummary,
  buildTeacherStudentInitials,
  calculateQuarterAverage,
  filterTeacherResources,
  GradeRecord,
  Quarter,
  ResourceType,
  TeacherClass,
  TeacherPortalState,
  TeacherStudent,
  TeacherScheduleWeekday,
  teacherStudentAvatarSource,
} from './teacher-portal.util';
import { getSubjectsForGradeLevel } from '../../shared/utils/curriculum.util';
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
  | 'profiles'
  | 'settings';

@Component({
  selector: 'app-teacher-portal',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, NgClass, NgFor, NgIf, RouterLink],
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
  readonly selectedAttendanceStudentId = signal<string | null>(null);
  readonly attendanceViewMode = signal<'daily' | 'sf2'>('daily');
  readonly sf2SelectedMonth = signal<string>(new Date().toISOString().slice(0, 7));

  readonly academicProfile = signal<any>(null);
  readonly academicProfileInsights = signal<string | null>(null);
  readonly isAcademicProfileLoading = signal<boolean>(false);
  readonly scheduleDialogDay = signal<TeacherScheduleWeekday | null>(null);
  readonly aiInsights = signal<string>('');
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
  readonly selectedAttendanceStudent = computed(() =>
    this.state().students.find(student => student.id === this.selectedAttendanceStudentId()) ?? null,
  );
  readonly selectedAttendanceInsights = computed(() => {
    const selectedDate = new Date(`${this.attendanceDate()}T00:00:00`);
    return buildLearnerAttendanceInsights(
      this.state().attendance,
      this.selectedAttendanceStudentId() ?? '',
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
    );
  });

  readonly sf2Days = computed(() => {
    const monthStr = this.sf2SelectedMonth();
    if (!monthStr) return [];
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month - 1, i);
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        days.push(i);
      }
    }
    return days;
  });

  readonly sf2MatrixData = computed(() => {
    const students = this.selectedClassStudents();
    const attendance = this.state().attendance;
    const days = this.sf2Days();
    const [year, month] = this.sf2SelectedMonth().split('-');

    const processStudents = (genderList: any[]) => {
      return genderList.map(student => {
        let absent = 0;
        let tardy = 0;
        const dailyRecord: Record<number, string> = {};
        
        days.forEach(day => {
          const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const record = attendance.find(a => a.studentId === student.id && a.date === dateStr);
          if (record) {
            if (record.status === 'Present') dailyRecord[day] = 'P';
            else if (record.status === 'Absent') { dailyRecord[day] = 'X'; absent++; }
            else if (record.status === 'Late') { dailyRecord[day] = 'L'; tardy++; }
            else if (record.status === 'Excused') { dailyRecord[day] = 'E'; absent++; }
          } else {
            dailyRecord[day] = '';
          }
        });

        return { ...student, dailyRecord, absent, tardy, remarks: '' };
      });
    };

    const males = processStudents(students.filter(s => s.gender?.toLowerCase() === 'male'));
    const females = processStudents(students.filter(s => s.gender?.toLowerCase() === 'female'));
    
    return { males, females };
  });

  readonly sf2DailyTotals = computed(() => {
    const matrix = this.sf2MatrixData();
    const days = this.sf2Days();
    
    const calculateTotals = (list: any[]) => {
      const daily: Record<number, number> = {};
      let totalAbsent = 0;
      let totalTardy = 0;
      days.forEach(day => {
        daily[day] = list.filter(s => s.dailyRecord[day] !== 'X' && s.dailyRecord[day] !== 'E').length;
      });
      list.forEach(s => { totalAbsent += s.absent; totalTardy += s.tardy; });
      return { daily, absent: totalAbsent, tardy: totalTardy };
    };

    const maleTotals = calculateTotals(matrix.males);
    const femaleTotals = calculateTotals(matrix.females);
    
    const combinedDaily: Record<number, number> = {};
    days.forEach(day => { combinedDaily[day] = (maleTotals.daily[day] || 0) + (femaleTotals.daily[day] || 0); });

    return {
      males: maleTotals,
      females: femaleTotals,
      combined: { daily: combinedDaily, absent: maleTotals.absent + femaleTotals.absent, tardy: maleTotals.tardy + femaleTotals.tardy }
    };
  });

  readonly hasClasses = computed(() => this.state().classes.length > 0);
  readonly selectedClassSectionName = computed(() => this.selectedClass()?.section || 'No class selected');
  readonly selectedClassSubjectName = computed(() => this.selectedClass()?.subject || 'Class');
  readonly teacherMeta = computed(() => {
    const p = this.state().teacher;
    return [
      p.department || 'Department not set',
      p.assignedGradeLevel || 'Grade TBA',
      p.advisoryClass || 'No section assigned',
    ].filter(Boolean).join(' • ');
  });
  readonly dashboardSummary = computed(() =>
    buildTeacherDashboardSummary(this.state().classes, this.state().attendance, this.state().grades, this.attendanceDate()),
  );
  readonly attendanceSummary = computed(() => buildAttendanceSummary(this.state().attendance));
  readonly filteredResources = computed(() => filterTeacherResources(this.state().resources, this.resourceSearch()));

  readonly attendanceStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];
  readonly quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  readonly resourceTypes: ResourceType[] = ['PDF', 'Video', 'Document', 'Link'];
  readonly buildTeacherStudentInitials = buildTeacherStudentInitials;
  readonly learnerAvatarSource = teacherStudentAvatarSource;
  readonly monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
    return this.attendanceRecordFor(studentId)?.status ?? 'Present';
  }

  attendanceReasonFor(studentId: string): string {
    return this.attendanceRecordFor(studentId)?.reason ?? '';
  }

  attendanceRecordFor(studentId: string): AttendanceRecord | undefined {
    return this.state().attendance.find(record =>
      record.classId === this.selectedClass()?.id &&
      record.studentId === studentId &&
      record.date === this.attendanceDate()
    );
  }

  setAttendance(studentId: string, status: AttendanceStatus, reason = this.attendanceReasonFor(studentId)) {
    const section = this.selectedClass();
    if (!section) return;
    this.teacherStore.markAttendance(section.id, studentId, this.attendanceDate(), status, reason);
    this.showToast('success', 'Attendance updated.');
  }

  markAllPresent() {
    const section = this.selectedClass();
    const students = this.selectedClassStudents();
    if (!section || students.length === 0) return;

    const dateStr = this.attendanceDate();
    const currentAttendance = [...this.state().attendance];

    students.forEach(student => {
      const idx = currentAttendance.findIndex(a => a.studentId === student.id && a.date === dateStr);
      if (idx >= 0) {
        currentAttendance[idx] = { ...currentAttendance[idx], status: 'Present' };
      } else {
        currentAttendance.push({
          id: `temp-${student.id}-${Date.now()}`,
          classId: section.id,
          studentId: student.id,
          date: dateStr,
          status: 'Present'
        });
      }
      this.teacherStore.markAttendance(section.id, student.id, dateStr, 'Present', '');
    });

    this.state.set({ ...this.state(), attendance: currentAttendance });
    this.showToast('success', 'All students marked as Present.');
  }

  async exportToSF2Excel() {
    this.showToast('success', 'Preparing SF2 Excel Export...');
    try {
      const response = await fetch('assets/sf2-template.xlsx');
      const arrayBuffer = await response.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const sheet = workbook.worksheets[0];

      const section = this.selectedClass();
      if (section) {
        sheet.getCell('E5').value = '101234'; // Fake School ID
        sheet.getCell('J5').value = '2026-2027'; // School Year
        sheet.getCell('T5').value = this.monthNames[Number(this.sf2SelectedMonth().split('-')[1]) - 1] + ' ' + this.sf2SelectedMonth().split('-')[0];
        sheet.getCell('E7').value = 'SFXSAI'; // School Name
        sheet.getCell('W7').value = section.gradeLevel; // Grade Level
        sheet.getCell('AA7').value = section.section; // Section
      }

      const data = this.sf2MatrixData();
      const totals = this.sf2DailyTotals();
      const days = this.sf2Days();

      // Days header starts at D10
      days.forEach((day, index) => {
        const col = 4 + index; // D is 4
        sheet.getCell(10, col).value = day;
      });
      let maleTotalRow = 35;
      let femaleTotalRow = 61;
      let combinedTotalRow = 62;

      sheet.eachRow((row, rowNum) => {
        const val = row.getCell(1).value?.toString() || '';
        if (val.includes('MALE') && val.includes('TOTAL')) maleTotalRow = rowNum;
        if (val.includes('FEMALE') && val.includes('TOTAL')) femaleTotalRow = rowNum;
        if (val.toLowerCase().includes('combined') && val.toLowerCase().includes('total')) combinedTotalRow = rowNum;
      });

      let currentRow = 11;

      // Males
      data.males.forEach(student => {
        if (currentRow < maleTotalRow) {
          sheet.getCell(currentRow, 1).value = student.name;
          days.forEach((day, index) => {
            sheet.getCell(currentRow, 4 + index).value = student.dailyRecord[day] || '';
          });
          sheet.getCell(currentRow, 29).value = student.absent;
          sheet.getCell(currentRow, 30).value = student.tardy;
          currentRow++;
        }
      });

      // Male Totals
      currentRow = maleTotalRow;
      sheet.getCell(currentRow, 1).value = 'MALE | TOTAL Per Day';
      days.forEach((day, index) => {
        sheet.getCell(currentRow, 4 + index).value = totals.males.daily[day] || 0;
      });
      sheet.getCell(currentRow, 29).value = totals.males.absent;
      sheet.getCell(currentRow, 30).value = totals.males.tardy;

      // Females
      currentRow = maleTotalRow + 1;
      data.females.forEach(student => {
        if (currentRow < femaleTotalRow) {
          sheet.getCell(currentRow, 1).value = student.name;
          days.forEach((day, index) => {
            sheet.getCell(currentRow, 4 + index).value = student.dailyRecord[day] || '';
          });
          sheet.getCell(currentRow, 29).value = student.absent;
          sheet.getCell(currentRow, 30).value = student.tardy;
          currentRow++;
        }
      });

      // Female Totals
      currentRow = femaleTotalRow;
      sheet.getCell(currentRow, 1).value = 'FEMALE | TOTAL Per Day';
      days.forEach((day, index) => {
        sheet.getCell(currentRow, 4 + index).value = totals.females.daily[day] || 0;
      });
      sheet.getCell(currentRow, 29).value = totals.females.absent;
      sheet.getCell(currentRow, 30).value = totals.females.tardy;

      // Combined Totals
      currentRow = combinedTotalRow;
      sheet.getCell(currentRow, 1).value = 'Combined TOTAL PER DAY';
      days.forEach((day, index) => {
        sheet.getCell(currentRow, 4 + index).value = totals.combined.daily[day] || 0;
      });
      sheet.getCell(currentRow, 29).value = totals.combined.absent;
      sheet.getCell(currentRow, 30).value = totals.combined.tardy;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `SF2_${section?.section || 'Class'}_${this.sf2SelectedMonth()}.xlsx`);
    } catch (err) {
      console.error(err);
      this.showToast('error', 'Failed to generate Excel file.');
    }
  }

  updateAttendanceReason(studentId: string, reason: string) {
    const status = this.attendanceFor(studentId);
    if (status !== 'Absent' && status !== 'Excused') {
      return;
    }

    this.setAttendance(studentId, status, reason);
  }

  openAttendanceDialog(student: TeacherStudent) {
    this.selectedAttendanceStudentId.set(student.id);
  }

  closeAttendanceDialog() {
    this.selectedAttendanceStudentId.set(null);
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

  viewAcademicProfile(student: any) {
    this.academicProfile.set(null);
    this.academicProfileInsights.set(null);
    this.isAcademicProfileLoading.set(true);
    this.selectedAttendanceStudentId.set(null); // close attendance dialog

    this.teacherStore.getStudentAcademicProfile(student.id).subscribe({
      next: (response) => {
        const pStudent = response.student || {};
        const pGrades = response.grades || [];
        const subjects = getSubjectsForGradeLevel(pStudent.gradeLevel || student.gradeLevel);

        const mappedGrades = subjects.map(subject => {
          // Find if the teacher has uploaded a grade for this specific subject (by class subject matching)
          const recordQ1 = pGrades.find((g: any) => g.quarter === 'Q1');
          const recordQ2 = pGrades.find((g: any) => g.quarter === 'Q2');
          const recordQ3 = pGrades.find((g: any) => g.quarter === 'Q3');
          const recordQ4 = pGrades.find((g: any) => g.quarter === 'Q4');

          // If the teacher has entered grades for their own subject, show them, else empty.
          // For a real app, this would merge from all teachers.
          const isMySubject = pGrades.length > 0; // Simple mock: if there are any grades, assume they are for the first subject, or we just map it.
          // Better: just mock the other subjects to '-' or 85+ and put the actual grades for the teacher's subject if we can determine it. 
          
          return {
            subject,
            q1: isMySubject ? (recordQ1?.written || recordQ1?.exam || recordQ1?.performance || null) : null,
            q2: isMySubject ? (recordQ2?.written || recordQ2?.exam || recordQ2?.performance || null) : null,
            q3: isMySubject ? (recordQ3?.written || recordQ3?.exam || recordQ3?.performance || null) : null,
            q4: isMySubject ? (recordQ4?.written || recordQ4?.exam || recordQ4?.performance || null) : null,
            finalGrade: null
          };
        });

        const mappedProfile = {
          firstName: pStudent.firstName || student.name.split(' ')[0],
          lastName: pStudent.lastName || student.name.split(' ').slice(1).join(' '),
          lrn: pStudent.studentNo || student.studentNo,
          gender: pStudent.gender || student.gender || 'Not specified',
          gradeLevel: pStudent.gradeLevel || student.gradeLevel || 'Unknown',
          section: pStudent.academicRecords?.[0]?.section || 'Unknown',
          enrollmentStatus: pStudent.enrollmentStatus || 'Enrolled',
          adviser: pStudent.academicRecords?.[0]?.adviser || 'TBA',
          contactNo: pStudent.contactNo || pStudent.guardian || 'N/A',
          photoUrl: pStudent.photoUrl || student.photoUrl,
          grades: mappedGrades,
          coreValues: pStudent.coreValues || []
        };

        this.academicProfile.set(mappedProfile);
        this.isAcademicProfileLoading.set(false);

        this.teacherStore.getStudentAcademicInsights(student.id).subscribe({
          next: (res) => this.academicProfileInsights.set(res.insights),
          error: () => this.academicProfileInsights.set('Unable to generate insights at this time.')
        });
      },
      error: () => {
        this.isAcademicProfileLoading.set(false);
      }
    });
  }

  trackByStudentId(index: number, student: any): string {
    return student.id;
  }

  closeAcademicProfile() {
    this.academicProfile.set(null);
    this.academicProfileInsights.set(null);
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
