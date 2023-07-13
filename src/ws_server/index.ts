import { WebSocketServer } from 'ws';
import { parseString } from '../utils.js';
import { IncomingMessage } from '../types.js';

export class WSServer {
  private wss: WebSocketServer;

  constructor(port: number, listeningListener?: () => void) {
    this.wss = new WebSocketServer({ port }, listeningListener);
  }

  broadcast(message: string) {
    this.wss.clients.forEach((client) => client.send(message));
  }

  up() {
    this.wss.on('connection', (ws) => {
      ws.on('error', console.error);

      ws.on('close', () => {
        console.log('Socket disconnect');
      });

      ws.on('message', (data) => {
        console.log('Client request', data.toString());
        try {
          const message = parseString(data.toString()) as IncomingMessage;
          const messageType = message?.type ?? null;
          console.log('Message type: ', messageType);
        } catch (error: any) {
          console.log(error?.message ?? error);
        }
      });
    });
  }
}
