import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { StudentAssessment } from '../../../core/models/finance.models';
import { StudentRecord } from '../../../core/models/registrar.models';
import { FinancePdfExportButtonComponent } from '../../../shared/pdf-export/finance-pdf-export-button.component';
import { buildDiscountBreakdown } from '../finance-discount.util';
import { displayGradeLevel } from '../../../core/data/grade-levels';

@Component({
  selector: 'app-student-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe, FinancePdfExportButtonComponent],
  templateUrl: './student-ledger.component.html',
  styleUrl: './student-ledger.component.scss'
})
export class StudentLedgerComponent implements OnInit {
  private finance = inject(FinanceApiService);
  private registrar = inject(RegistrarApiService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  academicYear: any;
  students: StudentRecord[] = [];
  selectedStudentId = '';
  pendingStudentId = '';
  ledger: StudentAssessment | null = null;
  message = '';
  error = '';
  readonly displayGradeLevel = displayGradeLevel;

  ngOnInit() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.pendingStudentId = params.get('studentId') || '';
        if (this.pendingStudentId) {
          this.selectedStudentId = this.pendingStudentId;
          this.loadLedger();
        }
      });

    this.registrar.activeAcademicYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ay) => {
        if (!ay?.id) return;
        this.academicYear = ay;
        this.registrar.getStudents(ay.id).subscribe({
          next: (students) => {
            this.students = students;
            if (this.pendingStudentId) {
              this.selectedStudentId = this.pendingStudentId;
              this.loadLedger();
            }
          },
          error: (err) => this.fail(err)
        });
      });
  }

  loadLedger() {
    this.message = '';
    this.error = '';
    this.ledger = null;
    if (!this.selectedStudentId || !this.academicYear?.id) return;
    this.finance.getLedger(this.selectedStudentId, this.academicYear.id).subscribe({
      next: (ledger) => {
        this.ledger = ledger;
        if (!ledger) this.message = 'No assessment found for this student and academic year.';
      },
      error: (err) => this.fail(err)
    });
  }

  get ledgerDiscountSummary() {
    return this.ledger ? buildDiscountBreakdown(this.ledger).summary : 'No discount';
  }

  private fail(err: any) {
    this.error = err?.error?.message || 'Ledger request failed.';
  }
}
