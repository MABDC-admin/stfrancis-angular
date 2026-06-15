import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject, Subject, tap } from 'rxjs';
import { StudentRecord, EnrollmentApplication, SectionRecord, AcademicRecord, DocumentRequirement, LearnerMovement, DocumentRequest, DepEdFormRecord, IdQrRecord } from '../models/registrar.models';

@Injectable({
  providedIn: 'root'
})
export class RegistrarApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  // Active Academic Year State
  private activeAcademicYearSubj = new BehaviorSubject<any>(null);
  activeAcademicYear$ = this.activeAcademicYearSubj.asObservable();

  private studentUpdatedSubj = new Subject<StudentRecord>();
  studentUpdated$ = this.studentUpdatedSubj.asObservable();

  // List of all Academic Years
  private academicYearsSubj = new BehaviorSubject<any[]>([]);
  academicYears$ = this.academicYearsSubj.asObservable();

  setActiveAcademicYear(ay: any) {
    this.activeAcademicYearSubj.next(ay);
  }

  getActiveAcademicYearId(): string | undefined {
    return this.activeAcademicYearSubj.value?.id;
  }

  refreshAcademicYears() {
    this.getAcademicYears().subscribe({
      next: (ays) => {
        this.academicYearsSubj.next(ays);
        const activeAy = ays.find(ay => ay.isActive) || ays[0];
        if (activeAy && (!this.activeAcademicYearSubj.value || this.activeAcademicYearSubj.value.id !== activeAy.id)) {
          this.setActiveAcademicYear(activeAy);
        }
      },
      error: (err) => console.error('Failed to refresh academic years', err)
    });
  }

  getAcademicYears(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/academic-years`);
  }

  createAcademicYear(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/academic-years`, payload);
  }

  updateAcademicYear(id: string, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/academic-years/${id}`, payload);
  }

  deleteAcademicYear(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/academic-years/${id}`);
  }

  // Helper to build params
  private buildParams(ayId?: string) {
    let params = {};
    if (ayId) {
      params = { ayId };
    }
    return { params };
  }

  // Get data
  getStudents(ayId?: string): Observable<StudentRecord[]> {
    return this.http.get<StudentRecord[]>(`${this.baseUrl}/students`, this.buildParams(ayId));
  }

  getStudentById(id: string): Observable<StudentRecord> {
    return this.http.get<StudentRecord>(`${this.baseUrl}/students/${id}`);
  }

  updateStudent(id: string, payload: Partial<StudentRecord>): Observable<StudentRecord> {
    return this.http.patch<StudentRecord>(`${this.baseUrl}/students/${id}`, payload).pipe(
      tap((student) => this.studentUpdatedSubj.next(student))
    );
  }

  addBehaviorRecord(id: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/students/${id}/behavior`, payload);
  }

  addStudentFee(id: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/students/${id}/fees`, payload);
  }

  addStudentSibling(id: string, payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/students/${id}/siblings`, payload);
  }

  resetStudentPassword(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/students/${id}/reset-password`, {});
  }

  getStoredFiles(ownerType: string, ownerId: string, category?: string): Observable<any[]> {
    const params: any = { ownerType, ownerId };
    if (category) params.category = category;
    return this.http.get<any[]>(`${this.baseUrl}/storage/files`, { params });
  }

  uploadStudentDocument(studentId: string, file: File): Observable<any> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/storage/students/${studentId}/documents`, data);
  }

  uploadStudentPhoto(studentId: string, file: File): Observable<any> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/storage/students/${studentId}/photo`, data).pipe(
      tap(() => this.getStudentById(studentId).subscribe(student => this.studentUpdatedSubj.next(student)))
    );
  }

  uploadStaffAvatar(file: File): Observable<any> {
    const data = new FormData();
    data.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/storage/staff/avatar`, data);
  }

  deleteStoredFile(fileId: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/storage/files/${fileId}`);
  }

  registerStudent(payload: Partial<StudentRecord>): Observable<StudentRecord> {
    return this.http.post<StudentRecord>(`${this.baseUrl}/students`, payload);
  }

  createEnrollmentApplication(payload: any): Observable<EnrollmentApplication> {
    return this.http.post<EnrollmentApplication>(`${this.baseUrl}/enrollment-applications`, payload);
  }

  getEnrollmentApplications(ayId?: string): Observable<EnrollmentApplication[]> {
    return this.http.get<EnrollmentApplication[]>(`${this.baseUrl}/enrollment-applications`, this.buildParams(ayId));
  }

  updateEnrollmentApplication(id: string, payload: any): Observable<EnrollmentApplication> {
    return this.http.patch<EnrollmentApplication>(`${this.baseUrl}/enrollment-applications/${id}`, payload);
  }

  getDepedForms(ayId?: string): Observable<DepEdFormRecord[]> {
    return this.http.get<DepEdFormRecord[]>(`${this.baseUrl}/deped-forms`, this.buildParams(ayId));
  }

  getSections(ayId?: string): Observable<SectionRecord[]> {
    return this.http.get<SectionRecord[]>(`${this.baseUrl}/sections`, this.buildParams(ayId));
  }

  createSection(payload: Partial<SectionRecord>): Observable<SectionRecord> {
    return this.http.post<SectionRecord>(`${this.baseUrl}/sections`, payload);
  }

  updateSection(id: string, payload: Partial<SectionRecord>): Observable<SectionRecord> {
    return this.http.patch<SectionRecord>(`${this.baseUrl}/sections/${id}`, payload);
  }

  deleteSection(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/sections/${id}`);
  }

  batchAssignStudentsToSection(sectionId: string, studentIds: string[]): Observable<SectionRecord> {
    return this.http.post<SectionRecord>(`${this.baseUrl}/sections/${sectionId}/assign`, { studentIds });
  }

  getAcademicRecords(ayId?: string): Observable<AcademicRecord[]> {
    return this.http.get<AcademicRecord[]>(`${this.baseUrl}/academic-records`, this.buildParams(ayId));
  }

  createAcademicRecord(payload: Partial<AcademicRecord>): Observable<AcademicRecord> {
    return this.http.post<AcademicRecord>(`${this.baseUrl}/academic-records`, payload);
  }

  updateAcademicRecord(id: string, payload: Partial<AcademicRecord>): Observable<AcademicRecord> {
    return this.http.patch<AcademicRecord>(`${this.baseUrl}/academic-records/${id}`, payload);
  }

  deleteAcademicRecord(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/academic-records/${id}`);
  }

  getDocumentRequests(ayId?: string): Observable<DocumentRequest[]> {
    return this.http.get<DocumentRequest[]>(`${this.baseUrl}/document-requests`, this.buildParams(ayId));
  }

  getLearnerMovements(ayId?: string): Observable<LearnerMovement[]> {
    return this.http.get<LearnerMovement[]>(`${this.baseUrl}/learner-movements`, this.buildParams(ayId));
  }

  createLearnerMovement(payload: Partial<LearnerMovement>): Observable<LearnerMovement> {
    return this.http.post<LearnerMovement>(`${this.baseUrl}/learner-movements`, payload);
  }

  updateLearnerMovement(id: string, payload: Partial<LearnerMovement>): Observable<LearnerMovement> {
    return this.http.patch<LearnerMovement>(`${this.baseUrl}/learner-movements/${id}`, payload);
  }
}
