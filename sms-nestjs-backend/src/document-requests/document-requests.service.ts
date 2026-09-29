import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class DocumentRequestsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.documentRequest).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.documentRequest.findMany({
      where: ayId ? eq(schema.documentRequest.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.documentRequest.findFirst({
      where: eq(schema.documentRequest.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.documentRequest)
      .set(data)
      .where(eq(schema.documentRequest.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.documentRequest).where(eq(schema.documentRequest.id, id)).returning();
    return deleted;
  }
}
