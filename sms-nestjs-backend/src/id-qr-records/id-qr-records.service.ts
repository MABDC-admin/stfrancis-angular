import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class IdQrRecordsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.idQrRecord).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.idQrRecord.findMany({
      where: ayId ? eq(schema.idQrRecord.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.idQrRecord.findFirst({
      where: eq(schema.idQrRecord.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.idQrRecord)
      .set(data)
      .where(eq(schema.idQrRecord.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.idQrRecord).where(eq(schema.idQrRecord.id, id)).returning();
    return deleted;
  }
}
