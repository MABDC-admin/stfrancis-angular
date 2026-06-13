import type { EnrollmentApplication } from '../../../core/models/registrar.models';

export function filterEnrollmentApplications(
  applications: EnrollmentApplication[],
  query: string
): EnrollmentApplication[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return applications;

  return applications.filter((application) => {
    const searchableText = [
      application.applicationNo,
      application.studentName,
      application.gradeLevel,
      application.studentType,
      application.status,
      application.documentStatus,
      application.financeStatus,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}
