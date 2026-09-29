import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class EnrollmentApplicationsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [{ total }] = await this.drizzle.db
      .select({ total: count(schema.enrollmentApplication.id) })
      .from(schema.enrollmentApplication);
    const sequence = ((typeof total === 'number' ? total : Number(total)) + 1).toString().padStart(3, '0');
    const applicationNo = `APP-2026-${sequence}`;

    const [created] = await this.drizzle.db
      .insert(schema.enrollmentApplication)
      .values({
        ...data,
        applicationNo,
      })
      .returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.enrollmentApplication.findMany({
      where: ayId ? eq(schema.enrollmentApplication.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.enrollmentApplication.findFirst({
      where: eq(schema.enrollmentApplication.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.enrollmentApplication)
      .set(data)
      .where(eq(schema.enrollmentApplication.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db
      .delete(schema.enrollmentApplication)
      .where(eq(schema.enrollmentApplication.id, id))
      .returning();
    return deleted;
  }
}
