import { Component } from '@angular/core';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { OnInit, inject, DestroyRef } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { SectionRecord, StudentRecord } from '../../../core/models/registrar.models';
import { displayGradeLevel, gradeLevelMatches, gradeLevelOptions, normalizeGradeLevel } from '../../../core/data/grade-levels';

import { FormsModule } from '@angular/forms';

type CampusTab = 'SFXSAI' | 'MABDC';

@Component({
  selector: 'app-section-assignment',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, NgStyle, FormsModule],
  templateUrl: './section-assignment.component.html',
  styleUrl: './section-assignment.component.scss'
})
export class SectionAssignmentComponent implements OnInit {
  private api = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);

  sections: SectionRecord[] = [];
  allStudents: StudentRecord[] = [];
  unassignedStudents: StudentRecord[] = [];
  teachers: any[] = [];

  // Assign Modal State
  isAssignModalOpen = false;
  assignGradeLevel = '';
  assignSectionId = '';
  selectedStudentIds: Record<string, boolean> = {};

  // Section CRUD State
  isSectionModalOpen = false;
  editingSectionId: string | null = null;
  sectionFormData: Partial<SectionRecord> = {};

  // View Section State
  isViewSectionModalOpen = false;
  viewingSection: SectionRecord | null = null;
  enrolledStudents: StudentRecord[] = [];
  readonly gradeLevels = gradeLevelOptions;
  readonly displayGradeLevel = displayGradeLevel;
  readonly campusTabs = ['SFXSAI', 'MABDC'] as const;
  activeCampusTab: CampusTab = 'SFXSAI';
  showEmptySections = false;

  ngOnInit() {
    this.api.getTeachers().subscribe(t => this.teachers = t);

    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => {
        return combineLatest([
          this.api.getSections(ay.id),
          this.api.getStudents(ay.id)
        ]);
      })
    ).subscribe({
      next: ([sections, students]) => {
        this.allStudents = students;
        this.sections = this.applySectionMetrics(sections, students);
        this.unassignedStudents = students.filter(s =>
          !this.studentHasSection(s) &&
          (s.enrollmentStatus === 'Officially Enrolled' || s.enrollmentStatus === 'Pending Review')
        );
      },
      error: (err) => console.error('Failed to load data', err)
    });
  }

  refreshSections() {
    const ayId = this.api.getActiveAcademicYearId();
    if (ayId) {
      this.api.getSections(ayId).subscribe({
        next: (sections) => {
          this.sections = this.applySectionMetrics(sections, this.allStudents);
        },
        error: (err) => console.error('Failed to refresh sections', err),
      });
    }
  }

  getInitials(first: string, last: string): string {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`;
  }

  setCampusTab(tab: CampusTab) {
    this.activeCampusTab = tab;
    this.assignSectionId = '';
    this.selectedStudentIds = {};
  }

  get filteredSections(): SectionRecord[] {
    return this.sections.filter(section => {
      if (!this.sectionBelongsToCampus(section, this.activeCampusTab)) {
        return false;
      }

      if (this.showEmptySections) {
        return true;
      }

      return (section.enrolled ?? 0) > 0;
    });
  }

  get hiddenEmptySectionCount(): number {
    const campusSections = this.sections.filter(section => this.sectionBelongsToCampus(section, this.activeCampusTab));
    return campusSections.filter(section => (section.enrolled ?? 0) === 0).length;
  }

  campusSectionCount(tab: CampusTab): number {
    return this.sections.filter(section => this.sectionBelongsToCampus(section, tab)).length;
  }

  campusLearnerCount(tab: CampusTab): number {
    const campusSections = this.sections.filter(section =>
      this.sectionBelongsToCampus(section, tab),
    );

    return this.allStudents.filter(student =>
      campusSections.some(section => this.studentAssignedToSection(student, section)),
    ).length;
  }

  private sectionBelongsToCampus(section: SectionRecord, tab: CampusTab): boolean {
    const sectionName = this.normalizeSectionValue(section.sectionName);
    return sectionName === tab
      || sectionName.startsWith(`${tab} `)
      || sectionName.startsWith(`${tab}-`)
      || sectionName.startsWith(`${tab}_`)
      || sectionName.startsWith(`${tab}/`)
      || sectionName.endsWith(` ${tab}`)
      || sectionName.endsWith(`-${tab}`)
      || sectionName.endsWith(`_${tab}`)
      || sectionName.endsWith(`/${tab}`)
      || this.hasCampusBoundary(sectionName, tab);
  }

  private sectionStatusFromCapacity(capacity = 0, enrolled = 0): string {
    const available = Math.max(capacity - enrolled, 0);

    if (available <= 0) return 'Closed';
    if (available <= 5) return 'Nearly Full';
    return 'Open';
  }

  private computeSectionEnrollmentCount(section: SectionRecord, students: StudentRecord[]): number {
    return students.filter(student => this.studentAssignedToSection(student, section)).length;
  }

  private applySectionMetrics(rawSections: SectionRecord[], students: StudentRecord[]): SectionRecord[] {
    return rawSections.map((section) => {
      const enrolled = this.computeSectionEnrollmentCount(section, students);
      const availableSlots = Math.max((section.capacity ?? 0) - enrolled, 0);

      return {
        ...section,
        enrolled,
        availableSlots,
        status: this.sectionStatusFromCapacity(section.capacity, enrolled),
      };
    });
  }

  private normalizeSectionValue(value?: string): string {
    return (value ?? '').trim().toUpperCase();
  }

  private hasCampusBoundary(value: string, tab: CampusTab): boolean {
    const token = new RegExp(`(^|[\\s_/-])${tab}([\\s_/-]|$)`, 'i');
    return token.test(value);
  }

  private extractSectionCampus(value?: string): CampusTab | undefined {
    const normalized = this.normalizeSectionValue(value);
    if (!normalized) return undefined;
    const campusMatch = normalized.match(/(^|[\s_/-])(SFXSAI|MABDC)([\s_/-]|$)/i);
    if (!campusMatch) {
      return undefined;
    }

    const campus = campusMatch[2].toUpperCase();
    if (campus === 'SFXSAI') {
      return 'SFXSAI';
    }
    if (campus === 'MABDC') {
      return 'MABDC';
    }
    return undefined;
  }

  private studentHasSection(student: StudentRecord): boolean {
    return this.normalizeSectionValue(student.section).length > 0;
  }

  private matchesSectionIdentifier(studentSection: string | undefined, section: SectionRecord): boolean {
    const normalizedStudentSection = this.normalizeSectionValue(studentSection);
    if (!normalizedStudentSection) {
      return false;
    }

    const normalizedSectionName = this.normalizeSectionValue(section.sectionName);
    const normalizedSectionId = this.normalizeSectionValue(section.id);
    const normalizedSectionGrade = this.normalizeSectionValue(section.gradeLevel);

    if (
      normalizedStudentSection === normalizedSectionName ||
      normalizedStudentSection === normalizedSectionId
    ) {
      return true;
    }

    return (
      normalizedStudentSection === `${normalizedSectionName}-${normalizedSectionGrade}` ||
      normalizedStudentSection === `${normalizedSectionName} ${normalizedSectionGrade}` ||
      normalizedStudentSection.endsWith(`-${normalizedSectionName}`) ||
      normalizedStudentSection.endsWith(` ${normalizedSectionName}`) ||
      normalizedStudentSection === normalizedSectionName ||
      normalizedStudentSection.startsWith(`${normalizedSectionName}-`) ||
      normalizedStudentSection.startsWith(`${normalizedSectionName} `) ||
      normalizedStudentSection.includes(`-${normalizedSectionName}-`) ||
      normalizedStudentSection.includes(` ${normalizedSectionName}-`) ||
      normalizedStudentSection.includes(` ${normalizedSectionName} `) ||
      normalizedStudentSection.includes(`-${normalizedSectionName} `)
    );
  }

  private isCampusOnlySectionName(sectionName?: string): boolean {
    const normalized = this.normalizeSectionValue(sectionName);
    return normalized === 'SFXSAI' || normalized === 'MABDC';
  }

  private studentAssignedToSection(student: StudentRecord, section: SectionRecord): boolean {
    if (!student.section || !section?.gradeLevel) {
      return false;
    }
    const studentMatchesGrade = gradeLevelMatches(student.gradeLevel, section.gradeLevel);
    if (!studentMatchesGrade) {
      return false;
    }

    if (this.matchesSectionIdentifier(student.section, section)) {
      return true;
    }

    const studentCampus = this.extractSectionCampus(student.section);
    const sectionCampus = this.extractSectionCampus(section.sectionName);
    if (!studentCampus || !sectionCampus || studentCampus !== sectionCampus) {
      return false;
    }

    return gradeLevelMatches(student.gradeLevel, section.gradeLevel);
  }

  // --- Assign Learners Logic ---

  get availableGrades(): string[] {
    const grades = new Set(this.unassignedStudents.map(s => normalizeGradeLevel(s.gradeLevel)));
    return Array.from(grades);
  }

  get assignableSections(): SectionRecord[] {
    return this.filteredSections.filter(s => gradeLevelMatches(s.gradeLevel, this.assignGradeLevel));
  }

  get assignableStudents(): StudentRecord[] {
    return this.unassignedStudents.filter(s => gradeLevelMatches(s.gradeLevel, this.assignGradeLevel));
  }

  get selectedCount(): number {
    return Object.values(this.selectedStudentIds).filter(Boolean).length;
  }

  openAssignModal() {
    this.isAssignModalOpen = true;
    this.assignGradeLevel = this.availableGrades.length > 0 ? this.availableGrades[0] : '';
    this.assignSectionId = '';
    this.selectedStudentIds = {};
  }

  closeAssignModal() {
    this.isAssignModalOpen = false;
  }

  onGradeChange() {
    this.assignSectionId = '';
    this.selectedStudentIds = {};
  }

  toggleAllStudents(event: any) {
    const checked = event.target.checked;
    this.assignableStudents.forEach(s => {
      if (!s.id) {
        return;
      }
      this.selectedStudentIds[s.id] = checked;
    });
  }

  submitAssignment() {
    if (!this.assignSectionId || this.selectedCount === 0) return;

    const section = this.sections.find(s => s.id === this.assignSectionId);
      if (section && section.id) {
        const selectedIds = Object.entries(this.selectedStudentIds)
          .filter(([_, isSelected]) => isSelected)
          .map(([id]) => id);

        const doAssign = (secId: string) => {
          this.api.batchAssignStudentsToSection(secId, selectedIds).subscribe({
            next: () => {
              const ayId = this.api.getActiveAcademicYearId();
              if (ayId) {
                combineLatest([
                  this.api.getSections(ayId),
                  this.api.getStudents(ayId),
                ]).subscribe({
                  next: ([sections, students]) => {
                    this.allStudents = students;
                    this.sections = this.applySectionMetrics(sections, students);
                    this.unassignedStudents = students.filter(s =>
                      !this.studentHasSection(s) &&
                      (s.enrollmentStatus === 'Officially Enrolled' || s.enrollmentStatus === 'Pending Review')
                    );
                  },
                  error: (err) => console.error('Failed to refresh assignment data', err),
                });
              } else {
                this.refreshSections();
              }
              
              this.closeAssignModal();
            },
            error: (err) => console.error('Failed to assign students', err)
          });
        };

      doAssign(section.id);
    }
  }

  usage(section: SectionRecord): number {
    return Math.round((section.enrolled / section.capacity) * 100);
  }

  statusClass(status: string): string {
    if (status === 'Open') return 'bg-emerald-50 text-emerald-700';
    if (status === 'Nearly Full') return 'bg-amber-50 text-amber-700';
    if (status === 'Closed') return 'bg-rose-50 text-rose-700';
    return 'bg-slate-100 text-slate-700';
  }

  // --- Section CRUD Logic ---
  
  openSectionModal(section?: SectionRecord) {
    if (section) {
      this.editingSectionId = section.id || null;
      this.sectionFormData = { ...section };
    } else {
      this.editingSectionId = null;
      this.sectionFormData = {
        gradeLevel: 'G7',
        sectionName: this.activeCampusTab,
        adviser: '',
        room: '',
        capacity: 40,
        enrolled: 0,
        availableSlots: 40,
        status: 'Open',
        academicYearId: this.api.getActiveAcademicYearId()
      };
    }
    this.isSectionModalOpen = true;
  }

  closeSectionModal() {
    this.isSectionModalOpen = false;
    this.editingSectionId = null;
    this.sectionFormData = {};
  }

  saveSection() {
    // Basic calculation
    if (this.sectionFormData.capacity !== undefined && this.sectionFormData.enrolled !== undefined) {
      this.sectionFormData.availableSlots = this.sectionFormData.capacity - this.sectionFormData.enrolled;
      if (this.sectionFormData.availableSlots <= 0) {
        this.sectionFormData.status = 'Closed';
      } else if (this.sectionFormData.availableSlots <= 5) {
        this.sectionFormData.status = 'Nearly Full';
      } else {
        this.sectionFormData.status = 'Open';
      }
    }

    if (this.editingSectionId) {
      this.api.updateSection(this.editingSectionId, this.sectionFormData).subscribe({
        next: () => {
          this.refreshSections();
          this.closeSectionModal();
        },
        error: (err) => console.error('Failed to update section', err)
      });
    } else {
      this.api.createSection(this.sectionFormData).subscribe({
        next: () => {
          this.refreshSections();
          this.closeSectionModal();
        },
        error: (err) => console.error('Failed to create section', err)
      });
    }
  }

  deleteSection(section: SectionRecord) {
    if (section.enrolled > 0) {
      alert(`Cannot delete section ${section.sectionName} because it has enrolled students.`);
      return;
    }
    if (confirm(`Are you sure you want to delete section ${section.sectionName}?`)) {
      if (section.id) {
        this.api.deleteSection(section.id).subscribe({
          next: () => this.refreshSections(),
          error: (err) => console.error('Failed to delete section', err)
        });
      }
    }
  }

  // --- View Section Logic ---
  
  openViewSectionModal(section: SectionRecord) {
    this.viewingSection = section;
    this.enrolledStudents = this.allStudents.filter((student) =>
      this.studentAssignedToSection(student, section),
    );
    this.isViewSectionModalOpen = true;
  }

  closeViewSectionModal() {
    this.isViewSectionModalOpen = false;
    this.viewingSection = null;
    this.enrolledStudents = [];
  }
}
