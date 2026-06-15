import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { Payment, PaymentMethod, StudentAssessment } from '../../../core/models/finance.models';
import { FinancePdfExportButtonComponent } from '../../../shared/pdf-export/finance-pdf-export-button.component';
import { buildDiscountBreakdown } from '../finance-discount.util';
import { PortalVideoBackdropComponent } from '../../../shared/portal-video-backdrop/portal-video-backdrop.component';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, FinancePdfExportButtonComponent, PortalVideoBackdropComponent],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  private finance = inject(FinanceApiService);
  private registrar = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);

  academicYear: any;
  assessments: StudentAssessment[] = [];
  payments: Payment[] = [];
  selectedAssessmentId = '';
  receiptNumber = '';
  method: PaymentMethod = 'Cash';
  amount = 0;
  paymentDate = new Date().toISOString().slice(0, 10);
  remarks = '';
  message = '';
  error = '';
  loading = false;
  methods: PaymentMethod[] = ['Cash', 'Bank Transfer', 'GCash', 'Card/POS'];

  ngOnInit() {
    this.registrar.activeAcademicYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ay) => {
        if (!ay?.id) return;
        this.academicYear = ay;
        this.loadAssessments();
      });
  }

  get selectedAssessment() {
    return this.assessments.find((assessment) => assessment.id === this.selectedAssessmentId);
  }

  discountSummary(assessment?: StudentAssessment | null) {
    return assessment ? buildDiscountBreakdown(assessment).summary : 'No discount';
  }

  loadAssessments() {
    forkJoin({
      assessments: this.finance.getAssessments(this.academicYear.id),
      payments: this.finance.getPayments(this.academicYear.id)
    }).subscribe({
      next: ({ assessments, payments }) => {
        this.assessments = assessments;
        this.payments = payments;
      },
      error: (err) => this.fail(err)
    });
  }

  fillExactBalance() {
    this.amount = Number(this.selectedAssessment?.balance || 0);
  }

  recordPayment() {
    this.message = '';
    this.error = '';
    const assessment = this.selectedAssessment;
    if (!assessment) {
      this.error = 'Select an assessment first.';
      return;
    }
    if (this.amount <= 0 || this.amount > Number(assessment.balance)) {
      this.error = `Payment must be greater than 0 and not above ₱${Number(assessment.balance).toFixed(2)}.`;
      return;
    }
    this.loading = true;
    this.finance.recordPayment({
      studentAssessmentId: assessment.id,
      studentId: assessment.studentId,
      academicYearId: assessment.academicYearId,
      receiptNumber: this.receiptNumber,
      method: this.method,
      amount: Number(this.amount),
      paymentDate: this.paymentDate,
      remarks: this.remarks
    }).subscribe({
      next: () => {
        this.loading = false;
        this.message = 'Payment recorded and finance clearance updated.';
        this.amount = 0;
        this.receiptNumber = '';
        this.remarks = '';
        this.loadAssessments();
      },
      error: (err) => this.fail(err)
    });
  }

  private fail(err: any) {
    this.loading = false;
    this.error = err?.error?.message || 'Payment request failed.';
  }
}
