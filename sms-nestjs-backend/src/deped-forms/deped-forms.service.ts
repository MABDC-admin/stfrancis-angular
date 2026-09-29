import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class DepedFormsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.depEdForm).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.depEdForm.findMany({
      where: ayId ? eq(schema.depEdForm.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.depEdForm.findFirst({
      where: eq(schema.depEdForm.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.depEdForm)
      .set(data)
      .where(eq(schema.depEdForm.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.depEdForm).where(eq(schema.depEdForm.id, id)).returning();
    return deleted;
  }
}
