import { Injectable } from '@nestjs/common';
import { asc, eq, isNull, or } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class CalendarEventsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.calendarEvent).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.calendarEvent.findMany({
      orderBy: [asc(schema.calendarEvent.eventDate)],
      where: ayId
        ? or(
            eq(schema.calendarEvent.academicYearId, ayId),
            isNull(schema.calendarEvent.academicYearId),
          )
        : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.calendarEvent.findFirst({
      where: eq(schema.calendarEvent.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.calendarEvent)
      .set(data)
      .where(eq(schema.calendarEvent.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.calendarEvent).where(eq(schema.calendarEvent.id, id)).returning();
    return deleted;
  }
}
