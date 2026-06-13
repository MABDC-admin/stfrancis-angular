import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FeeTemplate,
  FeeType,
  Payment,
  RecordPaymentPayload,
  SaveAssessmentPayload,
  StudentAssessment
} from '../models/finance.models';

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/finance`;

  private ayParams(academicYearId: string) {
    return { params: new HttpParams().set('academicYearId', academicYearId) };
  }

  getFeeTypes(): Observable<FeeType[]> {
    return this.http.get<FeeType[]>(`${this.baseUrl}/fee-types`);
  }

  createFeeType(payload: Pick<FeeType, 'name' | 'description'>): Observable<FeeType> {
    return this.http.post<FeeType>(`${this.baseUrl}/fee-types`, payload);
  }

  updateFeeType(id: string, payload: Partial<FeeType>): Observable<FeeType> {
    return this.http.patch<FeeType>(`${this.baseUrl}/fee-types/${id}`, payload);
  }

  deleteFeeType(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/fee-types/${id}`);
  }

  getFeeTemplates(academicYearId: string): Observable<FeeTemplate[]> {
    return this.http.get<FeeTemplate[]>(`${this.baseUrl}/fee-templates`, this.ayParams(academicYearId));
  }

  createFeeTemplate(payload: Partial<FeeTemplate>): Observable<FeeTemplate> {
    return this.http.post<FeeTemplate>(`${this.baseUrl}/fee-templates`, payload);
  }

  deleteFeeTemplate(id: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/fee-templates/${id}`);
  }

  deactivateFeeTemplate(id: string): Observable<FeeTemplate> {
    return this.http.patch<FeeTemplate>(`${this.baseUrl}/fee-templates/${id}/deactivate`, {});
  }

  getAssessments(academicYearId: string): Observable<StudentAssessment[]> {
    return this.http.get<StudentAssessment[]>(`${this.baseUrl}/assessments`, this.ayParams(academicYearId));
  }

  getStudentAssessment(studentId: string, academicYearId: string): Observable<StudentAssessment | null> {
    return this.http.get<StudentAssessment | null>(`${this.baseUrl}/assessments/student/${studentId}`, this.ayParams(academicYearId));
  }

  saveAssessment(payload: SaveAssessmentPayload): Observable<StudentAssessment> {
    return this.http.post<StudentAssessment>(`${this.baseUrl}/assessments`, payload);
  }

  getPayments(academicYearId: string): Observable<Payment[]> {
    return this.http.get<Payment[]>(`${this.baseUrl}/payments`, this.ayParams(academicYearId));
  }

  recordPayment(payload: RecordPaymentPayload): Observable<{ payment: Payment; assessment: StudentAssessment }> {
    return this.http.post<{ payment: Payment; assessment: StudentAssessment }>(`${this.baseUrl}/payments`, payload);
  }

  updatePaymentReceipt(id: string, receiptNumber: string): Observable<Payment> {
    return this.http.patch<Payment>(`${this.baseUrl}/payments/${id}/receipt`, { receiptNumber });
  }

  getLedger(studentId: string, academicYearId: string): Observable<StudentAssessment | null> {
    return this.http.get<StudentAssessment | null>(`${this.baseUrl}/ledger/student/${studentId}`, this.ayParams(academicYearId));
  }
}
