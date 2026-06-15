import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter, switchMap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AcademicRecord } from '../../../core/models/registrar.models';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { displayGradeLevel, gradeLevelOptions } from '../../../core/data/grade-levels';
import {
  AcademicRecordStatus,
  buildAcademicRecordStats,
  filterAcademicRecords,
  normalizeAcademicStatus,
  sortAcademicRecords
} from './academic-records.util';

@Component({
  selector: 'app-academic-records',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './academic-records.component.html',
  styleUrl: './academic-records.component.scss'
})
export class AcademicRecordsComponent implements OnInit {
  private readonly api = inject(RegistrarApiService);
  private readonly destroyRef = inject(DestroyRef);

  records: AcademicRecord[] = [];
  activeAcademicYear: any | null = null;
  isLoading = false;
  searchTerm = '';
  selectedGrade = 'All';
  selectedYear = 'All';
  selectedStatus = 'All';
  isModalOpen = false;
  modalMode: 'create' | 'edit' = 'create';
  selectedRecord: AcademicRecord | null = null;
  formData: Partial<AcademicRecord> = {};
  toast = {
    show: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'info'
  };

  readonly grades = [{ value: 'All', label: 'All grade levels' }, ...gradeLevelOptions];
  readonly displayGradeLevel = displayGradeLevel;
  readonly statuses = ['All', 'Validated', 'For Review', 'Promoted', 'Retained', 'Incomplete'];

  ngOnInit() {
    this.loadRecords();
  }

  get filteredRecords(): AcademicRecord[] {
    return sortAcademicRecords(
      filterAcademicRecords(this.records, this.searchTerm, this.selectedGrade, this.selectedYear, this.selectedStatus)
    );
  }

  get stats() {
    return buildAcademicRecordStats(this.records);
  }

  get schoolYears(): string[] {
    return ['All', ...Array.from(new Set(this.records.map((record) => record.schoolYear).filter(Boolean))).sort().reverse()];
  }

  loadRecords() {
    this.isLoading = true;

    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(academicYear => !!academicYear),
      switchMap(academicYear => {
        this.activeAcademicYear = academicYear;
        return this.api.getAcademicRecords(academicYear.id);
      })
    ).subscribe({
      next: (records) => {
        this.records = records;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Records unavailable', 'Unable to load academic records.', 'error');
      }
    });
  }

  openCreateModal() {
    this.modalMode = 'create';
    this.selectedRecord = null;
    this.formData = {
      schoolYear: this.activeAcademicYear?.code || this.schoolYears.find((year) => year !== 'All') || 'SY2026-2027',
      status: 'For Review',
      remarks: 'For validation',
      academicYearId: this.activeAcademicYear?.id
    };
    this.isModalOpen = true;
  }

  openEditModal(record: AcademicRecord) {
    this.modalMode = 'edit';
    this.selectedRecord = record;
    this.formData = { ...record };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedRecord = null;
    this.formData = {};
  }

  saveRecord() {
    if (!this.formData.studentName?.trim() || !this.formData.gradeLevel || !this.formData.schoolYear || !this.formData.generalAverage) {
      this.showToast('Missing details', 'Learner name, grade, school year, and general average are required.', 'error');
      return;
    }

    const payload = {
      ...this.formData,
      status: normalizeAcademicStatus(this.formData.status),
      academicYearId: this.formData.academicYearId || this.activeAcademicYear?.id
    };

    const request = this.modalMode === 'edit' && this.selectedRecord
      ? this.api.updateAcademicRecord(this.selectedRecord.id, payload)
      : this.api.createAcademicRecord(payload);

    request.subscribe({
      next: (saved) => {
        this.records = this.modalMode === 'edit'
          ? this.records.map((record) => record.id === saved.id ? saved : record)
          : [saved, ...this.records];
        this.closeModal();
        this.showToast('Academic record saved', 'The academic record is now available for registrar review.', 'success');
      },
      error: () => this.showToast('Save failed', 'Unable to save the academic record.', 'error')
    });
  }

  validateRecord(record: AcademicRecord) {
    this.api.updateAcademicRecord(record.id, { status: 'Validated' }).subscribe({
      next: (updated) => {
        this.records = this.records.map((item) => item.id === updated.id ? updated : item);
        this.showToast('Record validated', `${updated.studentName} is marked as validated.`, 'success');
      },
      error: () => this.showToast('Validation failed', 'Unable to validate this academic record.', 'error')
    });
  }

  deleteRecord(record: AcademicRecord) {
    if (!confirm(`Delete academic record for ${record.studentName}?`)) return;

    this.api.deleteAcademicRecord(record.id).subscribe({
      next: () => {
        this.records = this.records.filter((item) => item.id !== record.id);
        this.showToast('Record deleted', 'The academic record was removed.', 'success');
      },
      error: () => this.showToast('Delete failed', 'Unable to delete this academic record.', 'error')
    });
  }

  exportCsv() {
    const header = ['Learner', 'School Year', 'Grade Level', 'Section', 'General Average', 'Remarks', 'Status'];
    const rows = this.filteredRecords.map((record) => [
      record.studentName,
      record.schoolYear,
      displayGradeLevel(record.gradeLevel),
      record.section,
      record.generalAverage,
      record.remarks,
      record.status
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sfxsai-academic-records.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    this.showToast('Export ready', 'Academic records CSV was generated.', 'success');
  }

  printRecords() {
    window.print();
  }

  statusClass(status: string): string {
    const normalized = normalizeAcademicStatus(status);
    if (normalized === 'Validated' || normalized === 'Promoted') return 'bg-emerald-50 text-emerald-700';
    if (normalized === 'For Review') return 'bg-blue-50 text-blue-700';
    if (normalized === 'Retained') return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  }

  statusTone(status: string): AcademicRecordStatus {
    return normalizeAcademicStatus(status);
  }

  showToast(title: string, message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toast = { show: true, title, message, type };
    setTimeout(() => {
      this.toast.show = false;
    }, 3500);
  }

  trackRecord(_: number, item: AcademicRecord): string {
    return item.id;
  }
}
