import { Body, Controller, Get, Post, Req } from '@nestjs/common';
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

  @Post('messages')
  sendMessage(@Req() req: AuthenticatedRequest, @Body() body: SendChatMessageDto) {
    return this.chatService.sendMessage(req.user, body);
  }
}
