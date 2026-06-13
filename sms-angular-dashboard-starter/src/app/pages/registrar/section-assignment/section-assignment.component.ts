import { Component } from '@angular/core';
import { NgClass, NgFor, NgIf, NgStyle } from '@angular/common';
import { OnInit, inject, DestroyRef } from '@angular/core';
import { switchMap, filter } from 'rxjs/operators';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { SectionRecord, StudentRecord } from '../../../core/models/registrar.models';

import { FormsModule } from '@angular/forms';

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

  ngOnInit() {
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
        this.sections = sections;
        this.allStudents = students;
        this.unassignedStudents = students.filter(s => !s.section && (s.enrollmentStatus === 'Officially Enrolled' || s.enrollmentStatus === 'Pending Review')).slice(0, 4);
        
        if (this.unassignedStudents.length === 0) {
          this.unassignedStudents = [
            { id: '1', firstName: 'Mia', lastName: 'Santos', gradeLevel: 'Grade 7', studentType: 'Transferee', enrollmentStatus: 'Pending Review' } as StudentRecord,
            { id: '2', firstName: 'Liam', lastName: 'Reyes', gradeLevel: 'Grade 7', studentType: 'Regular', enrollmentStatus: 'Officially Enrolled' } as StudentRecord,
            { id: '3', firstName: 'Noah', lastName: 'Garcia', gradeLevel: 'Grade 1', studentType: 'Regular', enrollmentStatus: 'Pending Review' } as StudentRecord,
          ];
        }

        // Ensure we have mock sections for the unassigned students' grade levels if the DB is empty
        const missingGrades = new Set(this.unassignedStudents.map(s => s.gradeLevel));
        this.sections.forEach(s => missingGrades.delete(s.gradeLevel));
        
        if (missingGrades.size > 0) {
          missingGrades.forEach(grade => {
            this.sections.push({
              id: `mock-sec-${grade.replace(/\s+/g, '-')}`,
              sectionName: `${grade} - Newton`,
              gradeLevel: grade,
              adviser: 'TBA',
              room: 'TBA',
              capacity: 40,
              enrolled: 10,
              availableSlots: 30,
              status: 'Open'
            } as SectionRecord);
          });
        }
      },
      error: (err) => console.error('Failed to load data', err)
    });
  }

  refreshSections() {
    const ayId = this.api.getActiveAcademicYearId();
    if (ayId) {
      this.api.getSections(ayId).subscribe(sections => {
        this.sections = sections;
      });
    }
  }

  getInitials(first: string, last: string): string {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`;
  }

  // --- Assign Learners Logic ---

  get availableGrades(): string[] {
    const grades = new Set(this.unassignedStudents.map(s => s.gradeLevel));
    return Array.from(grades);
  }

  get assignableSections(): SectionRecord[] {
    return this.sections.filter(s => s.gradeLevel === this.assignGradeLevel);
  }

  get assignableStudents(): StudentRecord[] {
    return this.unassignedStudents.filter(s => s.gradeLevel === this.assignGradeLevel);
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
      this.selectedStudentIds[s.id || s.firstName] = checked;
    });
  }

  submitAssignment() {
    if (!this.assignSectionId || this.selectedCount === 0) return;

    const section = this.sections.find(s => s.id === this.assignSectionId);
    if (section && section.id) {
      const selectedIds = Object.entries(this.selectedStudentIds)
        .filter(([_, isSelected]) => isSelected)
        .map(([id]) => id);

      this.api.batchAssignStudentsToSection(section.id, selectedIds).subscribe({
        next: () => {
          // Re-fetch all data to show live DB state
          this.refreshSections();
          
          // Re-fetch students and update the lists
          const ayId = this.api.getActiveAcademicYearId();
          if (ayId) {
            this.api.getStudents(ayId).subscribe(students => {
              this.allStudents = students;
              this.unassignedStudents = students.filter(s => !s.section && (s.enrollmentStatus === 'Officially Enrolled' || s.enrollmentStatus === 'Pending Review'));
            });
          }
          
          this.closeAssignModal();
        },
        error: (err) => console.error('Failed to assign students', err)
      });
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
        gradeLevel: 'Grade 7',
        sectionName: '',
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
    this.enrolledStudents = this.allStudents.filter(s => s.section === section.sectionName || s.section === section.id);
    this.isViewSectionModalOpen = true;
  }

  closeViewSectionModal() {
    this.isViewSectionModalOpen = false;
    this.viewingSection = null;
    this.enrolledStudents = [];
  }
}
