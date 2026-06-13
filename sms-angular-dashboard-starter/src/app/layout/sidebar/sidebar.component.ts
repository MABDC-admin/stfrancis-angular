import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { sidebarSections } from '../../core/data/dashboard.mock';
import { AuthService } from '../../core/services/auth.service';
import { FinanceNotificationService } from '../../core/services/finance-notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgFor, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  private auth = inject(AuthService);
  readonly financeNotifications = inject(FinanceNotificationService);
  sections: any[] = [];
  rolePath: string = 'admin';
  portalLabel = 'Registrar & Finance Portal';

  ngOnInit() {
    const role = this.auth.getUserRole();
    if (role) {
      this.rolePath = role.toLowerCase();
    }

    if (role === 'REGISTRAR') {
      this.sections = sidebarSections.filter(s => s.label === 'Registrar');
      this.portalLabel = 'Registrar Portal';
    } else if (role === 'FINANCE') {
      this.sections = sidebarSections.filter(s => s.label === 'Finance');
      this.portalLabel = 'Finance Portal';
    } else if (role === 'PRINCIPAL') {
      this.sections = sidebarSections.filter(s => s.label === 'Principal');
      this.portalLabel = 'Principal Portal';
    } else if (role === 'TEACHER') {
      this.sections = sidebarSections.filter(s => s.label === 'Teacher');
      this.portalLabel = 'Teacher Portal';
    } else if (role === 'STUDENT') {
      this.sections = sidebarSections.filter(s => s.label === 'Student');
      this.portalLabel = 'Learner Portal';
    } else {
      // ADMIN
      this.sections = sidebarSections;
      this.portalLabel = 'Administration Portal';
    }
  }

  badgeFor(route: string) {
    if (route === 'billing-assessment' && this.financeNotifications.hasAssessmentNotifications()) {
      return this.financeNotifications.learnersNeedingAssessmentCount();
    }

    return 0;
  }
}
