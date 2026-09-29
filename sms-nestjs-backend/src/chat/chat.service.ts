import { BadRequestException, Injectable, Inject, forwardRef } from '@nestjs/common';
import * as crypto from 'crypto';
import { and, asc, count, desc, eq, inArray, isNull, like, ne, or } from 'drizzle-orm';
import { DrizzleService } from '../drizzle/drizzle.service';
import * as schema from '../drizzle/schema';
import { ChatGateway } from './chat.gateway';

export interface ChatUser {
  userId: string;
  email: string;
  role: string;
}

export interface SendChatMessageDto {
  body: string;
  recipientUserId?: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly drizzle: DrizzleService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async getStaffContacts(user: ChatUser) {
    if (this.isStaffChatRole(user.role)) {
      const contacts = await this.drizzle.db.query.user.findMany({
        where: and(
          ne(schema.user.id, user.userId),
          inArray(schema.user.role, ['ADMIN', 'FINANCE', 'REGISTRAR', 'PRINCIPAL', 'TEACHER']),
        ),
        with: { teacherProfiles: true },
        orderBy: [asc(schema.user.role), asc(schema.user.email)],
      });

      const activeContacts = contacts.filter((contact) => {
        const profile = contact.teacherProfiles?.[0];
        return !profile || profile.accountStatus !== 'Inactive';
      });

      return Promise.all(
        activeContacts.map(async contact => {
          const profile = contact.teacherProfiles?.[0];
          return {
            id: contact.id,
            email: contact.email,
            role: contact.role,
            displayName: profile?.name || contact.email,
            assignedGradeLevel: profile?.assignedGradeLevel || '',
            advisoryClass: profile?.advisoryClass || '',
            accountStatus: profile?.accountStatus || 'Active',
            unreadCount: await this.countUnreadDirectMessagesFrom(user.userId, contact.id),
          };
        }),
      );
    }

    if (user.role === 'STUDENT') {
      const studentUser = await this.drizzle.db.query.user.findFirst({
        where: eq(schema.user.id, user.userId),
        with: { student: true },
      });
      if (!studentUser?.student?.section) {
        return [];
      }

      const teacherAssignments = await this.drizzle.db.query.teacherClassAssignment.findMany({
        where: eq(schema.teacherClassAssignment.sectionName, studentUser.student.section),
        columns: { teacherUserId: true },
      });

      const teacherUserIds = [...new Set(teacherAssignments.map((record) => record.teacherUserId))];
      if (!teacherUserIds.length) {
        return [];
      }

      const contacts = await this.drizzle.db.query.user.findMany({
        where: and(
          inArray(schema.user.id, teacherUserIds),
          eq(schema.user.role, 'TEACHER'),
        ),
        with: { teacherProfiles: true },
        orderBy: [asc(schema.user.email)],
      });

      const activeContacts = contacts.filter((contact) => {
        const profile = contact.teacherProfiles?.[0];
        return !profile || profile.accountStatus !== 'Inactive';
      });

      return Promise.all(
        activeContacts.map(async contact => {
          const profile = contact.teacherProfiles?.[0];
          return {
            id: contact.id,
            email: contact.email,
            role: contact.role,
            displayName: profile?.name || contact.email,
            assignedGradeLevel: profile?.assignedGradeLevel || '',
            advisoryClass: profile?.advisoryClass || '',
            accountStatus: profile?.accountStatus || 'Active',
            unreadCount: await this.countUnreadDirectMessagesFrom(user.userId, contact.id),
          };
        }),
      );
    }

    return [];
  }

  async getMyConversation(user: ChatUser) {
    const conversation = await this.findOpenConversationByOwner(user.userId);
    if (conversation) {
      return conversation;
    }

    return this.createSupportConversation(user.userId);
  }

  async getUnreadCount(user: ChatUser) {
    const conversationIds = await this.getVisibleConversationIds(user.userId);
    if (!conversationIds.length) {
      return { unreadCount: 0 };
    }

    const [{ count: unreadCount }] = await this.drizzle.db
      .select({ count: count(schema.chatMessage.id) })
      .from(schema.chatMessage)
      .where(
        and(
          inArray(schema.chatMessage.conversationId, conversationIds),
          isNull(schema.chatMessage.readAt),
          or(
            ne(schema.chatMessage.senderUserId, user.userId),
            isNull(schema.chatMessage.senderUserId),
          ),
        ),
      );

    return { unreadCount: this.toNumber(unreadCount) };
  }

  async markConversationRead(user: ChatUser, conversationId: string) {
    const visibleConversationIds = await this.getVisibleConversationIds(user.userId);
    if (!visibleConversationIds.includes(conversationId)) {
      return { updatedCount: 0 };
    }

    const updated = await this.drizzle.db
      .update(schema.chatMessage)
      .set({ readAt: new Date().toISOString() })
      .where(
        and(
          eq(schema.chatMessage.conversationId, conversationId),
          isNull(schema.chatMessage.readAt),
          or(
            ne(schema.chatMessage.senderUserId, user.userId),
            isNull(schema.chatMessage.senderUserId),
          ),
        ),
      )
      .returning();

    this.chatGateway.notifyUser(user.userId);
    return { updatedCount: updated.length };
  }

  async sendTestMessageToAllUsers(user: ChatUser) {
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Only admin accounts can send test messages to all users.');
    }

    const users = await this.drizzle.db.query.user.findMany({
      columns: {
        id: true,
        email: true,
        role: true,
      },
      orderBy: [asc(schema.user.email)],
    });

    let messageCount = 0;
    for (const recipient of users) {
      const conversation = await this.findOrCreateSupportConversation(recipient.id);
      if (!conversation) {
        throw new BadRequestException('Conversation could not be created.');
      }
      const now = new Date().toISOString();
      await this.drizzle.db.insert(schema.chatMessage).values({
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        senderUserId: null,
        senderName: 'SFXSAI Broadcast',
        senderRole: 'System',
        body: 'test',
        source: 'SYSTEM',
        createdAt: now,
      });
      messageCount += 1;
    }

    return { body: 'test', recipientCount: users.length, messageCount };
  }

  async getConversationWithRecipient(user: ChatUser, recipientUserId: string) {
    const recipient = await this.resolveStaffRecipient(user, recipientUserId);
    const subject = this.directSubject(user.userId, recipient.id);

    const conversation = await this.findOpenConversationBySubject(subject);
    if (conversation) {
      return conversation;
    }

    return this.createDirectConversation(subject, user.userId, recipient.id);
  }

  async sendMessage(user: ChatUser, dto: SendChatMessageDto) {
    const body = dto.body?.trim();
    if (!body) {
      throw new BadRequestException('Message body is required.');
    }

    const conversation = dto.recipientUserId
      ? await this.getConversationWithRecipient(user, dto.recipientUserId)
      : await this.getMyConversation(user);
    if (!conversation) {
      throw new BadRequestException('Conversation could not be created.');
    }
    const now = new Date().toISOString();

    const [message] = await this.drizzle.db
      .insert(schema.chatMessage)
      .values({
        id: crypto.randomUUID(),
        conversationId: conversation.id,
        senderUserId: user.userId,
        senderName: user.email,
        senderRole: user.role,
        body,
        source: 'USER',
        createdAt: now,
      })
      .returning();

    await this.drizzle.db
      .update(schema.chatConversation)
      .set({ status: 'OPEN', updatedAt: new Date().toISOString() })
      .where(eq(schema.chatConversation.id, conversation.id));

    this.chatGateway.notifyUser(user.userId);

    let otherParticipantId: string | undefined;
    if (conversation.subject.startsWith('DIRECT:')) {
      const parts = conversation.subject.replace('DIRECT:', '').split(':');
      otherParticipantId = parts.find((id) => id !== user.userId);
    }

    if (otherParticipantId) {
      this.chatGateway.notifyUser(otherParticipantId);
    } else if (dto.recipientUserId) {
      this.chatGateway.notifyUser(dto.recipientUserId);
    } else {
      this.chatGateway.notifyStaff();
    }

    return message;
  }

  private async getVisibleConversationIds(userId: string) {
    const rows = await this.drizzle.db
      .select({ id: schema.chatConversation.id })
      .from(schema.chatConversation)
      .where(
        and(
          eq(schema.chatConversation.status, 'OPEN'),
          or(
            eq(schema.chatConversation.ownerUserId, userId),
            like(schema.chatConversation.subject, `%${userId}%`),
          ),
        ),
      );

    return rows.map((row) => row.id);
  }

  private async findOpenConversationByOwner(ownerUserId: string) {
    const conversation = await this.drizzle.db.query.chatConversation.findFirst({
      where: and(
        eq(schema.chatConversation.ownerUserId, ownerUserId),
        eq(schema.chatConversation.status, 'OPEN'),
      ),
      with: {
        chatMessages: {
          orderBy: [asc(schema.chatMessage.createdAt)],
          limit: 80,
        },
      },
      orderBy: [desc(schema.chatConversation.updatedAt)],
    });
    return this.toPublicConversation(conversation);
  }

  private async findOpenConversationBySubject(subject: string) {
    const conversation = await this.drizzle.db.query.chatConversation.findFirst({
      where: and(
        eq(schema.chatConversation.subject, subject),
        eq(schema.chatConversation.status, 'OPEN'),
      ),
      with: {
        chatMessages: {
          orderBy: [asc(schema.chatMessage.createdAt)],
          limit: 80,
        },
      },
      orderBy: [desc(schema.chatConversation.updatedAt)],
    });
    return this.toPublicConversation(conversation);
  }

  private async createSupportConversation(ownerUserId: string) {
    const now = new Date().toISOString();
    const [created] = await this.drizzle.db
      .insert(schema.chatConversation)
      .values({
        id: crypto.randomUUID(),
        ownerUserId,
        subject: 'SFXSAI Support Chat',
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return this.toPublicConversation({ ...created, chatMessages: [] });
  }

  private async createDirectConversation(subject: string, leftUserId: string, rightUserId: string) {
    const now = new Date().toISOString();
    const ownerUserId = this.conversationOwnerUserId(leftUserId, rightUserId);
    const [created] = await this.drizzle.db
      .insert(schema.chatConversation)
      .values({
        id: crypto.randomUUID(),
        ownerUserId,
        subject,
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return this.toPublicConversation({ ...created, chatMessages: [] });
  }

  private async findOrCreateSupportConversation(ownerUserId: string) {
    const conversation = await this.findOpenConversationByOwner(ownerUserId);
    if (conversation) {
      return conversation;
    }
    return this.createSupportConversation(ownerUserId);
  }

  private async countUnreadDirectMessagesFrom(userId: string, senderUserId: string) {
    const subject = this.directSubject(userId, senderUserId);
    const rows = await this.drizzle.db
      .select({ id: schema.chatConversation.id })
      .from(schema.chatConversation)
      .where(and(eq(schema.chatConversation.subject, subject), eq(schema.chatConversation.status, 'OPEN')));
    if (!rows.length) {
      return 0;
    }

    const [{ count: unreadCount }] = await this.drizzle.db
      .select({ count: count(schema.chatMessage.id) })
      .from(schema.chatMessage)
      .where(
        and(
          eq(schema.chatMessage.senderUserId, senderUserId),
          isNull(schema.chatMessage.readAt),
          inArray(
            schema.chatMessage.conversationId,
            rows.map((row) => row.id),
          ),
        ),
      );

    return this.toNumber(unreadCount);
  }

  private async resolveStaffRecipient(user: ChatUser, recipientUserId: string) {
    if (!recipientUserId || recipientUserId === user.userId) {
      throw new BadRequestException('Select another account to chat with.');
    }

    const recipient = await this.drizzle.db.query.user.findFirst({
      where: eq(schema.user.id, recipientUserId),
      with: { teacherProfiles: true },
    });
    if (!recipient) {
      throw new BadRequestException('Recipient not found.');
    }

    if (this.isStaffChatRole(user.role)) {
      // Staff can message everyone in this context.
    } else if (user.role === 'STUDENT') {
      const studentUser = await this.drizzle.db.query.user.findFirst({
        where: eq(schema.user.id, user.userId),
        with: { student: true },
      });
      if (!studentUser?.student?.section) {
        throw new BadRequestException('You are not assigned to any section, so you cannot message teachers.');
      }

      const assignments = await this.drizzle.db.query.teacherClassAssignment.findMany({
        where: and(
          eq(schema.teacherClassAssignment.sectionName, studentUser.student.section),
          eq(schema.teacherClassAssignment.teacherUserId, recipientUserId),
        ),
      });

      if (!assignments.length) {
        throw new BadRequestException('You are only allowed to message your assigned teachers.');
      }
    } else {
      throw new BadRequestException('Your role is not allowed to use the chat system.');
    }

    const profile = recipient.teacherProfiles?.[0];
    if (recipient.role === 'TEACHER' && profile?.accountStatus === 'Inactive') {
      throw new BadRequestException('Selected teacher account is inactive.');
    }

    return recipient;
  }

  private isStaffChatRole(role: string): boolean {
    return ['ADMIN', 'FINANCE', 'REGISTRAR', 'PRINCIPAL', 'TEACHER'].includes(role);
  }

  private directSubject(leftUserId: string, rightUserId: string): string {
    return `DIRECT:${this.sortedParticipantIds(leftUserId, rightUserId).join(':')}`;
  }

  private conversationOwnerUserId(leftUserId: string, rightUserId: string): string {
    return this.sortedParticipantIds(leftUserId, rightUserId)[0];
  }

  private sortedParticipantIds(leftUserId: string, rightUserId: string): string[] {
    return [leftUserId, rightUserId].sort((left, right) => left.localeCompare(right));
  }

  private toPublicConversation(row: (typeof schema.chatConversation.$inferSelect & { chatMessages?: unknown[] | null }) | undefined | null) {
    if (!row) {
      return row;
    }
    return {
      ...row,
      messages: row.chatMessages ?? [],
    };
  }

  private toNumber(input: number | string | bigint | null | undefined) {
    if (typeof input === 'number') return input;
    if (typeof input === 'bigint') return Number(input);
    return Number(input || 0);
  }
}
