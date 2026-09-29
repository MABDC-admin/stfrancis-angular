import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { ChatService } from './chat.service';
import type { SendChatMessageDto } from './chat.service';

interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('chat')
@Roles('ADMIN', 'REGISTRAR', 'FINANCE', 'PRINCIPAL', 'TEACHER', 'STUDENT')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('my-conversation')
  getMyConversation(@Req() req: AuthenticatedRequest) {
    return this.chatService.getMyConversation(req.user);
  }

  @Get('staff-contacts')
  getStaffContacts(@Req() req: AuthenticatedRequest) {
    return this.chatService.getStaffContacts(req.user);
  }

  @Get('conversations/:recipientUserId')
  getConversationWithRecipient(
    @Req() req: AuthenticatedRequest,
    @Param('recipientUserId') recipientUserId: string,
  ) {
    return this.chatService.getConversationWithRecipient(req.user, recipientUserId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.chatService.getUnreadCount(req.user);
  }

  @Patch('conversations/:conversationId/read')
  markConversationRead(
    @Req() req: AuthenticatedRequest,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.markConversationRead(req.user, conversationId);
  }

  @Post('test-broadcast')
  @Roles('ADMIN')
  sendTestMessageToAllUsers(@Req() req: AuthenticatedRequest) {
    return this.chatService.sendTestMessageToAllUsers(req.user);
  }

  @Post('messages')
  sendMessage(@Req() req: AuthenticatedRequest, @Body() body: SendChatMessageDto) {
    return this.chatService.sendMessage(req.user, body);
  }
}
