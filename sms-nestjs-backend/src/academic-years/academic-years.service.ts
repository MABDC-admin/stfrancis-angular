import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';

@Injectable()
export class AcademicYearsService {
  constructor(private drizzle: DrizzleService) {}

  async create(data: any) {
    const [created] = await this.drizzle.db.insert(schema.academicYear).values(data).returning();
    return created;
  }

  async findAll() {
    return this.drizzle.db.query.academicYear.findMany();
  }

  async findOne(id: string) {
    return this.drizzle.db.query.academicYear.findFirst({ where: eq(schema.academicYear.id, id) });
  }

  async update(id: string, data: any) {
    const [updated] = await this.drizzle.db
      .update(schema.academicYear)
      .set(data)
      .where(eq(schema.academicYear.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [deleted] = await this.drizzle.db.delete(schema.academicYear).where(eq(schema.academicYear.id, id)).returning();
    return deleted;
  }
}
