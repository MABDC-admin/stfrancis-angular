import { Injectable, computed, inject, signal } from '@angular/core';
import { forkJoin, timer } from 'rxjs';
import { AuthService } from './auth.service';
import { FinanceApiService } from './finance-api.service';
import { RegistrarApiService } from './registrar-api.service';
import { countLearnersNeedingAssessment } from './finance-notification.util';

@Injectable({ providedIn: 'root' })
export class FinanceNotificationService {
  private auth = inject(AuthService);
  private registrar = inject(RegistrarApiService);
  private finance = inject(FinanceApiService);

  private assessmentQueueCount = signal(0);
  readonly learnersNeedingAssessmentCount = computed(() => this.assessmentQueueCount());
  readonly hasAssessmentNotifications = computed(() => this.learnersNeedingAssessmentCount() > 0);

  constructor() {
    this.registrar.activeAcademicYear$.subscribe(() => this.refreshAssessmentQueue());
    timer(0, 30000).subscribe(() => this.refreshAssessmentQueue());
  }

  refreshAssessmentQueue() {
    const role = this.auth.getUserRole();
    const academicYearId = this.registrar.getActiveAcademicYearId();

    if (role === 'REGISTRAR' || !academicYearId) {
      this.assessmentQueueCount.set(0);
      return;
    }

    forkJoin({
      students: this.registrar.getStudents(academicYearId),
      assessments: this.finance.getAssessments(academicYearId),
    }).subscribe({
      next: ({ students, assessments }) => {
        this.assessmentQueueCount.set(countLearnersNeedingAssessment(students, assessments, academicYearId));
      },
      error: () => this.assessmentQueueCount.set(0),
    });
  }
}
