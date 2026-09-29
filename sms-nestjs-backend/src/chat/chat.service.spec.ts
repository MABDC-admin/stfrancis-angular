import { BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { createDrizzleMock } from '../test/drizzle-mock';
import * as schema from '../drizzle/schema';

type MockGateway = {
  notifyUser: jest.Mock;
  notifyStaff: jest.Mock;
};

describe('ChatService', () => {
  const staffUser = { userId: 'user-1', email: 'teacher1@sfxsai.com', role: 'TEACHER' };
  const studentUser = { userId: 'student-1', email: 'student1@sfxsai.com', role: 'STUDENT' };

  function createService(overrides: {
    query?: ReturnType<typeof createDrizzleMock>['query'];
    onDbInit?: (db: ReturnType<typeof createDrizzleMock>) => void;
  } = {}) {
    const db = createDrizzleMock({
      query: {
        user: {
          findMany: jest.fn(),
          findFirst: jest.fn(),
        },
        teacherClassAssignment: {
          findMany: jest.fn(),
        },
        chatConversation: {
          findFirst: jest.fn(),
        },
        ...overrides.query,
      },
    });

    overrides.onDbInit?.(db);

    const gateway: MockGateway = {
      notifyUser: jest.fn(),
      notifyStaff: jest.fn(),
    };

    return {
      db,
      gateway,
      service: new ChatService({ db } as never, gateway as never),
    };
  }

  it('filters inactive staff contacts out and computes unread counts per contact', async () => {
    const { db, service } = createService({
      onDbInit: (drizzleDb) => {
        const { query, __queue } = drizzleDb;
        (query.user.findMany as jest.Mock).mockResolvedValue([
          {
            id: 'staff-1',
            email: 'admin@sfxsai.com',
            role: 'ADMIN',
            teacherProfiles: [{ name: 'Admin One', assignedGradeLevel: 'G1', accountStatus: 'Active' }],
          },
          {
            id: 'staff-2',
            email: 'inactive@sfxsai.com',
            role: 'TEACHER',
            teacherProfiles: [{ name: 'Teacher Two', assignedGradeLevel: 'G2', accountStatus: 'Inactive' }],
          },
        ]);

        __queue.pushMany('select', [
          [{ id: 'conv-admin' }],
          [{ count: 2 }],
        ]);
      },
    });

    const contacts = await service.getStaffContacts(staffUser);

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toEqual(
      expect.objectContaining({
        id: 'staff-1',
        displayName: 'Admin One',
        unreadCount: 2,
      }),
    );
  });

  it('returns an empty contact list for students without an assigned section', async () => {
    const { db, service } = createService({
      onDbInit: (drizzleDb) => {
        const { query } = drizzleDb;
        (query.user.findFirst as jest.Mock).mockResolvedValue({
          id: 'student-1',
          student: null,
        });
      },
    });

    const contacts = await service.getStaffContacts(studentUser);

    expect(contacts).toEqual([]);
    expect((db.query.teacherClassAssignment.findMany as jest.Mock)).not.toHaveBeenCalled();
  });

  it('creates a trimmed user message and notifies staff on support conversations', async () => {
    const { db, gateway, service } = createService({
      onDbInit: (drizzleDb) => {
        const { query, __queue } = drizzleDb;
        (query.chatConversation.findFirst as jest.Mock).mockResolvedValue({
          id: 'conv-support',
          subject: 'SFXSAI Support Chat',
          ownerUserId: 'user-1',
          status: 'OPEN',
        });
        __queue.push('insert', {
          id: 'msg-1',
          body: 'Need help with billing.',
          senderUserId: 'user-1',
          senderName: 'teacher1@sfxsai.com',
          senderRole: 'TEACHER',
          source: 'USER',
        });
        __queue.push('update', {
          id: 'conv-support',
          status: 'OPEN',
        });
      },
    });

    const result = await service.sendMessage(staffUser, { body: '  Need help with billing.  ' });

    expect(result.body).toBe('Need help with billing.');
    expect(gateway.notifyUser).toHaveBeenCalledWith('user-1');
    expect(gateway.notifyStaff).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledWith(schema.chatMessage);
  });

  it('notifies recipient users when sending direct messages', async () => {
    const { db, gateway, service } = createService({
      onDbInit: (drizzleDb) => {
        const { query, __queue } = drizzleDb;
        (query.user.findFirst as jest.Mock).mockResolvedValue({
          id: 'staff-1',
          role: 'TEACHER',
          teacherProfiles: [{ name: 'Teacher One', accountStatus: 'Active' }],
        });
        (query.chatConversation.findFirst as jest.Mock).mockResolvedValue(null);
        __queue.push('insert', {
          id: 'conv-direct',
          subject: 'DIRECT:user-1:user-2',
          ownerUserId: 'user-1',
          status: 'OPEN',
        });
        __queue.push('insert', {
          id: 'msg-1',
          body: 'Hi teacher, question.',
          senderUserId: 'user-1',
          senderName: 'teacher1@sfxsai.com',
          senderRole: 'TEACHER',
          source: 'USER',
        });
        __queue.push('update', {
          id: 'conv-direct',
          status: 'OPEN',
        });
      },
    });

    await service.sendMessage(staffUser, { body: 'Hi teacher, question.', recipientUserId: 'user-2' });

    expect(gateway.notifyUser).toHaveBeenCalledWith('user-2');
    expect(gateway.notifyStaff).not.toHaveBeenCalled();
    expect(db.query.user.findFirst).toHaveBeenCalledWith({
      where: expect.any(Object),
      with: { teacherProfiles: true },
    });
    expect(db.insert).toHaveBeenCalledWith(schema.chatConversation);
  });

  it('rejects blank message payloads', async () => {
    const { service } = createService();

    await expect(
      service.sendMessage(staffUser, { body: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
