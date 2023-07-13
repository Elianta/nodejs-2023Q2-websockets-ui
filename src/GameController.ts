import { WebSocket } from 'ws';
import { Connection } from './Connection.js';
import { Room } from './Room.js';
import { User } from './User.js';
import { AvailableRoom, RegisterResponseData } from './types.js';

export class GameController {
  private users: User[] = [];
  private connections: Connection[] = [];
  private rooms: Room[] = [];

  registerUser(name: string, pass: string, ws: WebSocket): RegisterResponseData {
    const foundUser = this.users.find((user) => user.name === name);

    if (!!foundUser) {
      if (foundUser.password === pass) {
        const connection = new Connection(ws, foundUser.index);
        this.connections.push(connection);
        return {
          name: foundUser.name,
          index: foundUser.index,
          error: false,
          errorText: '',
        };
      } else {
        return {
          name: foundUser.name,
          index: foundUser.index,
          error: true,
          errorText: 'Invalid password!',
        };
      }
    } else {
      const user = new User(name, pass);
      const connection = new Connection(ws, user.index);
      this.users.push(user);
      this.connections.push(connection);

      return {
        name: user.name,
        index: user.index,
        error: false,
        errorText: '',
      };
    }
  }

  createRoom(ws: WebSocket): Room {
    const foundRoom = this.findRoomWithWs(ws);
    const foundConnection = this.connections.find((connection) => connection.ws === ws);

    if (!!foundRoom) {
      throw new Error('createRoom error: user cannot create more than 1 room');
    }
    if (!foundConnection) {
      throw new Error('createRoom error: connection is not found');
    }

    const room = new Room(foundConnection);
    this.rooms.push(room);
    return room;
  }

  getAvailableRooms(): AvailableRoom[] {
    return this.rooms
      .filter((room) => room.connections.length <= 1)
      .map((room) => ({
        roomId: room.index,
        roomUsers: room.connections.map((connection) => {
          const userName = this.users.find((user) => user.index === connection.userIndex)!.name;
          return {
            name: userName,
            index: connection.userIndex,
          };
        }),
      }));
  }

  findRoomWithWs(ws: WebSocket): Room | null {
    return (
      this.rooms.find((room) => room.connections.some((connection) => connection.ws === ws)) ?? null
    );
  }
}
