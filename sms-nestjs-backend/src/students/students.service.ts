import { BadRequestException, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { normalizeStandardGradeLevel } from '../sections/standard-sections.util';

const DEFAULT_STUDENT_PASSWORD = 'ChangeMe123!';

function toNumber(value: number | string | bigint | null | undefined) {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return Number(value || 0);
}

function withoutPassword<T extends { users?: Array<{ password?: string } | null> | null }>(record: T | null) {
  if (!record || !record.users?.length) {
    return record;
  }

  const [firstUser] = record.users;
  if (!firstUser) {
    return { ...record, user: null, users: [] } as T & { user: null; users: [] };
  }

  const { password, ...userWithoutPassword } = firstUser;
  void password;
  return {
    ...(record as T),
    user: userWithoutPassword,
    users: [userWithoutPassword],
  } as T & { user: typeof userWithoutPassword; users: typeof record['users'] };
}

@Injectable()
export class StudentsService {
  constructor(private drizzle: DrizzleService) {}

  private assertCreatePayload(payload: Record<string, unknown>) {
    if (!payload?.firstName || !payload?.lastName) {
      throw new BadRequestException('Student first name and last name are required.');
    }
  }

  private normalizeSearchPattern(search?: string) {
    return `%${(search ?? '').trim().replace(/%/g, '\\%')}%`;
  }

  async create(data: Record<string, unknown>) {
    this.assertCreatePayload(data);
    const normalizedPayload: any = {
      ...data,
      gradeLevel: data?.gradeLevel ? normalizeStandardGradeLevel(data.gradeLevel as string) : data.gradeLevel,
    };
    const [{ count: currentCount }] = await this.drizzle.db
      .select({ count: count(schema.student.id) })
      .from(schema.student);

    const sequence = (toNumber(currentCount) + 1).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const studentNo = `STU-${year}-${sequence}`;

    const id = crypto.randomUUID();
    delete normalizedPayload.id;
    delete normalizedPayload.studentNo;

    const [created] = await this.drizzle.db
      .insert(schema.student)
      .values({
        ...normalizedPayload,
        id,
        studentNo,
        lastUpdated: new Date().toISOString(),
      } as typeof schema.student.$inferInsert)
      .returning();

    return created;
  }

  async findAll(ayId?: string, search?: string) {
    const filters: SQL<unknown>[] = [];
    if (ayId) {
      filters.push(eq(schema.student.academicYearId, ayId));
    }
    if (search?.trim()) {
      const pattern = this.normalizeSearchPattern(search);
      const searchFilter = or(
        ilike(schema.student.firstName, pattern),
        ilike(schema.student.lastName, pattern),
        ilike(schema.student.lrn, pattern),
        ilike(schema.student.studentNo, pattern),
      );
      if (searchFilter) {
        filters.push(searchFilter);
      }
    }

    const where = filters.length ? and(...filters) : undefined;
    return this.drizzle.db.query.student.findMany({
      where,
      orderBy: [desc(schema.student.lastUpdated), asc(schema.student.firstName)],
      limit: search ? 5 : undefined,
    });
  }

  async findOne(id: string) {
    const row = await this.drizzle.db.query.student.findFirst({
      where: eq(schema.student.id, id),
      with: {
        behaviorRecords: true,
        studentFees: true,
        studentSiblings: true,
        users: true,
      },
    });

    if (!row) return null;

    const user = row.users?.[0] ?? null;
    const fees = row.studentFees ?? [];
    const siblings = row.studentSiblings ?? [];
    const withPasswordRemoved = withoutPassword({ ...row, user: user as { password?: string } | null, users: row.users });
    return {
      ...withPasswordRemoved,
      user: withPasswordRemoved?.user ?? null,
      fees,
      siblings,
    };
  }

  async update(id: string, data: Record<string, unknown>) {
    const student = await this.drizzle.db.query.student.findFirst({
      where: eq(schema.student.id, id),
      with: { users: true },
    });

    if (!student) {
      throw new BadRequestException('Student was not found.');
    }

    const nextEnrollment = data.enrollmentStatus as string | undefined;
    const wasOfficial = student.enrollmentStatus === 'Officially Enrolled';
    const nowOfficial = nextEnrollment === 'Officially Enrolled';
    const hasUser = student.users && student.users.length > 0;

    let currentUser = (student.users?.[0] ?? null) as { id: string } | null;

    if (nowOfficial && !wasOfficial && !hasUser) {
      const baseUsername = `${student.firstName?.toLowerCase?.()?.replace(/\s+/g, '') ?? ''}.${student.lastName?.toLowerCase?.()?.replace(/\s+/g, '') ?? ''}`;
      let email = `${baseUsername}@sfxsai.com`;
      let suffix = 1;

      while (await this.drizzle.db.query.user.findFirst({ where: eq(schema.user.email, email) })) {
        email = `${baseUsername}${suffix++}@sfxsai.com`;
      }

      const newUserId = crypto.randomUUID();
      await this.drizzle.db.insert(schema.user).values({
        id: newUserId,
        email,
        password: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
        role: 'STUDENT',
        studentId: id,
      });
      currentUser = { id: newUserId, email, role: 'STUDENT' } as { id: string } | null;
    }

    const payload: any = {
      ...data,
      gradeLevel: data?.gradeLevel ? normalizeStandardGradeLevel(data.gradeLevel as string) : data.gradeLevel,
    };
    delete payload.id;

    const [updated] = await this.drizzle.db
      .update(schema.student)
      .set({
        ...payload,
        lastUpdated: new Date().toISOString(),
      })
      .where(eq(schema.student.id, id))
      .returning();

    if (!updated) {
      throw new BadRequestException('Student was not found.');
    }

    return {
      ...updated,
      user: currentUser,
      users: currentUser ? [currentUser] : [],
    };
  }

  remove(id: string) {
    return this.drizzle.db.delete(schema.student).where(eq(schema.student.id, id)).returning();
  }

  addBehaviorRecord(
    studentId: string,
    data: Record<string, unknown>,
  ) {
    return this.drizzle.db.insert(schema.behaviorRecord).values({
      id: crypto.randomUUID(),
      studentId,
      ...(data as Record<string, unknown>),
    } as typeof schema.behaviorRecord.$inferInsert).returning();
  }

  addStudentFee(
    studentId: string,
    data: Record<string, unknown>,
  ) {
    return this.drizzle.db.insert(schema.studentFee).values({
      id: crypto.randomUUID(),
      studentId,
      ...(data as Record<string, unknown>),
    } as typeof schema.studentFee.$inferInsert).returning();
  }

  addStudentSibling(
    studentId: string,
    data: Record<string, unknown>,
  ) {
    return this.drizzle.db.insert(schema.studentSibling).values({
      id: crypto.randomUUID(),
      studentId,
      ...(data as Record<string, unknown>),
    } as typeof schema.studentSibling.$inferInsert).returning();
  }

  async resetPassword(studentId: string) {
    const user = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.studentId, studentId),
    });
    if (!user) {
      throw new BadRequestException('Student user account was not found.');
    }

    const [updated] = await this.drizzle.db
      .update(schema.user)
      .set({
        password: await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10),
      })
      .where(eq(schema.user.id, user.id))
      .returning();

    if (!updated) {
      throw new BadRequestException('Student user account was not found.');
    }

    const { password, ...safeUser } = updated;
    void password;
    return safeUser;
  }
}
