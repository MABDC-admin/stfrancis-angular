import type { AcademicRecord } from '../../../core/models/registrar.models';
import { gradeLevelMatches, normalizeGradeLevel } from '../../../core/data/grade-levels';

export type AcademicRecordStatus = 'Validated' | 'For Review' | 'Promoted' | 'Retained' | 'Incomplete';

export interface AcademicRecordStats {
  total: number;
  validated: number;
  forReview: number;
  promoted: number;
  retainedOrIncomplete: number;
}

export function normalizeAcademicStatus(value?: string): AcademicRecordStatus {
  if (value === 'Validated' || value === 'For Review' || value === 'Promoted' || value === 'Retained') {
    return value;
  }
  return 'Incomplete';
}

export function filterAcademicRecords(
  records: AcademicRecord[],
  query: string,
  gradeLevel: string,
  schoolYear: string,
  status: string
): AcademicRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((record) => {
    const searchText = [
      record.studentName,
      record.gradeLevel,
      record.section,
      record.schoolYear,
      record.generalAverage,
      record.remarks,
      record.status
    ].filter(Boolean).join(' ').toLowerCase();

    const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
    const matchesGrade = gradeLevel === 'All' || gradeLevelMatches(record.gradeLevel, gradeLevel);
    const matchesYear = schoolYear === 'All' || record.schoolYear === schoolYear;
    const matchesStatus = status === 'All' || normalizeAcademicStatus(record.status) === status;

    return matchesQuery && matchesGrade && matchesYear && matchesStatus;
  });
}

export function buildAcademicRecordStats(records: AcademicRecord[]): AcademicRecordStats {
  return {
    total: records.length,
    validated: records.filter((record) => normalizeAcademicStatus(record.status) === 'Validated').length,
    forReview: records.filter((record) => normalizeAcademicStatus(record.status) === 'For Review').length,
    promoted: records.filter((record) => record.remarks?.toLowerCase().includes('promoted') || normalizeAcademicStatus(record.status) === 'Promoted').length,
    retainedOrIncomplete: records.filter((record) => {
      const status = normalizeAcademicStatus(record.status);
      const remarks = record.remarks?.toLowerCase() || '';
      return status === 'Retained' || status === 'Incomplete' || remarks.includes('retained') || remarks.includes('incomplete');
    }).length
  };
}

export function sortAcademicRecords(records: AcademicRecord[]): AcademicRecord[] {
  return [...records].sort((a, b) => {
    const yearCompare = b.schoolYear.localeCompare(a.schoolYear);
    if (yearCompare !== 0) return yearCompare;

    const gradeCompare = normalizeGradeLevel(a.gradeLevel).localeCompare(normalizeGradeLevel(b.gradeLevel), undefined, { numeric: true });
    if (gradeCompare !== 0) return gradeCompare;

    return a.studentName.localeCompare(b.studentName);
  });
}
