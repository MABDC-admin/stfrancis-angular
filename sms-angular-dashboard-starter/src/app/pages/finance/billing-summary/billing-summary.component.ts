import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import {
  BillingSummaryRow,
  BillingSummaryTotals,
  buildBillingSummaryRows,
  summarizeBilling,
} from './billing-summary.util';
import { FinancePdfExportButtonComponent } from '../../../shared/pdf-export/finance-pdf-export-button.component';
import { displayGradeLevel } from '../../../core/data/grade-levels';

@Component({
  selector: 'app-billing-summary',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DecimalPipe, DatePipe, FinancePdfExportButtonComponent],
  templateUrl: './billing-summary.component.html',
  styleUrl: './billing-summary.component.scss',
})
export class BillingSummaryComponent implements OnInit {
  private finance = inject(FinanceApiService);
  private registrar = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);

  academicYear: any;
  rows: BillingSummaryRow[] = [];
  totals: BillingSummaryTotals = summarizeBilling([]);
  expandedAssessmentId = '';
  searchText = '';
  statusFilter = 'ALL';
  loading = false;
  error = '';
  readonly displayGradeLevel = displayGradeLevel;

  ngOnInit() {
    this.registrar.activeAcademicYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ay) => {
        if (!ay?.id) return;
        this.academicYear = ay;
        this.loadBillingSummary();
      });
  }

  get filteredRows() {
    const query = this.searchText.trim().toLowerCase();
    return this.rows.filter((row) => {
      const statusMatch = this.statusFilter === 'ALL' || row.financeStatus === this.statusFilter;
      const textMatch = !query || [
        row.learnerName,
        row.studentNo,
        row.lrn,
        row.gradeLevel,
        row.financeStatus,
      ].some((value) => value.toLowerCase().includes(query));
      return statusMatch && textMatch;
    });
  }

  get statusOptions() {
    return Array.from(new Set(this.rows.map((row) => row.financeStatus))).sort();
  }

  toggleRow(row: BillingSummaryRow) {
    this.expandedAssessmentId = this.expandedAssessmentId === row.assessmentId ? '' : row.assessmentId;
  }

  loadBillingSummary() {
    this.loading = true;
    this.error = '';
    this.finance.getAssessments(this.academicYear.id).subscribe({
      next: (assessments) => {
        this.rows = buildBillingSummaryRows(assessments);
        this.totals = summarizeBilling(this.rows);
        this.expandedAssessmentId = this.rows[0]?.assessmentId || '';
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Billing summary request failed.';
      },
    });
  }
}
