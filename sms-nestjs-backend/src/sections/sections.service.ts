import { Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { normalizeStandardGradeLevel } from './standard-sections.util';

@Injectable()
export class SectionsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const payload = {
      ...data,
      gradeLevel: data?.gradeLevel ? normalizeStandardGradeLevel(data.gradeLevel as string) : data?.gradeLevel,
    };
    const [created] = await this.drizzle.db.insert(schema.section).values(payload).returning();
    return created;
  }

  async findAll(ayId?: string) {
    const sections = await this.drizzle.db.query.section.findMany({
      where: ayId ? eq(schema.section.academicYearId, ayId) : undefined,
    });

    const students = await this.drizzle.db.query.student.findMany({
      where: ayId ? eq(schema.student.academicYearId, ayId) : undefined,
    });

    const normalizeSectionValue = (value?: string | null) =>
      (value ?? '').trim().toUpperCase();

    const sectionStatusFromCapacity = (capacity = 0, enrolled = 0): string => {
      const available = Math.max(capacity - enrolled, 0);
      if (available <= 0) return 'Closed';
      if (available <= 5) return 'Nearly Full';
      return 'Open';
    };

    const isCampusOnlySectionName = (sectionName?: string | null): boolean => {
      const normalized = normalizeSectionValue(sectionName);
      return normalized === 'SFXSAI' || normalized === 'MABDC';
    };

    const extractSectionCampus = (value?: string): 'SFXSAI' | 'MABDC' | undefined => {
      const normalized = normalizeSectionValue(value);
      if (!normalized) return undefined;
      const campusMatch = normalized.match(/(^|[\s_/-])(SFXSAI|MABDC)([\s_/-]|$)/i);
      if (!campusMatch) {
        return undefined;
      }

      const campus = campusMatch[2].toUpperCase();
      if (campus === 'SFXSAI') {
        return 'SFXSAI';
      }
      if (campus === 'MABDC') {
        return 'MABDC';
      }
      return undefined;
    };

    const matchesSectionIdentifier = (studentSection: string | null, section: typeof sections[number]): boolean => {
      const normalizedStudentSection = normalizeSectionValue(studentSection);
      if (!normalizedStudentSection) {
        return false;
      }

      const normalizedSectionName = normalizeSectionValue(section.sectionName);
      const normalizedSectionId = normalizeSectionValue(section.id);
      const normalizedSectionGrade = normalizeSectionValue(section.gradeLevel);

      if (
        normalizedStudentSection === normalizedSectionName ||
        normalizedStudentSection === normalizedSectionId
      ) {
        return true;
      }

      return (
        normalizedStudentSection === `${normalizedSectionName}-${normalizedSectionGrade}` ||
        normalizedStudentSection === `${normalizedSectionName} ${normalizedSectionGrade}` ||
        normalizedStudentSection.endsWith(`-${normalizedSectionName}`) ||
        normalizedStudentSection.endsWith(` ${normalizedSectionName}`) ||
        normalizedStudentSection === normalizedSectionName ||
        normalizedStudentSection.startsWith(`${normalizedSectionName}-`) ||
        normalizedStudentSection.startsWith(`${normalizedSectionName} `) ||
        normalizedStudentSection.includes(`-${normalizedSectionName}-`) ||
        normalizedStudentSection.includes(` ${normalizedSectionName}-`) ||
        normalizedStudentSection.includes(` ${normalizedSectionName} `) ||
        normalizedStudentSection.includes(`-${normalizedSectionName} `)
      );
    };

    const studentAssignedToSection = (student: typeof students[number], section: typeof sections[number]): boolean => {
      if (!student.section || !section.gradeLevel) {
        return false;
      }

      if (matchesSectionIdentifier(student.section, section)) {
        return normalizeStandardGradeLevel(student.gradeLevel) === normalizeStandardGradeLevel(section.gradeLevel);
      }

      const studentCampus = extractSectionCampus(student.section);
      const sectionCampus = extractSectionCampus(section.sectionName);
      if (!studentCampus || !sectionCampus || studentCampus !== sectionCampus) {
        return false;
      }

      if (!isCampusOnlySectionName(section.sectionName)) {
        return normalizeStandardGradeLevel(student.gradeLevel) === normalizeStandardGradeLevel(section.gradeLevel);
      }

      return false;
    };

    const computeSectionEnrollment = (section: typeof sections[number]): number => {
      return students.filter(student => studentAssignedToSection(student, section)).length;
    };

    return sections.map((section) => {
      const enrolled = computeSectionEnrollment(section);
      const capacity = section.capacity ?? 0;
      return {
        ...section,
        gradeLevel: normalizeStandardGradeLevel(section.gradeLevel),
        enrolled,
        availableSlots: Math.max(capacity - enrolled, 0),
        status: sectionStatusFromCapacity(capacity, enrolled),
      };
    });
  }

  async getTeachers() {
    return this.drizzle.db.query.user.findMany({
      where: eq(schema.user.role, 'TEACHER'),
      with: {
        teacherProfiles: true,
      },
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.section.findFirst({
      where: eq(schema.section.id, id),
      with: {
        teacherClassAssignments: true,
      },
    });
  }

  async update(id: string, data: any) {
    const payload = {
      ...data,
      gradeLevel: data?.gradeLevel ? normalizeStandardGradeLevel(data.gradeLevel as string) : data?.gradeLevel,
    };
    const [updated] = await this.drizzle.db
      .update(schema.section)
      .set(payload)
      .where(eq(schema.section.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.section).where(eq(schema.section.id, id)).returning();
    return deleted;
  }

  async batchAssign(sectionId: string, studentIds: string[]) {
    const section = await this.drizzle.db.query.section.findFirst({
      where: eq(schema.section.id, sectionId),
    });
    if (!section) throw new Error('Section not found');

    if (studentIds.length > 0) {
      await this.drizzle.db
        .update(schema.student)
        .set({ section: section.sectionName, enrollmentStatus: 'Assigned' })
        .where(inArray(schema.student.id, studentIds))
        .returning();
    }

    const newEnrolled = section.enrolled + studentIds.length;
    const newAvailable = section.capacity - newEnrolled;
    const [updated] = await this.drizzle.db
      .update(schema.section)
      .set({
        enrolled: newEnrolled,
        availableSlots: newAvailable,
      })
      .where(eq(schema.section.id, sectionId))
      .returning();

    return updated;
  }
}
