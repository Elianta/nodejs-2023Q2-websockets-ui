import { WebSocket } from 'ws';
import { Connection } from './Connection.js';
import { Room } from './Room.js';
import { User } from './User.js';
import { AvailableRoom, IShip, IWinner, Position, RegisterResponseData } from './types.js';

export class GameController {
  private users: User[] = [];
  private connections: Connection[] = [];
  private rooms: Room[] = [];
  private winners: IWinner[] = [];

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
      this.winners.push({ name, wins: 0 });

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

  addUserToRoomAndCreateGame(roomIndex: number, ws: WebSocket): void {
    const foundRoom = this.rooms.find((room) => room.index === roomIndex);
    const foundConnection = this.connections.find((connection) => connection.ws === ws);

    if (!foundRoom) {
      throw new Error('addUserToRoom error: room with specified index is not found');
    }

    const isUserAlreadyInside = foundRoom.connections.some((connection) => connection.ws === ws);
    if (isUserAlreadyInside) {
      throw new Error('addUserToRoom error: user is already inside');
    }

    if (!foundConnection) {
      throw new Error('createRoom error: connection is not found');
    }

    foundRoom.connections.push(foundConnection);
    foundRoom.createGame();
    // remove socket from other rooms
    this.excludeBusySocketFromOtherRooms(ws, foundRoom.index);
  }

  excludeBusySocketFromOtherRooms(ws: WebSocket, busyRoomIndex: number) {
    this.rooms = this.rooms.filter(
      (room) =>
        !(
          room.connections.some((connection) => connection.ws === ws) &&
          room.index !== busyRoomIndex
        ),
    );
  }

  addShipsToGameAndStart(gameIndex: number, userIndex: number, ships: IShip[]): void {
    const foundRoom = this.findRoomWithGame(gameIndex);
    if (!foundRoom) {
      throw new Error('addShipsToGame error: room is not found');
    }

    foundRoom.addShipsForUserAndStart(userIndex, ships);
  }

  handleAttack(gameIndex: number, userIndex: number, position: Position | null): void {
    const foundRoom = this.rooms.find((room) => room.game.index === gameIndex);
    if (!foundRoom) {
      throw new Error('handleAttack error: room is not found');
    }

    foundRoom.handleAttack(userIndex, position);
    this.updateWinners(gameIndex, userIndex);
  }

  updateWinners(gameIndex: number, userIndex: number): void {
    const { isFinished } = this.checkIfGameFinished(gameIndex);
    if (isFinished) {
      this.addWinForUser(userIndex);
    }
  }

  checkIfGameFinished(gameIndex: number): { isFinished: boolean } {
    const room = this.findRoomWithGame(gameIndex);
    if (!room) return { isFinished: false };

    const isFinished = room.game.isFinished;
    return { isFinished };
  }

  getWinners() {
    return this.winners;
  }

  addWinForUser(userIndex: number) {
    const foundUser = this.users.find((user) => user.index === userIndex);
    if (foundUser) {
      this.winners = this.winners
        .map(({ name, wins }) => {
          return name === foundUser.name ? { name, wins: wins + 1 } : { name, wins };
        })
        .sort((a, b) => b.wins - a.wins);
    }
  }

  getConnectionsByGameId(gameIndex: number): Connection[] {
    const foundRoom = this.rooms.find((room) => room.game.index === gameIndex);
    return !!foundRoom ? foundRoom.connections : [];
  }

  findRoomWithWs(ws: WebSocket): Room | null {
    return (
      this.rooms.find((room) => room.connections.some((connection) => connection.ws === ws)) ?? null
    );
  }

  findRoomWithGame(gameIndex: number): Room | null {
    return this.rooms.find((room) => room.game.index === gameIndex) ?? null;
  }

  closeRoom(ws: WebSocket) {
    const foundRoom = this.findRoomWithWs(ws);
    if (!!foundRoom) {
      this.rooms = this.rooms.filter((room) => room.index !== foundRoom.index);
    }
  }
}
