import { BadRequestException, Injectable } from '@nestjs/common';
import { asc, desc, eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class DashboardSummaryService {
  constructor(private readonly drizzle: DrizzleService) {}

  private isCalendarEventVisibleToAcademicYear(
    event: { academicYearId?: string | null },
    academicYearId: string,
  ) {
    return !event.academicYearId || event.academicYearId === academicYearId;
  }

  async getOverview(academicYearId: string, role?: string) {
    if (!academicYearId) {
      throw new BadRequestException('academicYearId is required.');
    }

    const includeFinance = role !== 'REGISTRAR';
    const includeRegistrarOperations = role === 'REGISTRAR';

    const academicYear = await this.drizzle.db.query.academicYear.findFirst({
      where: eq(schema.academicYear.id, academicYearId),
    });
    if (!academicYear) {
      throw new BadRequestException('Academic year was not found.');
    }

    const [
      students,
      sections,
      documentRequests,
      calendarEvents,
      assessments,
      payments,
    ] = await Promise.all([
      this.drizzle.db.query.student.findMany({
        where: eq(schema.student.academicYearId, academicYearId),
      }),
      includeRegistrarOperations
        ? this.drizzle.db.query.section.findMany({
            where: eq(schema.section.academicYearId, academicYearId),
          })
        : Promise.resolve([]),
      includeRegistrarOperations
        ? this.drizzle.db.query.documentRequest.findMany({
            where: eq(schema.documentRequest.academicYearId, academicYearId),
          })
        : Promise.resolve([]),
      this.drizzle.db.query.calendarEvent.findMany({
        orderBy: [asc(schema.calendarEvent.eventDate)],
      }),
      includeFinance
        ? this.drizzle.db.query.studentAssessment.findMany({
            where: eq(schema.studentAssessment.academicYearId, academicYearId),
            with: {
              student: true,
              studentAssessmentLineItems: {
                with: { feeType: true },
              },
              payments: {
                orderBy: [desc(schema.payment.paymentDate)],
              },
            },
            orderBy: [desc(schema.studentAssessment.updatedAt)],
          })
        : Promise.resolve([]),
      includeFinance
        ? this.drizzle.db.query.payment.findMany({
            where: eq(schema.payment.academicYearId, academicYearId),
            with: {
              student: true,
              studentAssessment: true,
            },
            orderBy: [desc(schema.payment.paymentDate)],
          })
        : Promise.resolve([]),
    ]);

    return {
      academicYear,
      students,
      sections,
      documentRequests,
      calendarEvents: calendarEvents.filter(event =>
        this.isCalendarEventVisibleToAcademicYear(event, academicYearId),
      ),
      assessments,
      payments,
    };
  }
}
