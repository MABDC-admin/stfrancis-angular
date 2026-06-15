import { Routes } from '@angular/router';
import { AppLayoutComponent } from './layout/app-layout/app-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentRegistrationComponent } from './pages/registrar/student-registration/student-registration.component';
import { EnrollmentComponent } from './pages/registrar/enrollment/enrollment.component';
import { StudentMasterlistComponent } from './pages/registrar/student-masterlist/student-masterlist.component';
import { LearnerProfileComponent } from './pages/registrar/learner-profile/learner-profile.component';
import { DocumentsComponent } from './pages/registrar/documents/documents.component';
import { SectionAssignmentComponent } from './pages/registrar/section-assignment/section-assignment.component';
import { ClassesComponent } from './pages/registrar/classes/classes.component';
import { AcademicRecordsComponent } from './pages/registrar/academic-records/academic-records.component';
import { LearnerMovementComponent } from './pages/registrar/learner-movement/learner-movement.component';
import { TransfereeManagementComponent } from './pages/registrar/transferee-management/transferee-management.component';
import { DocumentRequestsComponent } from './pages/registrar/document-requests/document-requests.component';
import { DepedFormsComponent } from './pages/registrar/deped-forms/deped-forms.component';
import { IdQrManagementComponent } from './pages/registrar/id-qr-management/id-qr-management.component';
import { RegistrarReportsComponent } from './pages/registrar/registrar-reports/registrar-reports.component';
import { AcademicYearManagementComponent } from './pages/registrar/academic-year-management/academic-year-management';
import { ComingSoonComponent } from './pages/coming-soon/coming-soon.component';
import { PaymentsComponent } from './pages/finance/payments/payments.component';
import { BillingAssessmentComponent } from './pages/finance/billing-assessment/billing-assessment.component';
import { BillingSummaryComponent } from './pages/finance/billing-summary/billing-summary.component';
import { StudentLedgerComponent } from './pages/finance/student-ledger/student-ledger.component';
import { FinanceSetupComponent } from './pages/finance/finance-setup/finance-setup.component';
import { TeacherPortalComponent } from './pages/teacher/teacher-portal.component';
import { StudentPortalComponent } from './pages/student/student-portal.component';
import { PrincipalPortalComponent } from './pages/principal/principal-portal.component';
import { LoginComponent } from './pages/auth/login.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role-guard';

export const appRoutes: Routes = [
  {
    path: 'auth/login',
    component: LoginComponent,
    title: 'Login | SFXSAI'
  },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'principal/dashboard',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Principal Dashboard | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'dashboard', pageTitle: 'Principal Dashboard', pageSubtitle: 'Executive school analytics and leadership signals' }
      },
      {
        path: 'principal/teachers',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Teacher Overview | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'teachers', pageTitle: 'Teacher Management Overview', pageSubtitle: 'Workload, attendance, class assignments, and performance' }
      },
      {
        path: 'principal/students',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Student Analytics | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'students', pageTitle: 'Student Analytics', pageSubtitle: 'Enrollment, performance distribution, and risk monitoring' }
      },
      {
        path: 'principal/classes',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Classes & Sections | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'classes', pageTitle: 'Class & Section Management', pageSubtitle: 'Sections, advisers, enrollment, and class performance' }
      },
      {
        path: 'principal/performance',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Academic Performance | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'performance', pageTitle: 'Academic Performance', pageSubtitle: 'Grade-level, subject, and quarterly performance analytics' }
      },
      {
        path: 'principal/attendance',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Attendance Monitoring | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'attendance', pageTitle: 'Attendance Monitoring', pageSubtitle: 'School-wide attendance and chronic absence watch' }
      },
      {
        path: 'principal/enrollment',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Enrollment Management | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'enrollment', pageTitle: 'Enrollment Management', pageSubtitle: 'Admission status and grade-level intake tracking' }
      },
      {
        path: 'principal/announcements',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'School Announcements | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'announcements', pageTitle: 'School Announcements', pageSubtitle: 'Broadcast to school, teachers, or students' }
      },
      {
        path: 'principal/reports',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Reports Center | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'reports', pageTitle: 'Reports & Analytics Center', pageSubtitle: 'Academic, attendance, enrollment, and teacher exports' }
      },
      {
        path: 'principal/alerts',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Monitoring Alerts | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'alerts', pageTitle: 'Monitoring & Alerts', pageSubtitle: 'Low performance, attendance warnings, and supervision notices' }
      },
      {
        path: 'principal/messages',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Principal Messaging | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'messages', pageTitle: 'Messaging Hub', pageSubtitle: 'Teacher, class, and admin communication' }
      },
      {
        path: 'principal/settings',
        component: PrincipalPortalComponent,
        canActivate: [roleGuard],
        title: 'Principal Settings | SFXSAI',
        data: { roles: ['PRINCIPAL'], principalView: 'settings', pageTitle: 'System Settings', pageSubtitle: 'School profile, academic year, grade levels, and role review' }
      },
      {
        path: 'student/dashboard',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Student Dashboard | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'dashboard', pageTitle: 'Student Dashboard', pageSubtitle: 'Classes, assignments, attendance, and progress' }
      },
      {
        path: 'student/profile',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Student Profile | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'profile', pageTitle: 'Student Profile', pageSubtitle: 'Personal, adviser, and academic information' }
      },
      {
        path: 'student/classes',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'My Classes | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'classes', pageTitle: 'My Classes', pageSubtitle: 'Subject workspaces, lessons, assignments, and resources' }
      },
      {
        path: 'student/assignments',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Assignments | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'assignments', pageTitle: 'Assignments', pageSubtitle: 'Track pending, submitted, late, and graded work' }
      },
      {
        path: 'student/grades',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Grades | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'grades', pageTitle: 'Grades & Performance', pageSubtitle: 'Quarterly grades and computed general average' }
      },
      {
        path: 'student/attendance',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Attendance | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'attendance', pageTitle: 'Attendance', pageSubtitle: 'Attendance status and history by subject' }
      },
      {
        path: 'student/schedule',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Schedule | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'schedule', pageTitle: 'Schedule / Timetable', pageSubtitle: 'Weekly class schedule and rooms' }
      },
      {
        path: 'student/resources',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Learning Resources | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'resources', pageTitle: 'Learning Resources', pageSubtitle: 'PDFs, videos, worksheets, and class materials' }
      },
      {
        path: 'student/announcements',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Announcements | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'announcements', pageTitle: 'Announcements', pageSubtitle: 'School-wide and class notices' }
      },
      {
        path: 'student/messages',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Messages | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'messages', pageTitle: 'Messages', pageSubtitle: 'Communicate with teachers and adviser' }
      },
      {
        path: 'student/submissions',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Submission Center | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'submissions', pageTitle: 'Submission Center', pageSubtitle: 'Upload files or text-based assignment responses' }
      },
      {
        path: 'student/progress',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Progress Tracker | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'progress', pageTitle: 'Progress Tracker', pageSubtitle: 'Attendance, assignment, and grade trends' }
      },
      {
        path: 'student/settings',
        component: StudentPortalComponent,
        canActivate: [roleGuard],
        title: 'Student Settings | SFXSAI',
        data: { roles: ['STUDENT'], studentView: 'settings', pageTitle: 'Settings', pageSubtitle: 'Profile, notifications, and password settings' }
      },
      {
        path: 'teacher/dashboard',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Teacher Dashboard | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'dashboard', pageTitle: 'Teacher Dashboard', pageSubtitle: 'Classes, attendance, grades, and lesson work' }
      },
      {
        path: 'teacher/profile',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Teacher Profile | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'profile', pageTitle: 'Teacher Profile', pageSubtitle: 'Personal details, assigned subjects, and class schedule' }
      },
      {
        path: 'teacher/classes',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'My Classes | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'classes', pageTitle: 'My Classes', pageSubtitle: 'Assigned classes, learners, and class-level actions' }
      },
      {
        path: 'teacher/attendance',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Attendance | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'attendance', pageTitle: 'Attendance Management', pageSubtitle: 'Daily marking and attendance history' }
      },
      {
        path: 'teacher/grades',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Grades | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'grades', pageTitle: 'Grades Management', pageSubtitle: 'Quarterly grade input and averages' }
      },
      {
        path: 'teacher/schedule',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Schedule | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'schedule', pageTitle: 'Schedule / Timetable', pageSubtitle: 'Weekly teaching schedule and room assignments' }
      },
      {
        path: 'teacher/resources',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Learning Resources | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'resources', pageTitle: 'Learning Resources', pageSubtitle: 'Teaching materials by class and subject' }
      },
      {
        path: 'teacher/dll',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Daily Lesson Log | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'dll', pageTitle: 'Daily Lesson Log', pageSubtitle: 'Objectives, activities, materials, and remarks' }
      },
      {
        path: 'teacher/announcements',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Announcements | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'announcements', pageTitle: 'Announcements', pageSubtitle: 'Post updates to classes or all students' }
      },
      {
        path: 'teacher/messages',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Messages | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'messages', pageTitle: 'Messaging', pageSubtitle: 'Student, parent, and admin communication' }
      },
      {
        path: 'teacher/analytics',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Performance Analytics | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'analytics', pageTitle: 'Performance Analytics', pageSubtitle: 'Attendance and class performance trends' }
      },
      {
        path: 'teacher/settings',
        component: TeacherPortalComponent,
        canActivate: [roleGuard],
        title: 'Teacher Settings | SFXSAI',
        data: { roles: ['TEACHER'], teacherView: 'settings', pageTitle: 'Settings', pageSubtitle: 'Account and notification preferences' }
      },
      {
        path: ':portal/dashboard',
        component: DashboardComponent,
        title: 'Dashboard | SFXSAI',
        data: {
          pageTitle: 'Dashboard',
          pageSubtitle: 'Overview of operations'
        }
      },
      {
        path: ':portal/student-registration',
        component: StudentRegistrationComponent,
        canActivate: [roleGuard],
        title: 'Student Registration | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Student Registration',
          pageSubtitle: 'Create learner records and start enrollment intake'
        }
      },
      {
        path: ':portal/enrollment',
        component: EnrollmentComponent,
        canActivate: [roleGuard],
        title: 'Enrollment | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Enrollment Applications',
          pageSubtitle: 'Review, approve, and track enrollment status'
        }
      },
      {
        path: ':portal/student-masterlist',
        component: StudentMasterlistComponent,
        canActivate: [roleGuard],
        title: 'Student Masterlist | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Student Masterlist',
          pageSubtitle: 'Central learner registry and clearance visibility'
        }
      },
      {
        path: ':portal/learner-profile',
        component: LearnerProfileComponent,
        canActivate: [roleGuard],
        title: 'Learner Profile | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Learner Profile',
          pageSubtitle: 'Complete student record and enrollment history'
        }
      },
      {
        path: ':portal/learner-profile/:id',
        component: LearnerProfileComponent,
        canActivate: [roleGuard],
        title: 'Learner Profile | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Learner Profile',
          pageSubtitle: 'Complete student record and enrollment history'
        }
      },
      {
        path: ':portal/documents',
        component: DocumentsComponent,
        canActivate: [roleGuard],
        title: 'Document Verification | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Document Verification',
          pageSubtitle: 'Track required learner documents and deficiencies'
        }
      },
      {
        path: ':portal/section-assignment',
        component: SectionAssignmentComponent,
        canActivate: [roleGuard],
        title: 'Section Assignment | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Section Assignment',
          pageSubtitle: 'Assign learners to sections and monitor capacity'
        }
      },
      {
        path: ':portal/classes',
        component: ClassesComponent,
        canActivate: [roleGuard],
        title: 'Classes | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Classes',
          pageSubtitle: 'Manage grade levels, class sections, and learner assignments'
        }
      },
      {
        path: ':portal/academic-records',
        component: AcademicRecordsComponent,
        canActivate: [roleGuard],
        title: 'Academic Records | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Academic Records',
          pageSubtitle: 'Validated grade history and general average records'
        }
      },
      {
        path: ':portal/learner-movement',
        component: LearnerMovementComponent,
        canActivate: [roleGuard],
        title: 'Learner Movement | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Learner Movement',
          pageSubtitle: 'Track transfer, promotion, retention, and status changes'
        }
      },
      {
        path: ':portal/transferee-management',
        component: TransfereeManagementComponent,
        canActivate: [roleGuard],
        title: 'Transferee Management | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Transferee Management',
          pageSubtitle: 'Handle incoming/outgoing transfers, LRN requests, and academic evaluations'
        }
      },
      {
        path: ':portal/document-requests',
        component: DocumentRequestsComponent,
        canActivate: [roleGuard],
        title: 'Document Requests | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Document Requests',
          pageSubtitle: 'Process certificates, SF9, SF10, and release logs'
        }
      },
      {
        path: ':portal/deped-forms',
        component: DepedFormsComponent,
        canActivate: [roleGuard],
        title: 'DepEd Forms | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'DepEd Forms',
          pageSubtitle: 'Prepare SF1, SF2, SF9, and SF10 views'
        }
      },
      {
        path: ':portal/id-qr-management',
        component: IdQrManagementComponent,
        canActivate: [roleGuard],
        title: 'ID / QR Management | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'ID / QR Management',
          pageSubtitle: 'Generate QR codes and monitor ID card printing'
        }
      },
      {
        path: ':portal/registrar-reports',
        component: RegistrarReportsComponent,
        canActivate: [roleGuard],
        title: 'Registrar Reports | SFXSAI',
        data: {
          roles: ['REGISTRAR'],
          pageTitle: 'Registrar Reports',
          pageSubtitle: 'Export enrollment, masterlist, document, and DepEd reports'
        }
      },
      {
        path: ':portal/payments',
        component: PaymentsComponent,
        canActivate: [roleGuard],
        title: 'Payments | SFXSAI',
        data: { roles: ['FINANCE'], pageTitle: 'Payments', pageSubtitle: 'Record student payments and update clearance' }
      },
      {
        path: ':portal/billing-assessment',
        component: BillingAssessmentComponent,
        canActivate: [roleGuard],
        title: 'Billing & Assessment | SFXSAI',
        data: { roles: ['FINANCE'], pageTitle: 'Billing & Assessment', pageSubtitle: 'Create academic-year-safe student assessments' }
      },
      {
        path: ':portal/billing-summary',
        component: BillingSummaryComponent,
        canActivate: [roleGuard],
        title: 'Billing Summary | SFXSAI',
        data: { roles: ['FINANCE'], pageTitle: 'Billing Summary', pageSubtitle: 'Central learner billing view by academic year' }
      },
      {
        path: ':portal/student-ledger',
        component: StudentLedgerComponent,
        canActivate: [roleGuard],
        title: 'Student Ledger | SFXSAI',
        data: { roles: ['FINANCE'], pageTitle: 'Student Ledger', pageSubtitle: 'Review student account history by academic year' }
      },
      {
        path: ':portal/finance-setup',
        component: FinanceSetupComponent,
        canActivate: [roleGuard],
        title: 'Finance Setup | SFXSAI',
        data: { roles: ['FINANCE'], pageTitle: 'Finance Setup', pageSubtitle: 'Manage fee types and fee templates' }
      },
      {
        path: ':portal/academic-years',
        component: AcademicYearManagementComponent,
        canActivate: [roleGuard],
        title: 'Academic Year Management | SFXSAI',
        data: { roles: ['ADMIN'], pageTitle: 'Academic Year Management', pageSubtitle: 'Configure the school years and set the active academic year' }
      },
      {
        path: ':portal/calendar',
        loadComponent: () => import('./pages/calendar/calendar.component').then(m => m.CalendarPageComponent),
        canActivate: [roleGuard],
        title: 'School Calendar | SFXSAI',
        data: { roles: ['ADMIN', 'REGISTRAR', 'PRINCIPAL', 'TEACHER', 'STUDENT'], pageTitle: 'School Calendar', pageSubtitle: 'View and manage holidays, exams, and events' }
      },
      {
        path: ':portal',
        pathMatch: 'full',
        redirectTo: ':portal/dashboard'
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'admin/dashboard'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'admin/dashboard'
  }
];

// Trigger rebuild
