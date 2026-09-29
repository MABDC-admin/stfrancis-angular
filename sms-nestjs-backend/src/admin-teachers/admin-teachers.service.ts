import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq, or, desc, asc, isNotNull, inArray } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import * as crypto from 'crypto';

type TeacherAccountStatus = 'Active' | 'Inactive' | 'Locked';
type TeacherAdminRole = 'Teacher' | 'Adviser' | 'Subject Teacher' | 'Coordinator' | 'Admin';

type TeacherInput = {
  fullName?: string;
  email?: string;
  contactNumber?: string;
  password?: string;
  role?: TeacherAdminRole;
  assignedGradeLevel?: string;
  sectionAssignment?: string;
  advisoryClass?: string;
  subjects?: string[];
  profilePhotoUrl?: string;
  accountStatus?: TeacherAccountStatus;
  totalClassesHandled?: number;
  numberOfStudents?: number;
  weeklyHours?: number;
};

@Injectable()
export class AdminTeachersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll() {
    // In Drizzle we fetch users that have role='TEACHER' or have a teacher profile
    const users = await this.drizzle.db.query.user.findMany({
      with: {
        teacherProfiles: true,
        teacherClassAssignments: {
          orderBy: [asc(schema.teacherClassAssignment.sectionName), asc(schema.teacherClassAssignment.subject)],
        },
      },
      orderBy: [desc(schema.user.createdAt)],
    });

    const teachers = users.filter(u => u.role === 'TEACHER' || u.teacherProfiles.length > 0);
    return teachers.map(teacher => this.toRecord(teacher));
  }

  async create(input: TeacherInput) {
    const fullName = this.requireText(input.fullName, 'Full name is required.');
    const email = this.requireEmail(input.email);
    const password = this.requireText(input.password, 'Password is required.');
    const subjects = this.requireSubjects(input.subjects);
    const hashed = await bcrypt.hash(password, 10);

    const existing = await this.drizzle.db.query.user.findFirst({ where: eq(schema.user.email, email) });
    if (existing) {
      throw new BadRequestException('Teacher email already exists.');
    }

    const userId = crypto.randomUUID();

    await this.drizzle.db.transaction(async (tx) => {
      await tx.insert(schema.user).values({
        id: userId,
        email,
        password: hashed,
        role: input.role === 'Admin' ? 'ADMIN' : 'TEACHER',
        avatarUrl: input.profilePhotoUrl?.trim() || null,
      });

      await tx.insert(schema.teacherProfile).values({
        id: crypto.randomUUID(),
        teacherUserId: userId,
        updatedAt: new Date().toISOString(),
        ...this.profileData(fullName, email, subjects, input),
      });

      const classes = this.classAssignments(subjects, input);
      if (classes.length) {
        await tx.insert(schema.teacherClassAssignment).values(
          classes.map(c => ({
            id: crypto.randomUUID(),
            teacherUserId: userId,
            ...c,
            updatedAt: new Date().toISOString(),
          }))
        );
      }
    });

    const created = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, userId),
      with: { teacherProfiles: true, teacherClassAssignments: true },
    });

    return this.toRecord(created);
  }

  async update(id: string, input: TeacherInput) {
    const user = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, id),
      with: { teacherProfiles: true },
    });

    if (!user) {
      throw new NotFoundException('Teacher account not found.');
    }

    const existingProfile = user.teacherProfiles?.[0];
    const fullName = input.fullName?.trim() || existingProfile?.name || user.email;
    const email = input.email?.trim().toLowerCase() || user.email;
    const subjects = input.subjects?.length ? input.subjects : this.splitSubjects(existingProfile?.subjects);
    const mergedInput: TeacherInput = {
      contactNumber: existingProfile?.phone ?? '',
      role: (existingProfile?.adminRole as TeacherAdminRole | undefined) ?? (user.role === 'ADMIN' ? 'Admin' : 'Teacher'),
      assignedGradeLevel: existingProfile?.assignedGradeLevel ?? '',
      sectionAssignment: existingProfile?.sectionAssignment ?? '',
      advisoryClass: existingProfile?.advisoryClass ?? '',
      subjects,
      profilePhotoUrl: user.avatarUrl ?? '',
      accountStatus: (existingProfile?.accountStatus as TeacherAccountStatus | undefined) ?? 'Active',
      totalClassesHandled: existingProfile?.totalClassesHandled ?? Math.max(1, subjects.length),
      numberOfStudents: existingProfile?.numberOfStudents ?? 0,
      weeklyHours: existingProfile?.weeklyHours ?? Math.max(6, subjects.length * 5),
      ...input,
    };

    await this.drizzle.db.transaction(async (tx) => {
      await tx.update(schema.user).set({
        email,
        role: mergedInput.role === 'Admin' ? 'ADMIN' : 'TEACHER',
        avatarUrl: mergedInput.profilePhotoUrl || null,
      }).where(eq(schema.user.id, id));

      const profilePayload = this.profileData(fullName, email, subjects, mergedInput);
      await tx.insert(schema.teacherProfile)
        .values({
          id: crypto.randomUUID(),
          teacherUserId: id,
          updatedAt: new Date().toISOString(),
          ...profilePayload,
        })
        .onConflictDoUpdate({
          target: [schema.teacherProfile.teacherUserId],
          set: { ...profilePayload, updatedAt: new Date().toISOString() },
        });

      if (input.subjects) {
        await tx.delete(schema.teacherClassAssignment).where(eq(schema.teacherClassAssignment.teacherUserId, id));
        const classes = this.classAssignments(subjects, mergedInput);
        if (classes.length) {
          await tx.insert(schema.teacherClassAssignment).values(
            classes.map(c => ({
              id: crypto.randomUUID(),
              teacherUserId: id,
              ...c,
              updatedAt: new Date().toISOString(),
            }))
          );
        }
      }
    });

    const updated = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, id),
      with: { teacherProfiles: true, teacherClassAssignments: true },
    });

    return this.toRecord(updated);
  }

  async resetPassword(id: string, password: string) {
    const nextPassword = this.requireText(password, 'Password is required.');
    const user = await this.drizzle.db.query.user.findFirst({ where: eq(schema.user.id, id) });

    if (!user) {
      throw new NotFoundException('Teacher account not found.');
    }

    const hashed = await bcrypt.hash(nextPassword, 10);
    await this.drizzle.db.update(schema.user).set({
      password: hashed,
    }).where(eq(schema.user.id, id));

    const updated = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, id),
      with: { teacherProfiles: true, teacherClassAssignments: true },
    });

    return this.toRecord(updated);
  }

  private profileData(fullName: string, email: string, subjects: string[], input: TeacherInput) {
    return {
      name: fullName,
      email,
      phone: input.contactNumber?.trim() ?? '',
      department: subjects[0] ?? '',
      advisoryClass: input.advisoryClass?.trim() ?? '',
      assignedGradeLevel: input.assignedGradeLevel?.trim() ?? null,
      accountStatus: input.accountStatus ?? 'Active',
      adminRole: input.role ?? 'Teacher',
      sectionAssignment: input.sectionAssignment?.trim() ?? '',
      subjects: subjects.join('|'),
      totalClassesHandled: Number(input.totalClassesHandled ?? Math.max(1, subjects.length)),
      numberOfStudents: Number(input.numberOfStudents ?? 0),
      weeklyHours: Number(input.weeklyHours ?? Math.max(6, subjects.length * 5)),
    };
  }

  private classAssignments(subjects: string[], input: TeacherInput) {
    const sectionName = input.sectionAssignment?.trim() || input.advisoryClass?.trim() || input.assignedGradeLevel?.trim() || 'Unassigned';
    return subjects.map(subject => ({
      sectionName,
      subject,
      schedule: 'TBA',
      room: '',
    }));
  }

  private toRecord(user: any) {
    const profile = user?.teacherProfiles?.[0];
    const subjects = this.splitSubjects(profile?.subjects);
    const classSubjects = user?.teacherClassAssignments?.map((item: any) => item.subject).filter(Boolean) ?? [];
    const effectiveSubjects = subjects.length ? subjects : [...new Set(classSubjects)];

    return {
      id: user.id,
      fullName: profile?.name ?? user.email,
      email: profile?.email ?? user.email,
      contactNumber: profile?.phone ?? '',
      assignedGradeLevel: profile?.assignedGradeLevel ?? '',
      advisoryClass: profile?.advisoryClass ?? '',
      subjects: effectiveSubjects as string[],
      accountStatus: profile?.accountStatus ?? 'Active',
      role: profile?.adminRole ?? (user.role === 'ADMIN' ? 'Admin' : 'Teacher'),
      dateCreated: this.toDateOnly(user.createdAt),
      profilePhotoUrl: user.avatarUrl ?? '',
      sectionAssignment: profile?.sectionAssignment ?? '',
      totalClassesHandled: profile?.totalClassesHandled ?? user.teacherClassAssignments?.length ?? 0,
      numberOfStudents: profile?.numberOfStudents ?? 0,
      weeklyHours: profile?.weeklyHours ?? 0,
      loginHistory: ['Stored in Neon-backed PostgreSQL'] as string[],
    };
  }

  private splitSubjects(subjects?: string | null): string[] {
    return (subjects ?? '').split('|').map(subject => subject.trim()).filter(Boolean);
  }

  private requireText(value: string | undefined, message: string): string {
    const text = value?.trim();
    if (!text) {
      throw new BadRequestException(message);
    }
    return text;
  }

  private requireEmail(value: string | undefined): string {
    const email = this.requireText(value, 'Email address is required.').toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Enter a valid email address.');
    }
    return email;
  }

  private requireSubjects(subjects: string[] | undefined): string[] {
    const list = (subjects ?? []).map(subject => subject.trim()).filter(Boolean);
    if (!list.length) {
      throw new BadRequestException('At least one subject is required.');
    }
    return list;
  }

  private toDateOnly(value: Date | string): string {
    if (!value) return '';
    return new Date(value).toISOString().slice(0, 10);
  }
}
