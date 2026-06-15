import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

type StudentRow = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  studentNo: string;
  gradeLevel: string;
  section?: string | null;
  guardian?: string | null;
  contactNo?: string | null;
};

type ClassAssignmentRow = {
  id: string;
  sectionId?: string | null;
  sectionName: string;
  subject: string;
  schedule: string;
  room?: string | null;
};

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortalState(user: TeacherUser) {
    const teacherUserId = this.requireTeacherUserId(user);
    const account = await this.prisma.user.findUnique({
      where: { id: teacherUserId },
      select: { id: true, email: true },
    });

    if (!account) {
      throw new NotFoundException('Teacher account not found.');
    }

    const profile = await this.prisma.teacherProfile.findUnique({
      where: { teacherUserId },
    });
    const classes = await this.prisma.teacherClassAssignment.findMany({
      where: { teacherUserId },
      orderBy: [{ sectionName: 'asc' }, { subject: 'asc' }],
    });
    const students = await this.loadAssignedStudents(classes);
    const studentIdsByClass = this.mapStudentIdsByClass(classes, students);

    const [attendance, grades, resources, dlls, announcements, messages] = await Promise.all([
      this.prisma.teacherAttendanceRecord.findMany({
        where: { teacherUserId },
        orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.teacherGradeRecord.findMany({
        where: { teacherUserId },
        orderBy: [{ classId: 'asc' }, { studentId: 'asc' }, { quarter: 'asc' }],
      }),
      this.prisma.teacherResource.findMany({
        where: { teacherUserId },
        orderBy: { uploadedAt: 'desc' },
      }),
      this.prisma.teacherLessonLog.findMany({
        where: { teacherUserId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.teacherAnnouncement.findMany({
        where: { teacherUserId },
        orderBy: { postedAt: 'desc' },
      }),
      this.prisma.teacherDirectMessage.findMany({
        where: { teacherUserId },
        orderBy: { sentAt: 'desc' },
      }),
    ]);

    return {
      teacher: {
        name: profile?.name ?? account.email ?? user.email ?? 'Teacher',
        email: profile?.email ?? account.email ?? user.email ?? '',
        department: profile?.department ?? '',
        phone: profile?.phone ?? '',
        advisoryClass: profile?.advisoryClass ?? 'No advisory class assigned',
      },
      classes: classes.map(item => ({
        id: item.id,
        section: item.sectionName,
        subject: item.subject,
        schedule: item.schedule,
        room: item.room ?? '',
        studentIds: studentIdsByClass.get(item.id) ?? [],
      })),
      students: students.map(student => ({
        id: student.id,
        name: this.studentName(student),
        studentNo: student.studentNo,
        gradeLevel: student.gradeLevel,
        guardian: student.guardian ?? '',
        contact: student.contactNo ?? '',
      })),
      attendance: attendance.map(record => ({
        id: record.id,
        classId: record.classId,
        studentId: record.studentId,
        date: this.toDateOnly(record.date),
        status: record.status,
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
        uploadedAt: this.toDateOnly(record.uploadedAt),
      })),
      dlls: dlls.map(record => ({
        id: record.id,
        classId: record.classId,
        date: this.toDateOnly(record.date),
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
        postedAt: this.toDateOnly(record.postedAt),
      })),
      messages: messages.map(record => ({
        id: record.id,
        thread: record.thread,
        sender: record.sender,
        audience: record.audience,
        message: record.message,
        sentAt: record.sentAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      })),
    };
  }

  async updateProfile(teacherUserId: string, profile: {
    name?: string;
    email?: string;
    department?: string;
    phone?: string;
    advisoryClass?: string;
  }) {
    const name = this.requireText(profile.name, 'Teacher name is required.');
    const email = this.requireText(profile.email, 'Teacher email is required.');

    return this.prisma.teacherProfile.upsert({
      where: { teacherUserId },
      create: {
        teacherUserId,
        name,
        email,
        department: profile.department?.trim() ?? '',
        phone: profile.phone?.trim() ?? '',
        advisoryClass: profile.advisoryClass?.trim() ?? '',
      },
      update: {
        name,
        email,
        department: profile.department?.trim() ?? '',
        phone: profile.phone?.trim() ?? '',
        advisoryClass: profile.advisoryClass?.trim() ?? '',
      },
    });
  }

  async markAttendance(teacherUserId: string, body: {
    classId?: string;
    studentId?: string;
    date?: string;
    status?: AttendanceStatus;
  }) {
    const classId = this.requireText(body.classId, 'Class is required.');
    const studentId = this.requireText(body.studentId, 'Student is required.');
    const date = this.parseDate(body.date, 'Attendance date is required.');
    const status = this.requireOneOf(body.status, ['Present', 'Absent', 'Late', 'Excused'], 'Attendance status is invalid.');

    return this.prisma.teacherAttendanceRecord.upsert({
      where: {
        teacherUserId_classId_studentId_date: {
          teacherUserId,
          classId,
          studentId,
          date,
        },
      },
      create: {
        teacherUserId,
        classId,
        studentId,
        date,
        status,
      },
      update: { status },
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
    };

    return this.prisma.teacherGradeRecord.upsert({
      where: {
        teacherUserId_classId_studentId_quarter: {
          teacherUserId,
          classId,
          studentId,
          quarter,
        },
      },
      create: {
        teacherUserId,
        classId,
        studentId,
        quarter,
        ...data,
      },
      update: data,
    });
  }

  async createResource(teacherUserId: string, body: {
    classId?: string;
    title?: string;
    type?: ResourceType;
    subject?: string;
    size?: string;
  }) {
    const data = {
      teacherUserId,
      classId: this.requireText(body.classId, 'Class is required.'),
      title: this.requireText(body.title, 'Resource title is required.'),
      type: this.requireOneOf(body.type, ['PDF', 'Video', 'Document', 'Link'], 'Resource type is invalid.'),
      subject: this.requireText(body.subject, 'Subject is required.'),
      size: body.size?.trim() || 'Pending upload',
    };

    return this.prisma.teacherResource.create({ data });
  }

  async updateResource(teacherUserId: string, id: string, body: {
    title?: string;
    type?: ResourceType;
    subject?: string;
    size?: string;
  }) {
    const result = await this.prisma.teacherResource.updateMany({
      where: { id, teacherUserId },
      data: {
        title: body.title?.trim(),
        type: body.type,
        subject: body.subject?.trim(),
        size: body.size?.trim(),
      },
    });
    this.assertOwnedDelete(result.count);
    return { updated: true };
  }

  async deleteResource(teacherUserId: string, id: string) {
    const result = await this.prisma.teacherResource.deleteMany({
      where: { id, teacherUserId },
    });
    this.assertOwnedDelete(result.count);
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
    return this.prisma.teacherLessonLog.create({
      data: {
        teacherUserId,
        classId: this.requireText(body.classId, 'Class is required.'),
        date: this.parseDate(body.date, 'Lesson date is required.'),
        objectives: this.requireText(body.objectives, 'Learning objectives are required.'),
        activities: this.requireText(body.activities, 'Activities are required.'),
        materials: this.requireText(body.materials, 'Materials are required.'),
        remarks: body.remarks?.trim() ?? '',
      },
    });
  }

  async updateLessonLog(teacherUserId: string, id: string, body: {
    date?: string;
    objectives?: string;
    activities?: string;
    materials?: string;
    remarks?: string;
  }) {
    const result = await this.prisma.teacherLessonLog.updateMany({
      where: { id, teacherUserId },
      data: {
        date: body.date ? this.parseDate(body.date, 'Lesson date is required.') : undefined,
        objectives: body.objectives?.trim(),
        activities: body.activities?.trim(),
        materials: body.materials?.trim(),
        remarks: body.remarks?.trim(),
      },
    });
    this.assertOwnedDelete(result.count);
    return { updated: true };
  }

  async deleteLessonLog(teacherUserId: string, id: string) {
    const result = await this.prisma.teacherLessonLog.deleteMany({
      where: { id, teacherUserId },
    });
    this.assertOwnedDelete(result.count);
    return { deleted: true };
  }

  async createAnnouncement(teacherUserId: string, body: {
    audience?: string;
    title?: string;
    body?: string;
  }) {
    return this.prisma.teacherAnnouncement.create({
      data: {
        teacherUserId,
        audience: this.requireText(body.audience, 'Audience is required.'),
        title: this.requireText(body.title, 'Announcement title is required.'),
        body: this.requireText(body.body, 'Announcement body is required.'),
      },
    });
  }

  async updateAnnouncement(teacherUserId: string, id: string, body: {
    audience?: string;
    title?: string;
    body?: string;
  }) {
    const result = await this.prisma.teacherAnnouncement.updateMany({
      where: { id, teacherUserId },
      data: {
        audience: body.audience?.trim(),
        title: body.title?.trim(),
        body: body.body?.trim(),
      },
    });
    this.assertOwnedDelete(result.count);
    return { updated: true };
  }

  async deleteAnnouncement(teacherUserId: string, id: string) {
    const result = await this.prisma.teacherAnnouncement.deleteMany({
      where: { id, teacherUserId },
    });
    this.assertOwnedDelete(result.count);
    return { deleted: true };
  }

  async sendMessage(teacherUserId: string, body: {
    thread?: string;
    audience?: 'Student' | 'Parent' | 'Admin';
    message?: string;
  }) {
    return this.prisma.teacherDirectMessage.create({
      data: {
        teacherUserId,
        thread: this.requireText(body.thread, 'Thread is required.'),
        sender: 'You',
        audience: this.requireOneOf(body.audience, ['Student', 'Parent', 'Admin'], 'Message audience is invalid.'),
        message: this.requireText(body.message, 'Message is required.'),
      },
    });
  }

  requireTeacherUserId(user: TeacherUser): string {
    const id = user.sub ?? user.userId ?? user.id;
    if (!id) {
      throw new ForbiddenException('Teacher account is required.');
    }
    return id;
  }

  private async loadAssignedStudents(classes: ClassAssignmentRow[]): Promise<StudentRow[]> {
    if (!classes.length) {
      return [];
    }

    const sections = Array.from(new Set(classes.map(item => item.sectionName).filter(Boolean)));

    return this.prisma.student.findMany({
      where: { section: { in: sections } },
      orderBy: [{ gradeLevel: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    }) as Promise<StudentRow[]>;
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

  private assertOwnedDelete(count: number) {
    if (count < 1) {
      throw new ForbiddenException('Record not found for this teacher.');
    }
  }
}
