import * as bcrypt from 'bcrypt';
import { StudentsService } from './students.service';

interface PasswordWriteMock {
  mock: { calls: Array<[{ data: { password: string } }]> };
}

describe('StudentsService security behavior', () => {
  function createService(prisma: Record<string, unknown>) {
    return new StudentsService(prisma as never);
  }

  it('does not return password hashes when fetching a student profile', async () => {
    const prisma = {
      student: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          firstName: 'Juan',
          user: {
            id: 'user-1',
            email: 'juan@example.com',
            password: 'hashed-secret',
            role: 'STUDENT',
          },
        }),
      },
    };

    const result = await createService(prisma).findOne('student-1');

    expect(result?.user).toEqual({
      id: 'user-1',
      email: 'juan@example.com',
      role: 'STUDENT',
    });
    expect(result?.user).not.toHaveProperty('password');
  });

  it('hashes generated student account passwords before storing them', async () => {
    const prisma = {
      student: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'student-1',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          enrollmentStatus: 'Pending',
          user: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'student-1' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };

    await createService(prisma).update('student-1', {
      enrollmentStatus: 'Officially Enrolled',
    });

    const createUser = prisma.user.create as unknown as PasswordWriteMock;
    const storedPassword = createUser.mock.calls[0][0].data.password;
    expect(storedPassword).not.toBe('ChangeMe123!');
    await expect(bcrypt.compare('ChangeMe123!', storedPassword)).resolves.toBe(
      true,
    );
  });

  it('hashes reset passwords before storing them', async () => {
    const prisma = {
      user: {
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };

    await createService(prisma).resetPassword('student-1');

    const updateUser = prisma.user.update as unknown as PasswordWriteMock;
    const storedPassword = updateUser.mock.calls[0][0].data.password;
    expect(storedPassword).not.toBe('ChangeMe123!');
    await expect(bcrypt.compare('ChangeMe123!', storedPassword)).resolves.toBe(
      true,
    );
  });
});
