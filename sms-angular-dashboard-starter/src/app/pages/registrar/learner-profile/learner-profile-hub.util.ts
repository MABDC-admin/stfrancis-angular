import type { StudentRecord } from '../../../core/models/registrar.models';
import { gradeLevelMatches } from '../../../core/data/grade-levels';

export interface LearnerProfileHubStats {
  total: number;
  officiallyEnrolled: number;
  pendingReview: number;
  documentIssues: number;
  financeAttention: number;
}

export function learnerFullName(learner: Pick<StudentRecord, 'firstName' | 'middleName' | 'lastName' | 'suffix'>): string {
  return [learner.firstName, learner.middleName, learner.lastName, learner.suffix]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function filterLearnerProfiles(
  learners: StudentRecord[],
  query: string,
  gradeLevel: string,
  financeStatus: string
): StudentRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return learners.filter((learner) => {
    const searchText = [
      learnerFullName(learner),
      learner.studentNo,
      learner.lrn,
      learner.gradeLevel,
      learner.section,
      learner.adviser,
      learner.guardian,
      learner.contactNo,
      learner.address,
      learner.phAddress,
      learner.uaeAddress,
      learner.enrollmentStatus,
      learner.documentStatus,
      learner.financeStatus
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
    const matchesGrade = gradeLevel === 'All' || gradeLevelMatches(learner.gradeLevel, gradeLevel);
    const matchesFinance = financeStatus === 'All' || learner.financeStatus === financeStatus;

    return matchesQuery && matchesGrade && matchesFinance;
  });
}

export function buildLearnerProfileHubStats(learners: StudentRecord[]): LearnerProfileHubStats {
  return {
    total: learners.length,
    officiallyEnrolled: learners.filter((learner) => learner.enrollmentStatus?.includes('Officially')).length,
    pendingReview: learners.filter((learner) => learner.enrollmentStatus?.includes('Review') || learner.enrollmentStatus?.includes('Pending')).length,
    documentIssues: learners.filter((learner) => !learner.documentStatus?.includes('Complete')).length,
    financeAttention: learners.filter((learner) => !learner.financeStatus?.includes('Cleared')).length
  };
}
