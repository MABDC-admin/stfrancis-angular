import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { TeacherService } from './teacher.service';

type MockFn = jest.Mock;

describe('TeacherService', () => {
  function createPrisma(overrides: Record<string, unknown> = {}) {
    return {
      withTransientRetry: jest.fn((operation: () => Promise<unknown>) => operation()),
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'teacher-user-1',
          email: 'teacher1@sfxsai.com',
        }),
      },
      teacherProfile: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      teacherClassAssignment: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      student: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      teacherAttendanceRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      teacherGradeRecord: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn(),
      },
      teacherResource: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      teacherLessonLog: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      teacherAnnouncement: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
      },
      teacherDirectMessage: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      teacherScheduleEntry: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      ...overrides,
    };
  }

  function service(prisma: Record<string, unknown>) {
    return new TeacherService(prisma as never);
  }

  it('builds a teacher-owned portal snapshot from assignments and roster records', async () => {
    const prisma = createPrisma();
    (prisma.teacherProfile as { findUnique: MockFn }).findUnique.mockResolvedValue({
      name: 'Teacher One',
      email: 'teacher1@sfxsai.com',
      department: 'Junior High',
      phone: '09170000000',
      advisoryClass: 'G7 - St. Clare',
    });
    (prisma.teacherClassAssignment as { findMany: MockFn }).findMany.mockResolvedValue([
      {
        id: 'class-1',
        sectionId: 'section-1',
        sectionName: 'St. Clare',
        subject: 'Mathematics',
        schedule: 'Mon 8:00 AM',
        room: 'Room 201',
      },
    ]);
    (prisma.student as { findMany: MockFn }).findMany.mockResolvedValue([
      {
        id: 'student-1',
        firstName: 'Juan',
        middleName: '',
        lastName: 'Dela Cruz',
        studentNo: 'SFX-001',
        gradeLevel: 'G7',
        section: 'St. Clare',
        gender: 'Female',
        guardian: 'Maria Dela Cruz',
        contactNo: '09990000000',
        photoUrl: '/storage/students/student-1/photo.jpg',
      },
    ]);

    const result = await service(prisma).getPortalState({
      userId: 'teacher-user-1',
      email: 'teacher1@sfxsai.com',
      role: 'TEACHER',
    });

    expect(result.teacher.name).toBe('Teacher One');
    expect(result.classes).toEqual([
      {
        id: 'class-1',
        section: 'St. Clare',
        subject: 'Mathematics',
        schedule: 'Mon 8:00 AM',
        room: 'Room 201',
        studentIds: ['student-1'],
      },
    ]);
    expect(result.students[0]).toEqual(
      expect.objectContaining({
        id: 'student-1',
        name: 'Juan Dela Cruz',
        studentNo: 'SFX-001',
        gradeLevel: 'G7',
        gender: 'Female',
        photoUrl: '/storage/students/student-1/photo.jpg',
      }),
    );
  });

  it('includes teacher-owned custom weekday schedule entries in the portal snapshot', async () => {
    const prisma = createPrisma();
    (prisma.teacherScheduleEntry as { findMany: MockFn }).findMany.mockResolvedValue([
      {
        id: 'slot-1',
        weekday: 'Monday',
        title: 'Homeroom Check-in',
        startTime: '07:30',
      },
    ]);

    const result = await service(prisma).getPortalState({
      userId: 'teacher-user-1',
      email: 'teacher1@sfxsai.com',
      role: 'TEACHER',
    });

    expect(result.scheduleEntries).toEqual([
      {
        id: 'slot-1',
        weekday: 'Monday',
        title: 'Homeroom Check-in',
        startTime: '07:30',
      },
    ]);
    expect((prisma.teacherScheduleEntry as { findMany: MockFn }).findMany).toHaveBeenCalledWith({
      where: { teacherUserId: 'teacher-user-1' },
      orderBy: [{ weekdaySort: 'asc' }, { startTime: 'asc' }, { title: 'asc' }],
    });
  });

  it('creates validated Monday to Friday schedule entries owned by the teacher', async () => {
    const prisma = createPrisma();
    (prisma.teacherScheduleEntry as { create: MockFn }).create.mockResolvedValue({
      id: 'slot-1',
      teacherUserId: 'teacher-user-1',
      weekday: 'Tuesday',
      weekdaySort: 2,
      title: 'Science Lab',
      startTime: '10:30',
    });

    await service(prisma).createScheduleEntry('teacher-user-1', {
      weekday: 'Tuesday',
      title: ' Science Lab ',
      startTime: '10:30',
    });

    expect((prisma.teacherScheduleEntry as { create: MockFn }).create).toHaveBeenCalledWith({
      data: {
        teacherUserId: 'teacher-user-1',
        weekday: 'Tuesday',
        weekdaySort: 2,
        title: 'Science Lab',
        startTime: '10:30',
      },
    });
  });

  it('rejects weekend or incomplete teacher schedule entries', async () => {
    const prisma = createPrisma();

    await expect(
      service(prisma).createScheduleEntry('teacher-user-1', {
        weekday: 'Saturday',
        title: 'Weekend Class',
        startTime: '09:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service(prisma).createScheduleEntry('teacher-user-1', {
        weekday: 'Monday',
        title: '',
        startTime: '09:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('wraps portal snapshot reads in transient database retry handling', async () => {
    const prisma = createPrisma();

    await service(prisma).getPortalState({
      userId: 'teacher-user-1',
      email: 'teacher1@sfxsai.com',
      role: 'TEACHER',
    });

    expect(prisma.withTransientRetry).toHaveBeenCalledTimes(1);
  });

  it('upserts attendance by teacher, class, student, and date', async () => {
    const prisma = createPrisma();
    (prisma.teacherAttendanceRecord as { upsert: MockFn }).upsert.mockResolvedValue({
      id: 'attendance-1',
      status: 'Absent',
      reason: 'Sick',
    });

    await service(prisma).markAttendance('teacher-user-1', {
      classId: 'class-1',
      studentId: 'student-1',
      date: '2026-06-15',
      status: 'Absent',
      reason: 'Sick',
    });

    expect((prisma.teacherAttendanceRecord as { upsert: MockFn }).upsert).toHaveBeenCalledWith({
      where: {
        teacherUserId_classId_studentId_date: {
          teacherUserId: 'teacher-user-1',
          classId: 'class-1',
          studentId: 'student-1',
          date: new Date('2026-06-15T00:00:00.000Z'),
        },
      },
      create: expect.objectContaining({
        teacherUserId: 'teacher-user-1',
        status: 'Absent',
        reason: 'Sick',
      }),
      update: { status: 'Absent', reason: 'Sick' },
    });
  });

  it('clears attendance reason when learner is present', async () => {
    const prisma = createPrisma();
    (prisma.teacherAttendanceRecord as { upsert: MockFn }).upsert.mockResolvedValue({
      id: 'attendance-2',
      status: 'Present',
      reason: '',
    });

    await service(prisma).markAttendance('teacher-user-1', {
      classId: 'class-1',
      studentId: 'student-1',
      date: '2026-06-15',
      status: 'Present',
      reason: 'Old reason',
    });

    expect((prisma.teacherAttendanceRecord as { upsert: MockFn }).upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: 'Present', reason: '' }),
        update: { status: 'Present', reason: '' },
      }),
    );
  });

  it('rejects incomplete resources and deletes only records owned by the teacher', async () => {
    const prisma = createPrisma();

    await expect(
      service(prisma).createResource('teacher-user-1', {
        classId: 'class-1',
        title: '',
        type: 'PDF',
        subject: 'Math',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    (prisma.teacherResource as { deleteMany: MockFn }).deleteMany.mockResolvedValue({ count: 0 });

    await expect(service(prisma).deleteResource('teacher-user-1', 'resource-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect((prisma.teacherResource as { deleteMany: MockFn }).deleteMany).toHaveBeenCalledWith({
      where: { id: 'resource-1', teacherUserId: 'teacher-user-1' },
    });
  });
});
