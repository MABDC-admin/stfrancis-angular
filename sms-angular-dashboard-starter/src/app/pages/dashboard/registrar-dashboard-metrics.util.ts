import type { StudentRecord, SectionRecord, DocumentRequest } from '../../core/models/registrar.models';

export interface RegistrarDashboardMetrics {
  totalStudents: number;
  pendingEnrollments: number;
  incompleteDocs: number;
  officiallyEnrolled: number;
  enrollmentTrend: { month: string; count: number; percent: number }[];
  gradeLevelStats: { grade: string; count: number; percent: number; color: string }[];
  gradeConicGradient: string;
  recentEnrollees: StudentRecord[];
  recentDocumentRequests: DocumentRequest[];
  sectionCapacity: { section: string; grade: string; enrolled: number; capacity: number; utilization: number }[];
}

const pendingEnrollmentStatuses = new Set(['Pending', 'Pending Review', 'Review']);
const officiallyEnrolledStatuses = new Set(['Officially Enrolled', 'Registrar Cleared']);
const gradeLevelsList = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

export function buildRegistrarDashboardMetrics(
  students: StudentRecord[],
  sections: SectionRecord[],
  documentRequests: DocumentRequest[]
): RegistrarDashboardMetrics {
  const total = students.length;

  // Recent Enrollees
  const enrolledStudents = students.filter(s => officiallyEnrolledStatuses.has(s.enrollmentStatus));
  const recentEnrollees = [...enrolledStudents]
    .sort((a, b) => new Date(b.enrollmentSubmittedAt || b.lastUpdated || 0).getTime() - new Date(a.enrollmentSubmittedAt || a.lastUpdated || 0).getTime())
    .slice(0, 5);

  // Grade Level Stats
  const dynamicGradeLevels = Array.from(new Set(students.map(s => s.gradeLevel))).filter(Boolean).sort();
  const colors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#6366f1',
    '#14b8a6', '#84cc16', '#eab308', '#d946ef', '#06b6d4', '#ec4899',
    '#64748b', '#0ea5e9'
  ];
  
  let currentPercent = 0;
  let gradientStops: string[] = [];

  const gradeLevelStats = dynamicGradeLevels.map((grade, index) => {
    const count = students.filter(s => s.gradeLevel === grade).length;
    const percent = total > 0 ? (count / total) * 100 : 0;
    const color = colors[index % colors.length];
    
    if (percent > 0) {
      gradientStops.push(`${color} ${currentPercent}% ${currentPercent + percent}%`);
      currentPercent += percent;
    }

    return {
      grade,
      count,
      percent: Math.round(percent),
      color
    };
  }).filter(g => g.count > 0);

  const gradeConicGradient = gradientStops.length ? `conic-gradient(${gradientStops.join(', ')})` : 'conic-gradient(#e2e8f0 0 100%)';

  // Trend
  const countsByMonth = new Array(12).fill(0);
  students.forEach(s => {
    const d = new Date(s.enrollmentSubmittedAt || s.lastUpdated || new Date());
    const m = d.getMonth(); // 0-11
    // Map standard JS months (Jan=0, Feb=1... May=4, Jun=5) to our array where Jun is 0
    let mIndex = m - 5;
    if (mIndex < 0) mIndex += 12;
    countsByMonth[mIndex]++;
  });
  
  const maxMonthlyCount = Math.max(...countsByMonth, 1);
  const enrollmentTrend = months.map((month, i) => ({
    month,
    count: countsByMonth[i],
    percent: Math.round((countsByMonth[i] / maxMonthlyCount) * 100) // normalized to 100% for the highest point
  }));

  // Recent Docs
  const recentDocumentRequests = [...documentRequests]
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
    .slice(0, 5);

  // Section Capacity
  const sectionCapacity = sections
    .map(s => ({
      section: s.sectionName,
      grade: s.gradeLevel,
      enrolled: s.enrolled,
      capacity: s.capacity,
      utilization: s.capacity > 0 ? Math.round((s.enrolled / s.capacity) * 100) : 0
    }))
    .sort((a, b) => {
      // sort by grade level then section name
      if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
      return a.section.localeCompare(b.section);
    })
    .slice(0, 5);

  return {
    totalStudents: total,
    pendingEnrollments: students.filter(student => pendingEnrollmentStatuses.has(student.enrollmentStatus)).length,
    incompleteDocs: students.filter(student => student.documentStatus === 'Incomplete').length,
    officiallyEnrolled: enrolledStudents.length,
    enrollmentTrend,
    gradeLevelStats,
    gradeConicGradient,
    recentEnrollees,
    recentDocumentRequests,
    sectionCapacity
  };
}
