import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class DocumentRequirementsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.documentRequirement).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.documentRequirement.findMany({
      where: ayId ? eq(schema.documentRequirement.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.documentRequirement.findFirst({
      where: eq(schema.documentRequirement.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.documentRequirement)
      .set(data)
      .where(eq(schema.documentRequirement.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.documentRequirement).where(eq(schema.documentRequirement.id, id)).returning();
    return deleted;
  }
}
