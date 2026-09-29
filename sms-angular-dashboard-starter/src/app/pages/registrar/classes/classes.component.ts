import { Component, inject, OnInit } from '@angular/core';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { SectionRecord, StudentRecord } from '../../../core/models/registrar.models';
import { displayGradeLevel, gradeLevelMatches, gradeLevelOptions } from '../../../core/data/grade-levels';

type CampusTab = 'SFXSAI' | 'MABDC';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, NgStyle, FormsModule],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss'
})
export class ClassesComponent implements OnInit {
  private api = inject(RegistrarApiService);

  gradeLevels = gradeLevelOptions;
  activeGrade = 'G7';
  readonly displayGradeLevel = displayGradeLevel;
  readonly campusTabs = ['SFXSAI', 'MABDC'] as const;
  activeCampusTab: CampusTab = 'SFXSAI';

  allSections: SectionRecord[] = [];
  filteredSections: SectionRecord[] = [];
  selectedSection: SectionRecord | null = null;
  
  // Learners in the selected section
  sectionLearners: StudentRecord[] = [];

  // Modal State
  isModalOpen = false;
  modalMode: 'create' | 'edit' | 'delete' = 'create';
  formData: Partial<SectionRecord> = {};

  ngOnInit() {
    this.api.activeAcademicYear$.subscribe(ay => {
      if (ay) this.loadSections(ay.id);
    });
  }

  loadSections(ayId: string) {
    this.api.getSections(ayId).subscribe(data => {
      this.allSections = data;
      this.filterByGrade(this.activeGrade);
    });
  }

  filterByGrade(grade: string) {
    this.activeGrade = grade;
    this.filteredSections = this.allSections.filter(s =>
      gradeLevelMatches(s.gradeLevel, grade) && this.sectionBelongsToCampus(s, this.activeCampusTab)
    );
    this.selectedSection = this.filteredSections.length > 0 ? this.filteredSections[0] : null;
    if (this.selectedSection) {
      this.loadLearners(this.selectedSection.id);
    } else {
      this.sectionLearners = [];
    }
  }

  selectSection(section: SectionRecord) {
    this.selectedSection = section;
    this.loadLearners(section.id);
  }

  loadLearners(sectionId: string) {
    if (!this.selectedSection || this.selectedSection.enrolled === 0) {
      this.sectionLearners = [];
      return;
    }

    const ayId = this.api.getActiveAcademicYearId();
    this.api.getStudents(ayId).subscribe(students => {
      this.sectionLearners = students.filter(s => {
        const assignedToSection = s.section === this.selectedSection?.sectionName || s.section === this.selectedSection?.id;
        return assignedToSection && gradeLevelMatches(s.gradeLevel, this.selectedSection?.gradeLevel);
      });
    });
  }

  setCampusTab(tab: CampusTab) {
    this.activeCampusTab = tab;
    this.filterByGrade(this.activeGrade);
  }

  private sectionBelongsToCampus(section: SectionRecord, tab: CampusTab): boolean {
    return section.sectionName?.trim().toUpperCase() === tab;
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

  // CRUD Operations
  openCreateModal() {
    this.modalMode = 'create';
    this.formData = {
      gradeLevel: this.activeGrade,
      sectionName: this.activeCampusTab,
      status: 'Open',
      enrolled: 0,
      capacity: 40,
      availableSlots: 40
    };
    this.isModalOpen = true;
  }

  openEditModal(section: SectionRecord) {
    this.modalMode = 'edit';
    this.formData = { ...section };
    this.isModalOpen = true;
  }

  openDeleteModal(section: SectionRecord) {
    this.modalMode = 'delete';
    this.formData = { ...section };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveSection() {
    const ayId = this.api.getActiveAcademicYearId();
    if (!ayId) return;

    if (this.modalMode === 'create') {
      const payload = { ...this.formData, id: Math.random().toString(36).substring(7), academicYearId: ayId };
      this.api.createSection(payload).subscribe(() => {
        this.loadSections(ayId);
        this.closeModal();
      });
    } else if (this.modalMode === 'edit' && this.formData.id) {
      this.api.updateSection(this.formData.id, this.formData).subscribe(() => {
        this.loadSections(ayId);
        this.closeModal();
      });
    } else if (this.modalMode === 'delete' && this.formData.id) {
      this.api.deleteSection(this.formData.id).subscribe(() => {
        this.loadSections(ayId);
        this.closeModal();
      });
    }
  }

  // Avatar placeholder generator
  getInitials(first: string, last: string): string {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`;
  }
}
