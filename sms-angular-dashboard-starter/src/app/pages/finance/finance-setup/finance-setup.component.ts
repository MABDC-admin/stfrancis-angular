import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { FeeTemplateLineItem, FeeType } from '../../../core/models/finance.models';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { RegistrarApiService } from '../../../core/services/registrar-api.service';
import { displayGradeLevel, gradeLevelOptions } from '../../../core/data/grade-levels';
import { FinancePdfExportButtonComponent } from '../../../shared/pdf-export/finance-pdf-export-button.component';

@Component({
  selector: 'app-finance-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, FinancePdfExportButtonComponent],
  templateUrl: './finance-setup.component.html',
  styleUrl: './finance-setup.component.scss'
})
export class FinanceSetupComponent implements OnInit {
  private finance = inject(FinanceApiService);
  private registrar = inject(RegistrarApiService);
  private destroyRef = inject(DestroyRef);

  academicYear: any;
  feeTypes: FeeType[] = [];
  templates: any[] = [];
  feeTypeName = '';
  feeTypeDescription = '';
  templateName = '';
  templateGradeLevel = 'G1';
  templateLineItems: FeeTemplateLineItem[] = [];
  message = '';
  error = '';
  grades = gradeLevelOptions;
  readonly displayGradeLevel = displayGradeLevel;

  ngOnInit() {
    this.registrar.activeAcademicYear$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ay) => {
        if (!ay?.id) return;
        this.academicYear = ay;
        this.loadSetup();
      });
  }

  get activeFeeTypes() {
    return this.feeTypes.filter((feeType) => feeType.isActive);
  }

  get templateTotal() {
    return this.templateLineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  loadSetup() {
    forkJoin({
      feeTypes: this.finance.getFeeTypes(),
      templates: this.finance.getFeeTemplates(this.academicYear.id)
    }).subscribe({
      next: ({ feeTypes, templates }) => {
        this.feeTypes = feeTypes;
        this.templates = templates;
      },
      error: (err) => this.fail(err)
    });
  }

  createFeeType() {
    this.message = '';
    this.error = '';
    if (!this.feeTypeName.trim()) {
      this.error = 'Fee type name is required.';
      return;
    }
    this.finance.createFeeType({
      name: this.feeTypeName,
      description: this.feeTypeDescription
    }).subscribe({
      next: () => {
        this.message = 'Fee type created.';
        this.feeTypeName = '';
        this.feeTypeDescription = '';
        this.loadSetup();
      },
      error: (err) => this.fail(err)
    });
  }

  addTemplateLine() {
    const firstType = this.activeFeeTypes[0];
    if (!firstType) {
      this.error = 'Create an active fee type first.';
      return;
    }
    this.templateLineItems.push({
      feeTypeId: firstType.id,
      description: firstType.name,
      amount: 0
    });
  }

  createTemplate() {
    this.message = '';
    this.error = '';
    if (!this.academicYear?.id || !this.templateName.trim() || !this.templateLineItems.length) {
      this.error = 'Template name and line items are required.';
      return;
    }
    this.finance.createFeeTemplate({
      academicYearId: this.academicYear.id,
      gradeLevel: this.templateGradeLevel,
      name: this.templateName,
      lineItems: this.templateLineItems
    }).subscribe({
      next: () => {
        this.message = 'Fee template created for this academic year.';
        this.templateName = '';
        this.templateLineItems = [];
        this.loadSetup();
      },
      error: (err) => this.fail(err)
    });
  }

  deleteFeeType(id: string) {
    this.finance.deleteFeeType(id).subscribe({
      next: () => this.loadSetup(),
      error: (err) => this.fail(err)
    });
  }

  deactivateTemplate(id: string) {
    this.finance.deactivateFeeTemplate(id).subscribe({
      next: () => this.loadSetup(),
      error: (err) => this.fail(err)
    });
  }

  deleteTemplate(id: string) {
    this.finance.deleteFeeTemplate(id).subscribe({
      next: () => this.loadSetup(),
      error: (err) => this.fail(err)
    });
  }

  private fail(err: any) {
    this.error = err?.error?.message || 'Finance setup request failed.';
  }
}
