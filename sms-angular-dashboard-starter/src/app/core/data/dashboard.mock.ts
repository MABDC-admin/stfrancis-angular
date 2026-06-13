import { NavSection, ProgressItem, QueueItem, QuickAction, StatCard } from '../models/dashboard.models';

export const sidebarSections: NavSection[] = [
  {
    label: 'Registrar',
    items: [
      { label: 'Student Registration', icon: 'person_add', route: 'student-registration' },
      { label: 'Enrollment', icon: 'assignment_turned_in', route: 'enrollment' },
      { label: 'Student Masterlist', icon: 'groups', route: 'student-masterlist' },
      { label: 'Learner Profile', icon: 'account_circle', route: 'learner-profile' },
      { label: 'Document Verification', icon: 'folder_open', route: 'documents' },
      { label: 'Section Assignment', icon: 'meeting_room', route: 'section-assignment' },
      { label: 'Classes', icon: 'class', route: 'classes' },
      { label: 'Academic Records', icon: 'history_edu', route: 'academic-records' },
      { label: 'Learner Movement', icon: 'sync_alt', route: 'learner-movement' },
      { label: 'Transferee Management', icon: 'transfer_within_a_station', route: 'transferee-management' },
      { label: 'Document Requests', icon: 'request_page', route: 'document-requests' },
      { label: 'DepEd Forms', icon: 'description', route: 'deped-forms' },
      { label: 'ID / QR Management', icon: 'qr_code_2', route: 'id-qr-management' },
      { label: 'Registrar Reports', icon: 'summarize', route: 'registrar-reports' }
    ]
  },
  {
    label: 'Finance',
    items: [
      { label: 'Payments', icon: 'payments', route: 'payments' },
      { label: 'Billing & Assessment', icon: 'receipt_long', route: 'billing-assessment' },
      { label: 'Billing Summary', icon: 'summarize', route: 'billing-summary' },
      { label: 'Student Ledger', icon: 'account_balance_wallet', route: 'student-ledger' },
      { label: 'Finance Setup', icon: 'settings', route: 'finance-setup' }
    ]
  },
  {
    label: 'Principal',
    items: [
      { label: 'Executive Dashboard', icon: 'space_dashboard', route: 'dashboard' },
      { label: 'Teacher Overview', icon: 'groups_3', route: 'teachers' },
      { label: 'Student Analytics', icon: 'school', route: 'students' },
      { label: 'Classes & Sections', icon: 'domain', route: 'classes' },
      { label: 'Academic Performance', icon: 'monitoring', route: 'performance' },
      { label: 'Attendance Monitoring', icon: 'fact_check', route: 'attendance' },
      { label: 'Enrollment', icon: 'how_to_reg', route: 'enrollment' },
      { label: 'Announcements', icon: 'campaign', route: 'announcements' },
      { label: 'Reports Center', icon: 'summarize', route: 'reports' },
      { label: 'Alerts', icon: 'notification_important', route: 'alerts' },
      { label: 'Messaging', icon: 'chat', route: 'messages' },
      { label: 'Settings', icon: 'settings', route: 'settings' }
    ]
  },
  {
    label: 'Teacher',
    items: [
      { label: 'Teacher Profile', icon: 'badge', route: 'profile' },
      { label: 'My Classes', icon: 'class', route: 'classes' },
      { label: 'Attendance', icon: 'fact_check', route: 'attendance' },
      { label: 'Grades', icon: 'leaderboard', route: 'grades' },
      { label: 'Schedule', icon: 'calendar_month', route: 'schedule' },
      { label: 'Learning Resources', icon: 'folder', route: 'resources' },
      { label: 'Daily Lesson Log', icon: 'menu_book', route: 'dll' },
      { label: 'Announcements', icon: 'campaign', route: 'announcements' },
      { label: 'Messages', icon: 'chat', route: 'messages' },
      { label: 'Analytics', icon: 'query_stats', route: 'analytics' },
      { label: 'Settings', icon: 'settings', route: 'settings' }
    ]
  },
  {
    label: 'Student',
    items: [
      { label: 'Student Profile', icon: 'account_circle', route: 'profile' },
      { label: 'My Classes', icon: 'class', route: 'classes' },
      { label: 'Assignments', icon: 'assignment', route: 'assignments' },
      { label: 'Grades', icon: 'bar_chart', route: 'grades' },
      { label: 'Attendance', icon: 'fact_check', route: 'attendance' },
      { label: 'Schedule', icon: 'calendar_month', route: 'schedule' },
      { label: 'Learning Resources', icon: 'folder', route: 'resources' },
      { label: 'Announcements', icon: 'campaign', route: 'announcements' },
      { label: 'Messages', icon: 'chat', route: 'messages' },
      { label: 'Submission Center', icon: 'upload_file', route: 'submissions' },
      { label: 'Progress Tracker', icon: 'query_stats', route: 'progress' },
      { label: 'Settings', icon: 'settings', route: 'settings' }
    ]
  },
  {
    label: 'Settings',
    items: [
      { label: 'Academic Years', icon: 'date_range', route: 'academic-years' }
    ]
  }
];

export const registrarStats: StatCard[] = [
  {
    title: 'Total Students',
    value: '0',
    helper: '0 this year',
    icon: 'groups',
    iconClass: 'bg-emerald-50 text-emerald-600',
    helperClass: 'text-emerald-600'
  },
  {
    title: 'Pending Enrollments',
    value: '0',
    helper: 'Needs review',
    icon: 'assignment',
    iconClass: 'bg-blue-50 text-blue-600',
    helperClass: 'text-blue-600'
  },
  {
    title: 'Document Verification',
    value: '0',
    helper: 'Incomplete files',
    icon: 'folder_open',
    iconClass: 'bg-amber-50 text-amber-600',
    helperClass: 'text-amber-600'
  },
  {
    title: 'Officially Enrolled',
    value: '0',
    helper: 'SY 2026–2027',
    icon: 'school',
    iconClass: 'bg-cyan-50 text-cyan-600',
    helperClass: 'text-cyan-600'
  }
];

export const financeStats: StatCard[] = [
  {
    title: 'Collections Today',
    value: '₱0',
    helper: '0 payments',
    icon: 'payments',
    iconClass: 'bg-emerald-50 text-emerald-600',
    helperClass: 'text-emerald-600'
  },
  {
    title: 'Pending Assessments',
    value: '0',
    helper: 'For billing',
    icon: 'description',
    iconClass: 'bg-blue-50 text-blue-600',
    helperClass: 'text-blue-600'
  },
  {
    title: 'Students With Balance',
    value: '0',
    helper: 'Needs follow-up',
    icon: 'person',
    iconClass: 'bg-amber-50 text-amber-600',
    helperClass: 'text-amber-600'
  },
  {
    title: 'Fully Paid Students',
    value: '0',
    helper: 'Cleared accounts',
    icon: 'task_alt',
    iconClass: 'bg-cyan-50 text-cyan-600',
    helperClass: 'text-cyan-600'
  }
];

export const registrarQueue: QueueItem[] = [];

export const financeQueue: QueueItem[] = [];

export const enrollmentProgress: ProgressItem[] = [
  {
    label: 'Officially Enrolled',
    count: '0 students',
    percent: 0,
    barClass: 'bg-gradient-to-r from-emerald-500 to-green-600',
    dotClass: 'bg-emerald-500'
  },
  {
    label: 'Pending Review',
    count: '0 students',
    percent: 0,
    barClass: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    dotClass: 'bg-blue-500'
  },
  {
    label: 'Incomplete Documents',
    count: '0 students',
    percent: 0,
    barClass: 'bg-gradient-to-r from-amber-500 to-orange-500',
    dotClass: 'bg-amber-500'
  }
];

export const quickActions: QuickAction[] = [
  { label: 'Register Student', icon: 'person_add', iconClass: 'bg-emerald-500 text-white' },
  { label: 'Generate Assessment', icon: 'description', iconClass: 'bg-blue-500 text-white' },
  { label: 'Record Payment', icon: 'payments', iconClass: 'bg-teal-500 text-white' },
  { label: 'Print SOA', icon: 'print', iconClass: 'bg-violet-500 text-white' }
];
