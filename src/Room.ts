import { Connection } from './Connection.js';

export class Room {
  private static index = 0;
  index: number;
  connections: Connection[];

  constructor(connection: Connection) {
    this.connections = [connection];
    this.index = ++Room.index;
  }
}
