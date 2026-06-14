import { BadRequestException } from '@nestjs/common';
import { ChatService } from './chat.service';

type MockFn = jest.Mock;

describe('ChatService persisted conversations', () => {
  function createPrisma(overrides: Record<string, unknown> = {}) {
    return {
      chatConversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      chatMessage: {
        create: jest.fn(),
      },
      ...overrides,
    };
  }

  function service(prisma: Record<string, unknown>) {
    return new ChatService(prisma as never);
  }

  it('creates a default support conversation for the signed-in user', async () => {
    const prisma = createPrisma();
    (prisma.chatConversation.findFirst as MockFn).mockResolvedValue(null);
    (prisma.chatConversation.create as MockFn).mockResolvedValue({
      id: 'chat-1',
      ownerUserId: 'user-1',
      status: 'OPEN',
      messages: [],
    });

    const result = await service(prisma).getMyConversation({
      userId: 'user-1',
      email: 'teacher1@sfxsai.com',
      role: 'TEACHER',
    });

    expect(result.id).toBe('chat-1');
    expect(prisma.chatConversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ownerUserId: 'user-1',
          subject: 'SFXSAI Support Chat',
          status: 'OPEN',
        }),
      }),
    );
  });

  it('stores a trimmed message with the authenticated sender metadata', async () => {
    const prisma = createPrisma();
    (prisma.chatConversation.findFirst as MockFn).mockResolvedValue({
      id: 'chat-1',
      ownerUserId: 'user-1',
      status: 'OPEN',
    });
    (prisma.chatMessage.create as MockFn).mockResolvedValue({
      id: 'msg-1',
      body: 'Need help with assessment.',
      senderUserId: 'user-1',
      senderName: 'teacher1@sfxsai.com',
      senderRole: 'TEACHER',
      source: 'USER',
    });
    (prisma.chatConversation.update as MockFn).mockResolvedValue({
      id: 'chat-1',
    });

    const result = await service(prisma).sendMessage(
      {
        userId: 'user-1',
        email: 'teacher1@sfxsai.com',
        role: 'TEACHER',
      },
      { body: '  Need help with assessment.  ' },
    );

    expect(result.body).toBe('Need help with assessment.');
    expect(prisma.chatMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        conversationId: 'chat-1',
        senderUserId: 'user-1',
        senderName: 'teacher1@sfxsai.com',
        senderRole: 'TEACHER',
        body: 'Need help with assessment.',
        source: 'USER',
      }),
    });
  });

  it('rejects blank messages', async () => {
    const prisma = createPrisma();

    await expect(
      service(prisma).sendMessage(
        { userId: 'user-1', email: 'teacher1@sfxsai.com', role: 'TEACHER' },
        { body: '   ' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists a support acknowledgement after a user message', async () => {
    const prisma = createPrisma();
    (prisma.chatConversation.findFirst as MockFn).mockResolvedValue({
      id: 'chat-1',
      ownerUserId: 'user-1',
      status: 'OPEN',
    });
    (prisma.chatMessage.create as MockFn)
      .mockResolvedValueOnce({
        id: 'msg-1',
        body: 'Need help with billing.',
        source: 'USER',
      })
      .mockResolvedValueOnce({
        id: 'msg-2',
        body: 'Finance support received this.',
        source: 'SUPPORT',
      });
    (prisma.chatConversation.update as MockFn).mockResolvedValue({
      id: 'chat-1',
    });

    await service(prisma).sendMessage(
      { userId: 'user-1', email: 'ivyann@sfxsai.com', role: 'FINANCE' },
      { body: 'Need help with billing.' },
    );

    expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);
    expect(prisma.chatMessage.create).toHaveBeenLastCalledWith({
      data: expect.objectContaining({
        conversationId: 'chat-1',
        senderName: 'SFXSAI Support',
        senderRole: 'Online',
        source: 'SUPPORT',
      }),
    });
  });
});
