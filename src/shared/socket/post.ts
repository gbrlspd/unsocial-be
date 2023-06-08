import { Server, Socket } from 'socket.io';

export let socketPostObject: Server;

export class SocketPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log('Socket post handler');
    });
  }
}
