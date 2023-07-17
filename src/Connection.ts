import type { WebSocket } from 'ws';

export class Connection {
  ws: WebSocket;
  userIndex: number;

  constructor(ws: WebSocket, userIndex: number) {
    this.ws = ws;
    this.userIndex = userIndex;
  }
}
