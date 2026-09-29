import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DrizzleService } from '../drizzle/drizzle.service';
import { eq, inArray, and, desc, asc } from 'drizzle-orm';
import * as schema from '../drizzle/schema';
import * as crypto from 'crypto';

type TeacherUser = {
  userId?: string;
  sub?: string;
  id?: string;
  email?: string;
  role?: string;
};

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
type ResourceType = 'PDF' | 'Video' | 'Document' | 'Link';
type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

const WEEKDAY_SORT: Record<Weekday, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
};

type StudentRow = typeof schema.student.$inferSelect;
type ClassAssignmentRow = typeof schema.teacherClassAssignment.$inferSelect & { section?: typeof schema.section.$inferSelect | null };
type AttendanceRecordRow = typeof schema.teacherAttendanceRecord.$inferSelect;

@Injectable()
export class TeacherService {
  constructor(private readonly drizzle: DrizzleService) {}

  async getPortalState(user: TeacherUser) {
    return this.buildPortalState(user);
  }

  private async buildPortalState(user: TeacherUser) {
    const teacherUserId = this.requireTeacherUserId(user);
    const account = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, teacherUserId),
      columns: { id: true, email: true },
    });

    if (!account) {
      throw new NotFoundException('Teacher account not found.');
    }

    const profile = await this.drizzle.db.query.teacherProfile.findFirst({
      where: eq(schema.teacherProfile.teacherUserId, teacherUserId),
    });
    const classes = await this.drizzle.db.query.teacherClassAssignment.findMany({
      where: eq(schema.teacherClassAssignment.teacherUserId, teacherUserId),
      orderBy: [asc(schema.teacherClassAssignment.sectionName), asc(schema.teacherClassAssignment.subject)],
      with: { section: true },
    });
    const students = await this.loadAssignedStudents(classes as any, profile?.assignedGradeLevel);
    const studentIdsByClass = this.mapStudentIdsByClass(classes as any, students);

    const [attendance, grades, resources, dlls, announcements, messages, scheduleEntries] = await Promise.all([
      this.drizzle.db.query.teacherAttendanceRecord.findMany({
        where: eq(schema.teacherAttendanceRecord.teacherUserId, teacherUserId),
        orderBy: [desc(schema.teacherAttendanceRecord.date), desc(schema.teacherAttendanceRecord.updatedAt)],
      }),
      this.drizzle.db.query.teacherGradeRecord.findMany({
        where: eq(schema.teacherGradeRecord.teacherUserId, teacherUserId),
        orderBy: [asc(schema.teacherGradeRecord.classId), asc(schema.teacherGradeRecord.studentId), asc(schema.teacherGradeRecord.quarter)],
      }),
      this.drizzle.db.query.teacherResource.findMany({
        where: eq(schema.teacherResource.teacherUserId, teacherUserId),
        orderBy: [desc(schema.teacherResource.uploadedAt)],
      }),
      this.drizzle.db.query.teacherLessonLog.findMany({
        where: eq(schema.teacherLessonLog.teacherUserId, teacherUserId),
        orderBy: [desc(schema.teacherLessonLog.date)],
      }),
      this.drizzle.db.query.teacherAnnouncement.findMany({
        where: eq(schema.teacherAnnouncement.teacherUserId, teacherUserId),
        orderBy: [desc(schema.teacherAnnouncement.postedAt)],
      }),
      this.drizzle.db.query.teacherDirectMessage.findMany({
        where: eq(schema.teacherDirectMessage.teacherUserId, teacherUserId),
        orderBy: [desc(schema.teacherDirectMessage.sentAt)],
      }),
      this.drizzle.db.query.teacherScheduleEntry.findMany({
        where: eq(schema.teacherScheduleEntry.teacherUserId, teacherUserId),
        orderBy: [asc(schema.teacherScheduleEntry.weekdaySort), asc(schema.teacherScheduleEntry.startTime), asc(schema.teacherScheduleEntry.title)],
      }),
    ]);

    return {
      teacher: {
        name: profile?.name ?? account.email ?? user.email ?? 'Teacher',
        email: profile?.email ?? account.email ?? user.email ?? '',
        department: profile?.department ?? '',
        phone: profile?.phone ?? '',
        advisoryClass: profile?.advisoryClass ?? 'No advisory class assigned',
        assignedGradeLevel: profile?.assignedGradeLevel ?? null,
      },
      classes: classes.map(item => ({
        id: item.id,
        section: item.sectionName,
        subject: item.subject,
        schedule: item.schedule,
        room: item.room ?? '',
        studentIds: studentIdsByClass.get(item.id) ?? [],
        gradeLevel: item.section?.gradeLevel ? parseInt(item.section.gradeLevel.replace(/\D/g, ''), 10) : (profile?.assignedGradeLevel ? parseInt(profile.assignedGradeLevel.replace(/\D/g, ''), 10) : undefined),
      })),
      students: students.map(student => ({
        id: student.id,
        name: this.studentName(student),
        studentNo: student.studentNo,
        gradeLevel: student.gradeLevel,
        gender: student.gender ?? '',
        guardian: student.guardian ?? '',
        contact: student.contactNo ?? '',
        photoUrl: student.photoUrl ?? '',
      })),
      attendance: attendance.map(record => ({
        id: record.id,
        classId: record.classId,
        studentId: record.studentId,
        date: this.toDateOnly(new Date(record.date)),
        status: record.status,
        reason: record.reason ?? '',
      })),
      grades: grades.map(record => ({
        id: record.id,
        classId: record.classId,
        studentId: record.studentId,
        quarter: record.quarter,
        written: record.written,
        performance: record.performance,
        exam: record.exam,
      })),
      resources: resources.map(record => ({
        id: record.id,
        classId: record.classId,
        title: record.title,
        type: record.type,
        subject: record.subject,
        size: record.size,
        uploadedAt: this.toDateOnly(new Date(record.uploadedAt)),
      })),
      dlls: dlls.map(record => ({
        id: record.id,
        classId: record.classId,
        date: this.toDateOnly(new Date(record.date)),
        objectives: record.objectives,
        activities: record.activities,
        materials: record.materials,
        remarks: record.remarks ?? '',
      })),
      announcements: announcements.map(record => ({
        id: record.id,
        audience: record.audience,
        title: record.title,
        body: record.body,
        postedAt: this.toDateOnly(new Date(record.postedAt)),
      })),
      messages: messages.map(record => ({
        id: record.id,
        thread: record.thread,
        sender: record.sender,
        audience: record.audience,
        message: record.message,
        sentAt: new Date(record.sentAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      })),
      scheduleEntries: scheduleEntries.map(record => ({
        id: record.id,
        weekday: record.weekday,
        title: record.title,
        startTime: record.startTime,
      })),
    };
  }

  async updateProfile(teacherUserId: string, profile: {
    name?: string;
    email?: string;
    department?: string;
    phone?: string;
    advisoryClass?: string;
    assignedGradeLevel?: string;
  }) {
    const name = this.requireText(profile.name, 'Teacher name is required.');
    const email = this.requireText(profile.email, 'Teacher email is required.');

    const payload = {
      name,
      email,
      department: profile.department?.trim() ?? '',
      phone: profile.phone?.trim() ?? '',
      advisoryClass: profile.advisoryClass?.trim() ?? '',
      assignedGradeLevel: profile.assignedGradeLevel?.trim() ?? null,
      updatedAt: new Date().toISOString(),
    };

    return this.drizzle.db.insert(schema.teacherProfile)
      .values({
        id: crypto.randomUUID(),
        teacherUserId,
        ...payload,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.teacherProfile.teacherUserId],
        set: payload,
      });
  }

  async markAttendance(teacherUserId: string, body: {
    classId?: string;
    studentId?: string;
    date?: string;
    status?: AttendanceStatus;
    reason?: string;
  }) {
    const classId = this.requireText(body.classId, 'Class is required.');
    const studentId = this.requireText(body.studentId, 'Student is required.');
    const dateStr = this.parseDate(body.date, 'Attendance date is required.').toISOString();
    const status = this.requireOneOf(body.status, ['Present', 'Absent', 'Late', 'Excused'], 'Attendance status is invalid.');
    const reason = status === 'Absent' || status === 'Excused'
      ? (body.reason ?? '').trim()
      : '';

    return this.drizzle.db.insert(schema.teacherAttendanceRecord)
      .values({
        id: crypto.randomUUID(),
        teacherUserId,
        classId,
        studentId,
        date: dateStr,
        status,
        reason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.teacherAttendanceRecord.teacherUserId, schema.teacherAttendanceRecord.classId, schema.teacherAttendanceRecord.studentId, schema.teacherAttendanceRecord.date],
        set: { status, reason, updatedAt: new Date().toISOString() },
      });
  }

  async upsertGrade(teacherUserId: string, body: {
    classId?: string;
    studentId?: string;
    quarter?: Quarter;
    written?: number | null;
    performance?: number | null;
    exam?: number | null;
  }) {
    const classId = this.requireText(body.classId, 'Class is required.');
    const studentId = this.requireText(body.studentId, 'Student is required.');
    const quarter = this.requireOneOf(body.quarter, ['Q1', 'Q2', 'Q3', 'Q4'], 'Quarter is invalid.');
    const data = {
      written: this.nullableScore(body.written),
      performance: this.nullableScore(body.performance),
      exam: this.nullableScore(body.exam),
      updatedAt: new Date().toISOString(),
    };

    return this.drizzle.db.insert(schema.teacherGradeRecord)
      .values({
        id: crypto.randomUUID(),
        teacherUserId,
        classId,
        studentId,
        quarter,
        ...data,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [schema.teacherGradeRecord.teacherUserId, schema.teacherGradeRecord.classId, schema.teacherGradeRecord.studentId, schema.teacherGradeRecord.quarter],
        set: data,
      });
  }

  async createResource(teacherUserId: string, body: {
    classId?: string;
    title?: string;
    type?: ResourceType;
    subject?: string;
    size?: string;
  }) {
    return this.drizzle.db.insert(schema.teacherResource).values({
      id: crypto.randomUUID(),
      teacherUserId,
      classId: this.requireText(body.classId, 'Class is required.'),
      title: this.requireText(body.title, 'Resource title is required.'),
      type: this.requireOneOf(body.type, ['PDF', 'Video', 'Document', 'Link'], 'Resource type is invalid.'),
      subject: this.requireText(body.subject, 'Subject is required.'),
      size: body.size?.trim() || 'Pending upload',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async updateResource(teacherUserId: string, id: string, body: {
    title?: string;
    type?: ResourceType;
    subject?: string;
    size?: string;
  }) {
    const data: any = { updatedAt: new Date().toISOString() };
    if (body.title) data.title = body.title.trim();
    if (body.type) data.type = body.type;
    if (body.subject) data.subject = body.subject.trim();
    if (body.size) data.size = body.size.trim();

    const result = await this.drizzle.db.update(schema.teacherResource)
      .set(data)
      .where(and(eq(schema.teacherResource.id, id), eq(schema.teacherResource.teacherUserId, teacherUserId)))
      .returning();
      
    this.assertOwnedDelete(result.length);
    return { updated: true };
  }

  async deleteResource(teacherUserId: string, id: string) {
    const result = await this.drizzle.db.delete(schema.teacherResource)
      .where(and(eq(schema.teacherResource.id, id), eq(schema.teacherResource.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { deleted: true };
  }

  async createLessonLog(teacherUserId: string, body: {
    classId?: string;
    date?: string;
    objectives?: string;
    activities?: string;
    materials?: string;
    remarks?: string;
  }) {
    return this.drizzle.db.insert(schema.teacherLessonLog).values({
      id: crypto.randomUUID(),
      teacherUserId,
      classId: this.requireText(body.classId, 'Class is required.'),
      date: this.parseDate(body.date, 'Lesson date is required.').toISOString(),
      objectives: this.requireText(body.objectives, 'Learning objectives are required.'),
      activities: this.requireText(body.activities, 'Activities are required.'),
      materials: this.requireText(body.materials, 'Materials are required.'),
      remarks: body.remarks?.trim() ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async updateLessonLog(teacherUserId: string, id: string, body: {
    date?: string;
    objectives?: string;
    activities?: string;
    materials?: string;
    remarks?: string;
  }) {
    const data: any = { updatedAt: new Date().toISOString() };
    if (body.date) data.date = this.parseDate(body.date, 'Lesson date is required.').toISOString();
    if (body.objectives) data.objectives = body.objectives.trim();
    if (body.activities) data.activities = body.activities.trim();
    if (body.materials) data.materials = body.materials.trim();
    if (body.remarks) data.remarks = body.remarks.trim();

    const result = await this.drizzle.db.update(schema.teacherLessonLog)
      .set(data)
      .where(and(eq(schema.teacherLessonLog.id, id), eq(schema.teacherLessonLog.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { updated: true };
  }

  async deleteLessonLog(teacherUserId: string, id: string) {
    const result = await this.drizzle.db.delete(schema.teacherLessonLog)
      .where(and(eq(schema.teacherLessonLog.id, id), eq(schema.teacherLessonLog.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { deleted: true };
  }

  async createAnnouncement(teacherUserId: string, body: {
    audience?: string;
    title?: string;
    body?: string;
  }) {
    return this.drizzle.db.insert(schema.teacherAnnouncement).values({
      id: crypto.randomUUID(),
      teacherUserId,
      audience: this.requireText(body.audience, 'Audience is required.'),
      title: this.requireText(body.title, 'Announcement title is required.'),
      body: this.requireText(body.body, 'Announcement body is required.'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async updateAnnouncement(teacherUserId: string, id: string, body: {
    audience?: string;
    title?: string;
    body?: string;
  }) {
    const data: any = { updatedAt: new Date().toISOString() };
    if (body.audience) data.audience = body.audience.trim();
    if (body.title) data.title = body.title.trim();
    if (body.body) data.body = body.body.trim();

    const result = await this.drizzle.db.update(schema.teacherAnnouncement)
      .set(data)
      .where(and(eq(schema.teacherAnnouncement.id, id), eq(schema.teacherAnnouncement.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { updated: true };
  }

  async deleteAnnouncement(teacherUserId: string, id: string) {
    const result = await this.drizzle.db.delete(schema.teacherAnnouncement)
      .where(and(eq(schema.teacherAnnouncement.id, id), eq(schema.teacherAnnouncement.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { deleted: true };
  }

  async sendMessage(teacherUserId: string, body: {
    thread?: string;
    audience?: 'Student' | 'Parent' | 'Admin';
    message?: string;
  }) {
    return this.drizzle.db.insert(schema.teacherDirectMessage).values({
      id: crypto.randomUUID(),
      teacherUserId,
      thread: this.requireText(body.thread, 'Thread is required.'),
      sender: 'You',
      audience: this.requireOneOf(body.audience, ['Student', 'Parent', 'Admin'], 'Message audience is invalid.'),
      message: this.requireText(body.message, 'Message is required.'),
      createdAt: new Date().toISOString(),
    });
  }

  async createScheduleEntry(teacherUserId: string, body: {
    weekday?: string;
    title?: string;
    startTime?: string;
  }) {
    const weekday = this.requireWeekday(body.weekday);
    const title = this.requireText(body.title, 'Schedule title is required.');
    const startTime = this.requireTime(body.startTime);

    return this.drizzle.db.insert(schema.teacherScheduleEntry).values({
      id: crypto.randomUUID(),
      teacherUserId,
      weekday,
      weekdaySort: WEEKDAY_SORT[weekday],
      title,
      startTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteScheduleEntry(teacherUserId: string, id: string) {
    const result = await this.drizzle.db.delete(schema.teacherScheduleEntry)
      .where(and(eq(schema.teacherScheduleEntry.id, id), eq(schema.teacherScheduleEntry.teacherUserId, teacherUserId)))
      .returning();
    this.assertOwnedDelete(result.length);
    return { deleted: true };
  }

  requireTeacherUserId(user: TeacherUser): string {
    const id = user.sub ?? user.userId ?? user.id;
    if (!id) {
      throw new ForbiddenException('Teacher account is required.');
    }
    return id;
  }

  private async loadAssignedStudents(classes: ClassAssignmentRow[], assignedGradeLevel?: string | null): Promise<StudentRow[]> {
    if (!classes.length) {
      return [];
    }

    const sections = Array.from(new Set(classes.map(item => item.sectionName).filter(Boolean)));
    const conditions = [inArray(schema.student.section, sections)];

    if (assignedGradeLevel) {
      conditions.push(eq(schema.student.gradeLevel, assignedGradeLevel));
    }

    return this.drizzle.db.query.student.findMany({
      where: and(...conditions as any),
      orderBy: [asc(schema.student.gradeLevel), asc(schema.student.lastName), asc(schema.student.firstName)],
    });
  }

  private mapStudentIdsByClass(classes: ClassAssignmentRow[], students: StudentRow[]): Map<string, string[]> {
    const map = new Map<string, string[]>();

    for (const sectionClass of classes) {
      const ids = students
        .filter(student => student.section === sectionClass.sectionName)
        .map(student => student.id);
      map.set(sectionClass.id, ids);
    }

    return map;
  }

  private studentName(student: StudentRow): string {
    return [student.firstName, student.middleName, student.lastName]
      .map(part => part?.trim())
      .filter(Boolean)
      .join(' ');
  }

  private toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private parseDate(value: string | undefined, message: string): Date {
    const text = this.requireText(value, message);
    const date = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(message);
    }
    return date;
  }

  private requireText(value: string | undefined, message: string): string {
    const text = value?.trim();
    if (!text) {
      throw new BadRequestException(message);
    }
    return text;
  }

  private requireOneOf<T extends string>(value: T | undefined, allowed: readonly T[], message: string): T {
    if (!value || !allowed.includes(value)) {
      throw new BadRequestException(message);
    }
    return value;
  }

  private requireWeekday(value: string | undefined): Weekday {
    return this.requireOneOf(
      value as Weekday | undefined,
      Object.keys(WEEKDAY_SORT) as Weekday[],
      'Schedule day must be Monday to Friday.',
    );
  }

  private requireTime(value: string | undefined): string {
    const text = this.requireText(value, 'Schedule time is required.');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
      throw new BadRequestException('Schedule time must use HH:mm format.');
    }
    return text;
  }

  private nullableScore(value: number | null | undefined): number | null {
    if (value === null || value === undefined || value === '' as never) {
      return null;
    }
    const score = Number(value);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new BadRequestException('Grade scores must be between 0 and 100.');
    }
    return score;
  }

  async getStudentAcademicProfile(teacherUserId: string, studentId: string) {
    const student = await this.drizzle.db.query.student.findFirst({
      where: eq(schema.student.id, studentId),
      with: {
        academicRecords: true,
        studentCoreValues: true,
        studentHealthProfiles: true,
      }
    });

    if (!student) {
      throw new NotFoundException('Student not found.');
    }

    const attendance = await this.drizzle.db.query.teacherAttendanceRecord.findMany({
      where: eq(schema.teacherAttendanceRecord.studentId, studentId),
      orderBy: [asc(schema.teacherAttendanceRecord.date)]
    });

    const grades = await this.drizzle.db.query.teacherGradeRecord.findMany({
      where: eq(schema.teacherGradeRecord.studentId, studentId),
      orderBy: [asc(schema.teacherGradeRecord.quarter)]
    });

    return {
      student: {
        ...student,
        coreValues: student.studentCoreValues,
        healthProfiles: student.studentHealthProfiles,
      },
      attendance,
      grades
    };
  }

  private assertOwnedDelete(count: number) {
    if (count < 1) {
      throw new ForbiddenException('Record not found for this teacher.');
    }
  }
}
