import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'ws';
import { DrawDBClientService } from './drawdb-client.service';

/**
 * WebSocket Gateway for DrawDB client connections
 * Listens on /remote-control path
 */
@WebSocketGateway({
  path: '/remote-control',
  cors: {
    origin: '*', // In production, restrict this to your DrawDB frontend origin
  },
})
export class DrawDBGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DrawDBGateway.name);

  constructor(private readonly drawdbClient: DrawDBClientService) {}

  async handleConnection(client: any) {
    this.logger.log('DrawDB client attempting to connect...');

    // Set the client connection in the service
    // This is async to properly handle connection replacement and prevent race conditions
    await this.drawdbClient.setConnection(client);
  }

  handleDisconnect(client: any) {
    this.logger.log('DrawDB client disconnected');
  }
}
