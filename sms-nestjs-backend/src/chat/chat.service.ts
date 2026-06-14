import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatUser {
  userId: string;
  email: string;
  role: string;
}

export interface SendChatMessageDto {
  body: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyConversation(user: ChatUser) {
    const conversation = await this.findOpenConversation(user.userId);

    if (conversation) {
      return conversation;
    }

    return this.prisma.chatConversation.create({
      data: {
        ownerUserId: user.userId,
        subject: 'SFXSAI Support Chat',
        status: 'OPEN',
      },
      include: this.conversationInclude(),
    });
  }

  async sendMessage(user: ChatUser, dto: SendChatMessageDto) {
    const body = dto.body?.trim();

    if (!body) {
      throw new BadRequestException('Message body is required.');
    }

    const conversation = await this.getMyConversation(user);
    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderUserId: user.userId,
        senderName: user.email,
        senderRole: user.role,
        body,
        source: 'USER',
      },
    });

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderName: 'SFXSAI Support',
        senderRole: 'Online',
        body: this.buildSupportAcknowledgement(body),
        source: 'SUPPORT',
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { status: 'OPEN' },
    });

    return message;
  }

  private findOpenConversation(ownerUserId: string) {
    return this.prisma.chatConversation.findFirst({
      where: {
        ownerUserId,
        status: 'OPEN',
      },
      include: this.conversationInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  private conversationInclude() {
    return {
      messages: {
        orderBy: { createdAt: 'asc' as const },
        take: 80,
      },
    };
  }

  private buildSupportAcknowledgement(body: string): string {
    const lowered = body.toLowerCase();

    if (lowered.includes('payment') || lowered.includes('billing') || lowered.includes('finance')) {
      return 'Finance support received this. Please include the learner name or receipt number so it can be checked against the current school year.';
    }

    if (lowered.includes('enroll') || lowered.includes('registrar')) {
      return 'Registrar support received this. Please include the learner name and grade level so the record can be located faster.';
    }

    return 'Message received. The support desk has this conversation open.';
  }
}
