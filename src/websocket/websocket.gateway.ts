import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WSGateway({
  cors: {
    origin: ['http://localhost:5173', process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  },
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      
      console.log(`✅ WebSocket client connected: ${payload.email}`);
      client.emit('connected', { message: 'Connected successfully' });
    } catch (error) {
      console.log('❌ WebSocket authentication failed');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`⚠️ WebSocket client disconnected: ${client.data.user?.email || 'Unknown'}`);
  }

  @SubscribeMessage('join-project')
  handleJoinProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.join(`project-${projectId}`);
    console.log(`User ${client.data.user?.email} joined project ${projectId}`);
  }

  @SubscribeMessage('leave-project')
  handleLeaveProject(@ConnectedSocket() client: Socket, @MessageBody() projectId: string) {
    client.leave(`project-${projectId}`);
    console.log(`User ${client.data.user?.email} left project ${projectId}`);
  }

  @SubscribeMessage('task-update')
  handleTaskUpdate(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    client.to(`project-${data.projectId}`).emit('task-updated', {
      ...data,
      updatedBy: client.data.user,
    });
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.server.emit('notification', notification);
  }

  sendProjectUpdate(projectId: string, update: any) {
    this.server.to(`project-${projectId}`).emit('project-updated', update);
  }
}