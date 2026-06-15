import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { NgFor, NgIf, LowerCasePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  registrarStats
} from '../../core/data/dashboard.mock';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { AuthService } from '../../core/services/auth.service';
import { RegistrarApiService } from '../../core/services/registrar-api.service';
import { FinanceApiService } from '../../core/services/finance-api.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, filter } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { buildFinanceDashboard, FinanceDashboardModel, formatPeso } from './finance-dashboard.util';
import { shouldShowRegistrarOverview } from './dashboard-visibility.util';
import { buildUpcomingBirthdays, UpcomingBirthday } from './dashboard-birthdays.util';
import { buildRegistrarDashboardMetrics } from './registrar-dashboard-metrics.util';
import { FinancePdfExportButtonComponent } from '../../shared/pdf-export/finance-pdf-export-button.component';
import { displayGradeLevel } from '../../core/data/grade-levels';
import { PortalVideoBackdropComponent } from '../../shared/portal-video-backdrop/portal-video-backdrop.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, NgIf, LowerCasePipe, NgClass, RouterLink, StatCardComponent, FinancePdfExportButtonComponent, PortalVideoBackdropComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  api = inject(RegistrarApiService);
  financeApi = inject(FinanceApiService);
  destroyRef = inject(DestroyRef);
  
  role: string | null = null;
  activeAcademicYearCode = 'Selected School Year';

  registrarStats = [...registrarStats];
  financeDashboard: FinanceDashboardModel | null = null;
  upcomingBirthdays: UpcomingBirthday[] = [];
  formatPeso = formatPeso;
  shouldShowRegistrarOverview = shouldShowRegistrarOverview;
  readonly displayGradeLevel = displayGradeLevel;

  ngOnInit() {
    this.role = this.authService.getUserRole();
    this.api.refreshAcademicYears();

    this.api.activeAcademicYear$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(ay => !!ay),
      switchMap(ay => {
        this.activeAcademicYearCode = ay.code;
        // Update the helper text with the AY code
        this.registrarStats[3].helper = ay.code;
        
        return forkJoin({
          academicYear: of(ay),
          students: this.api.getStudents(ay.id),
          assessments: this.role !== 'REGISTRAR' ? this.financeApi.getAssessments(ay.id) : of([]),
          payments: this.role !== 'REGISTRAR' ? this.financeApi.getPayments(ay.id) : of([])
        });
      })
    ).subscribe(({ academicYear, students, assessments, payments }) => {
      const registrarMetrics = buildRegistrarDashboardMetrics(students);

      // Update Registrar Stats
      this.registrarStats[0].value = registrarMetrics.totalStudents.toString();
      this.registrarStats[0].helper = `${registrarMetrics.totalStudents} this year`;
      
      this.registrarStats[1].value = registrarMetrics.pendingEnrollments.toString();
      
      this.registrarStats[2].value = registrarMetrics.incompleteDocs.toString();
      
      this.registrarStats[3].value = registrarMetrics.officiallyEnrolled.toString();

      if (this.role !== 'REGISTRAR') {
        this.financeDashboard = buildFinanceDashboard(assessments, payments, academicYear.code);
        this.upcomingBirthdays = buildUpcomingBirthdays(students);
      }
    });
  }
}
