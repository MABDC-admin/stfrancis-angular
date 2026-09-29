import { BadRequestException } from '@nestjs/common';
import { DashboardSummaryService } from './dashboard-summary.service';
import { createDrizzleMock } from '../test/drizzle-mock';

describe('DashboardSummaryService', () => {
  function createService() {
    const db = createDrizzleMock({
      query: {
        academicYear: { findFirst: jest.fn() },
        student: { findMany: jest.fn() },
        section: { findMany: jest.fn() },
        documentRequest: { findMany: jest.fn() },
        calendarEvent: { findMany: jest.fn() },
        studentAssessment: { findMany: jest.fn() },
        payment: { findMany: jest.fn() },
      },
    });
    return { db, service: new DashboardSummaryService({ db } as never) };
  }

  it('returns a registrar-scoped dashboard payload for the selected academic year', async () => {
    const { db, service } = createService();
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      code: 'SY2026-2027',
      isActive: true,
    });
    (db.query.student.findMany as jest.Mock).mockResolvedValue([{ id: 'student-1' }]);
    (db.query.section.findMany as jest.Mock).mockResolvedValue([{ id: 'section-1' }]);
    (db.query.documentRequest.findMany as jest.Mock).mockResolvedValue([{ id: 'doc-1' }]);
    (db.query.calendarEvent.findMany as jest.Mock).mockResolvedValue([{ id: 'event-1' }]);

    const result = await service.getOverview('ay-1', 'REGISTRAR');

    expect(result.academicYear.code).toBe('SY2026-2027');
    expect(result.students).toHaveLength(1);
    expect(result.sections).toHaveLength(1);
    expect(result.documentRequests).toHaveLength(1);
    expect(result.calendarEvents).toHaveLength(1);
    expect(result.assessments).toHaveLength(0);
    expect(result.payments).toHaveLength(0);
    expect(db.query.student.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
    }));
    expect(db.query.section.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
    }));
  });

  it('includes finance collections for finance users in the same academic year', async () => {
    const { db, service } = createService();
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      code: 'SY2026-2027',
      isActive: true,
    });
    (db.query.student.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.calendarEvent.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.studentAssessment.findMany as jest.Mock).mockResolvedValue([{ id: 'assessment-1' }]);
    (db.query.payment.findMany as jest.Mock).mockResolvedValue([{ id: 'payment-1' }]);

    const result = await service.getOverview('ay-1', 'FINANCE');

    expect(result.sections).toHaveLength(0);
    expect(result.documentRequests).toHaveLength(0);
    expect(result.assessments).toHaveLength(1);
    expect(result.payments).toHaveLength(1);
    expect(db.query.studentAssessment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
      with: expect.any(Object),
      orderBy: expect.any(Array),
    }));
    expect(db.query.payment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.anything(),
      with: expect.any(Object),
      orderBy: expect.any(Array),
    }));
  });

  it('keeps dashboard calendar events scoped to the active year plus shared events', async () => {
    const { db, service } = createService();
    (db.query.academicYear.findFirst as jest.Mock).mockResolvedValue({
      id: 'ay-1',
      code: 'SY2026-2027',
      isActive: true,
    });
    (db.query.student.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.section.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.documentRequest.findMany as jest.Mock).mockResolvedValue([]);
    (db.query.calendarEvent.findMany as jest.Mock).mockResolvedValue([
      { id: 'event-active', academicYearId: 'ay-1', eventDate: '2026-06-17' },
      { id: 'event-shared', academicYearId: null, eventDate: '2026-06-18' },
      { id: 'event-other-ay', academicYearId: 'ay-2', eventDate: '2026-06-19' },
    ]);

    const result = await service.getOverview('ay-1', 'REGISTRAR');

    expect(result.calendarEvents.map(event => event.id)).toEqual(['event-active', 'event-shared']);
  });

  it('requires an academic year id', async () => {
    const { service } = createService();

    await expect(service.getOverview('', 'REGISTRAR')).rejects.toBeInstanceOf(BadRequestException);
  });
});
