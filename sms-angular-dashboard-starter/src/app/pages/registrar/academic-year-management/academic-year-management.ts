import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';

@Component({
  selector: 'app-academic-year-management',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe],
  templateUrl: './academic-year-management.html',
  styleUrl: './academic-year-management.scss',
})
export class AcademicYearManagementComponent implements OnInit {
  private api = inject(RegistrarApiService);

  years: any[] = [];
  showForm = false;
  isSubmitting = false;

  draft = {
    id: '',
    code: '',
    startDate: '',
    endDate: '',
    isActive: false,
    remarks: ''
  };

  ngOnInit() {
    this.api.refreshAcademicYears();
    this.api.academicYears$.subscribe(data => this.years = data);
  }

  openForm(year?: any) {
    if (year) {
      this.draft = {
        id: year.id,
        code: year.code,
        startDate: year.startDate.split('T')[0],
        endDate: year.endDate.split('T')[0],
        isActive: year.isActive,
        remarks: year.remarks || ''
      };
    } else {
      this.draft = {
        id: '',
        code: '',
        startDate: '',
        endDate: '',
        isActive: false,
        remarks: ''
      };
    }
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
  }

  save() {
    this.isSubmitting = true;
    const payload = {
      code: this.draft.code,
      startDate: new Date(this.draft.startDate).toISOString(),
      endDate: new Date(this.draft.endDate).toISOString(),
      isActive: this.draft.isActive,
      remarks: this.draft.remarks
    };

    const executeSave = () => {
      if (this.draft.id) {
        this.api.updateAcademicYear(this.draft.id, payload).subscribe({
          next: () => this.onSaveSuccess(),
          error: (err) => { console.error(err); this.isSubmitting = false; }
        });
      } else {
        this.api.createAcademicYear(payload).subscribe({
          next: () => this.onSaveSuccess(),
          error: (err) => { console.error(err); this.isSubmitting = false; }
        });
      }
    };

    if (payload.isActive) {
      const currentlyActive = this.years.filter(y => y.isActive && y.id !== this.draft.id);
      if (currentlyActive.length > 0) {
        let completed = 0;
        currentlyActive.forEach(y => {
          this.api.updateAcademicYear(y.id, { isActive: false }).subscribe(() => {
            completed++;
            if (completed === currentlyActive.length) {
              executeSave();
            }
          });
        });
      } else {
        executeSave();
      }
    } else {
      executeSave();
    }
  }

  private onSaveSuccess() {
    this.api.refreshAcademicYears();
    this.closeForm();
    this.isSubmitting = false;
  }

  deleteYear(id: string) {
    if (confirm('Are you sure you want to delete this academic year?')) {
      this.api.deleteAcademicYear(id).subscribe({
        next: () => this.api.refreshAcademicYears(),
        error: (err) => console.error(err)
      });
    }
  }
}
