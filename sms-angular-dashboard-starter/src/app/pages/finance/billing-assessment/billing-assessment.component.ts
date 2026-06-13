import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { FeeTemplate, StudentAssessment, StudentAssessmentLineItem } from '../../../core/models/finance.models';
import { StudentRecord } from '../../../core/models/registrar.models';
import { studentsAvailableForAssessment } from './assessment-selection.util';
import { buildAssessmentStudentOptions } from './assessment-editor.util';
import { buildBatchAssessmentPayloads } from './assessment-batch.util';
import { FinancePdfExportButtonComponent } from '../../../shared/pdf-export/finance-pdf-export-button.component';
import { FinanceNotificationService } from '../../../core/services/finance-notification.service';
import { buildDiscountBreakdown } from '../finance-discount.util';

@Component({
  selector: 'app-billing-assessment',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, FinancePdfExportButtonComponent],
  templateUrl: './billing-assessment.component.html',
  styleUrl: './billing-assessment.component.scss'
})
export class BillingAssessmentComponent implements OnInit {
  private finance = inject(FinanceApiService);
  private registrar = inject(RegistrarApiService);
  private notifications = inject(FinanceNotificationService);
  private destroyRef = inject(DestroyRef);

  academicYear: any;
  students: StudentRecord[] = [];
  templates: FeeTemplate[] = [];
  assessments: StudentAssessment[] = [];
  selectedStudentId = '';
  selectedStudentIds: string[] = [];
  selectedTemplateId = '';
  regularDiscountPercent = 0;
  siblingDiscountPercent = 0;
  scholarshipDiscountPercent = 0;
  lineItems: StudentAssessmentLineItem[] = [];
  loading = false;
  message = '';
  error = '';

  ngOnInit() {
    this.registrar.activeAcademicYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ay) => {
        if (!ay?.id) return;
        this.academicYear = ay;
        this.loadAcademicYearData(ay.id);
      });
  }

  loadAcademicYearData(academicYearId: string) {
    this.loading = true;
    forkJoin({
      students: this.registrar.getStudents(academicYearId),
      templates: this.finance.getFeeTemplates(academicYearId),
      assessments: this.finance.getAssessments(academicYearId)
    }).subscribe({
      next: ({ students, templates, assessments }) => {
        this.students = students;
        this.templates = templates.filter((template) => template.isActive);
        this.assessments = assessments;
        this.selectedStudentIds = this.selectedStudentIds.filter((studentId) =>
          this.availableStudents.some((student) => student.id === studentId),
        );
        this.loading = false;
        this.notifications.refreshAssessmentQueue();
      },
      error: (err) => this.fail(err)
    });
  }

  get selectedStudent() {
    return this.students.find((student) => student.id === this.selectedStudentId);
  }

  get selectedBatchStudents() {
    const selectedIds = new Set(this.selectedStudentIds);
    return this.availableStudents.filter((student) => student.id && selectedIds.has(student.id));
  }

  get availableStudents() {
    return studentsAvailableForAssessment(
      this.students,
      this.assessments,
      this.academicYear?.id,
    );
  }

  get studentOptions() {
    return buildAssessmentStudentOptions(
      this.students,
      this.assessments,
      this.academicYear?.id,
    );
  }

  get assessedStudentsCount() {
    return this.studentOptions.filter((option) => option.isAssessed).length;
  }

  get selectedTemplate() {
    return this.templates.find((template) => template.id === this.selectedTemplateId);
  }

  get existingAssessment() {
    return this.assessments.find((assessment) => assessment.studentId === this.selectedStudentId);
  }

  get existingDiscountSummary() {
    return this.existingAssessment ? buildDiscountBreakdown(this.existingAssessment).summary : 'No discount';
  }

  get grossAmount() {
    return this.lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  get totalDiscountPercent() {
    return Number(this.regularDiscountPercent || 0) + Number(this.siblingDiscountPercent || 0) + Number(this.scholarshipDiscountPercent || 0);
  }

  get discountAmount() {
    return this.grossAmount * (Math.min(this.totalDiscountPercent, 100) / 100);
  }

  get netAmount() {
    return Math.max(this.grossAmount - this.discountAmount, 0);
  }

  applyTemplate() {
    const template = this.selectedTemplate;
    if (!template) return;
    this.lineItems = template.lineItems.map((item) => ({
      feeTypeId: item.feeTypeId,
      description: item.description,
      amount: Number(item.amount),
      sourceFeeTemplateLineItemId: item.id
    }));
  }

  toggleStudentSelection(studentId: string | undefined, checked: boolean) {
    if (!studentId) return;
    if (checked) {
      this.selectedStudentId = '';
      this.selectedStudentIds = Array.from(new Set([...this.selectedStudentIds, studentId]));
      return;
    }
    this.selectedStudentIds = this.selectedStudentIds.filter((id) => id !== studentId);
  }

  selectAllAvailableStudents() {
    this.selectedStudentId = '';
    this.selectedStudentIds = this.availableStudents
      .map((student) => student.id)
      .filter((id): id is string => !!id);
  }

  clearBatchSelection() {
    this.selectedStudentIds = [];
  }

  startSingleEdit() {
    if (this.selectedStudentId) {
      this.clearBatchSelection();
    }
    this.loadExistingAssessment();
  }

  loadExistingAssessment() {
    const assessment = this.existingAssessment;
    if (!assessment) {
      this.selectedTemplateId = '';
      this.regularDiscountPercent = 0;
      this.siblingDiscountPercent = 0;
      this.scholarshipDiscountPercent = 0;
      this.lineItems = [];
      return;
    }
    this.selectedTemplateId = assessment.feeTemplateId || '';
    this.regularDiscountPercent = assessment.regularDiscountPercent;
    this.siblingDiscountPercent = assessment.siblingDiscountPercent;
    this.scholarshipDiscountPercent = assessment.scholarshipDiscountPercent;
    this.lineItems = (assessment.lineItems || []).map((item: StudentAssessmentLineItem) => ({
      feeTypeId: item.feeTypeId,
      description: item.description,
      amount: Number(item.amount),
      sourceFeeTemplateLineItemId: item.sourceFeeTemplateLineItemId
    }));
  }

  saveAssessment() {
    this.message = '';
    this.error = '';
    const targetStudentIds = this.selectedStudentIds.length ? this.selectedStudentIds : this.selectedStudentId ? [this.selectedStudentId] : [];
    if (!this.academicYear?.id || !targetStudentIds.length || !this.lineItems.length) {
      this.error = 'Select academic year, at least one learner, and template line items first.';
      return;
    }
    if (this.totalDiscountPercent > 100) {
      this.error = 'Total discount cannot exceed 100%.';
      return;
    }
    const assessmentPayloads = buildBatchAssessmentPayloads(targetStudentIds, {
      academicYearId: this.academicYear.id,
      feeTemplateId: this.selectedTemplateId || undefined,
      regularDiscountPercent: Number(this.regularDiscountPercent || 0),
      siblingDiscountPercent: Number(this.siblingDiscountPercent || 0),
      scholarshipDiscountPercent: Number(this.scholarshipDiscountPercent || 0),
      lineItems: this.lineItems
    });
    this.loading = true;
    forkJoin(assessmentPayloads.map((payload) => this.finance.saveAssessment(payload))).subscribe({
      next: () => {
        this.message = targetStudentIds.length > 1
          ? `${targetStudentIds.length} assessments saved for this academic year.`
          : 'Assessment saved for this academic year.';
        this.resetAssessmentForm();
        this.loadAcademicYearData(this.academicYear.id);
        this.notifications.refreshAssessmentQueue();
      },
      error: (err) => this.fail(err)
    });
  }

  private resetAssessmentForm() {
    this.selectedStudentId = '';
    this.selectedStudentIds = [];
    this.selectedTemplateId = '';
    this.regularDiscountPercent = 0;
    this.siblingDiscountPercent = 0;
    this.scholarshipDiscountPercent = 0;
    this.lineItems = [];
  }

  private fail(err: any) {
    this.loading = false;
    this.error = err?.error?.message || 'Finance request failed.';
  }
}
