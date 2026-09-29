import { PgDialect } from 'drizzle-orm/pg-core';
import { CalendarEventsService } from './calendar-events.service';
import { createDrizzleMock } from '../test/drizzle-mock';

describe('CalendarEventsService', () => {
  function createService() {
    const db = createDrizzleMock({
      query: {
        calendarEvent: { findMany: jest.fn() },
      },
    });

    return {
      db,
      service: new CalendarEventsService({ db } as never),
    };
  }

  it('includes shared events when filtering by academic year', async () => {
    const { db, service } = createService();
    const findMany = db.query.calendarEvent.findMany as jest.Mock;
    findMany.mockResolvedValue([{ id: 'event-1' }]);

    await service.findAll('ay-1');

    expect(findMany).toHaveBeenCalledTimes(1);
    const args = findMany.mock.calls[0][0];
    const renderedWhere = new PgDialect().sqlToQuery(args.where);

    expect(renderedWhere.sql).toContain('"CalendarEvent"."academicYearId" = $1');
    expect(renderedWhere.sql).toContain('"CalendarEvent"."academicYearId" is null');
    expect(renderedWhere.params).toEqual(['ay-1']);
  });

  it('does not apply an academic year filter when no academic year is selected', async () => {
    const { db, service } = createService();
    const findMany = db.query.calendarEvent.findMany as jest.Mock;
    findMany.mockResolvedValue([{ id: 'event-1' }]);

    await service.findAll();

    expect(findMany).toHaveBeenCalledWith({
      orderBy: expect.any(Array),
      where: undefined,
    });
  });
});
