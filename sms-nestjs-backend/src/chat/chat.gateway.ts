import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { getJwtSecret } from '../auth/jwt-secret';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: getJwtSecret(),
      });

      const userId = payload.sub;
      if (!userId) {
        client.disconnect();
        return;
      }

      // Join a room named after their user ID so we can target them easily
      client.join(userId);

      // If they are a staff member, join the staff room to receive general support updates
      if (['ADMIN', 'FINANCE', 'REGISTRAR', 'PRINCIPAL', 'TEACHER'].includes(payload.role)) {
        client.join('staff');
      }
    } catch (e) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Automatically leave rooms on disconnect, handled by Socket.io
  }

  notifyUser(userId: string) {
    if (this.server) {
      this.server.to(userId).emit('chat-updated');
    }
  }

  notifyStaff() {
    if (this.server) {
      this.server.to('staff').emit('chat-updated');
    }
  }
}
