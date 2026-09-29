import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class AcademicRecordsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.academicRecord).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.academicRecord.findMany({
      where: ayId ? eq(schema.academicRecord.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.academicRecord.findFirst({
      where: eq(schema.academicRecord.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.academicRecord)
      .set(data)
      .where(eq(schema.academicRecord.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.academicRecord).where(eq(schema.academicRecord.id, id)).returning();
    return deleted;
  }
}
