import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class LearnerMovementsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.learnerMovement).values(data).returning();
    return created;
  }

  async findAll(ayId?: string) {
    return this.drizzle.db.query.learnerMovement.findMany({
      where: ayId ? eq(schema.learnerMovement.academicYearId, ayId) : undefined,
    });
  }

  async findOne(id: string) {
    return this.drizzle.db.query.learnerMovement.findFirst({
      where: eq(schema.learnerMovement.id, id),
    });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.learnerMovement)
      .set(data)
      .where(eq(schema.learnerMovement.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.learnerMovement).where(eq(schema.learnerMovement.id, id)).returning();
    return deleted;
  }
}
