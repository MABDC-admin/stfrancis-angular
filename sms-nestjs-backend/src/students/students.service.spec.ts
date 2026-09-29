import { BadRequestException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { createDrizzleMock } from '../test/drizzle-mock';
import * as schema from '../drizzle/schema';

describe('StudentsService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createService() {
    const db = createDrizzleMock({
      query: {
        student: {
          findFirst: jest.fn(),
        },
        user: {
          findFirst: jest.fn(),
        },
      },
    });
    return {
      db,
      service: new StudentsService({ db } as never),
    };
  }

  it('does not return password hashes when reading a learner profile', async () => {
    const { db, service } = createService();
    (db.query.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      users: [
        {
          id: 'user-1',
          email: 'juan@example.com',
          password: 'hashed-secret',
          role: 'STUDENT',
        },
      ],
      studentFees: [],
      studentSiblings: [],
    });

    const result = await service.findOne('student-1');

    expect(result?.user).toEqual({
      id: 'user-1',
      email: 'juan@example.com',
      role: 'STUDENT',
    });
    expect(result?.user).not.toHaveProperty('password');
    expect(result?.fees).toEqual([]);
    expect(result?.siblings).toEqual([]);
  });

  it('creates a learner account when status changes to Officially Enrolled', async () => {
    const { db, service } = createService();
    (db.query.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      enrollmentStatus: 'Pending',
      users: [],
    });
    (db.query.user.findFirst as jest.Mock).mockResolvedValue(null);

    db.__queue.push('insert', {
      id: 'user-new',
      email: 'juandelacruz@sfxsai.com',
      role: 'STUDENT',
      studentId: 'student-1',
    });
    db.__queue.push('update', {
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      enrollmentStatus: 'Officially Enrolled',
    });

    const updated = await service.update('student-1', {
      enrollmentStatus: 'Officially Enrolled',
    });

    expect(updated.user).toBeUndefined();
    expect(db.query.user.findFirst).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalledWith(schema.user);
  });

  it('does not create a learner account when status remains non-official', async () => {
    const { db, service } = createService();
    (db.query.student.findFirst as jest.Mock).mockResolvedValue({
      id: 'student-1',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      enrollmentStatus: 'Pending',
      users: [],
    });
    db.__queue.push('update', {
      id: 'student-1',
      enrollmentStatus: 'Pending',
    });

    const updated = await service.update('student-1', {
      enrollmentStatus: 'Pending',
    });

    expect(updated.enrollmentStatus).toBe('Pending');
    expect(db.query.user.findFirst).not.toHaveBeenCalled();
  });

  it('requires a first name and last name before creating', async () => {
    const { service } = createService();

    await expect(service.create({ firstName: '', lastName: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('removes a student account with Drizzle delete returning rows', async () => {
    const { db, service } = createService();
    db.__queue.push('delete', {
      id: 'student-1',
      firstName: 'Juan',
    });

    const deleted = await service.remove('student-1');

    expect(deleted).toEqual([{ id: 'student-1', firstName: 'Juan' }]);
    expect(db.delete).toHaveBeenCalledWith(schema.student);
  });

  it('stores a student sibling row via insert', async () => {
    const { db, service } = createService();
    db.__queue.push('insert', {
      id: 'sibling-1',
      studentId: 'student-1',
      fullName: 'Ana Dela Cruz',
    });

    const created = await service.addStudentSibling('student-1', {
      fullName: 'Ana Dela Cruz',
      relation: 'Sister',
    });

    expect(created).toEqual([{
      id: 'sibling-1',
      studentId: 'student-1',
      fullName: 'Ana Dela Cruz',
    }]);
    expect(db.insert).toHaveBeenCalledWith(schema.studentSibling);
  });

  it('resets student credentials using a hashed password', async () => {
    const { db, service } = createService();
    (db.query.user.findFirst as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'juan@example.com',
      studentId: 'student-1',
    });

    db.__queue.push('update', {
      id: 'user-1',
      email: 'juan@example.com',
      role: 'STUDENT',
      studentId: 'student-1',
    });

    await service.resetPassword('student-1');

    expect(db.update).toHaveBeenCalledWith(schema.user);
  });
});
