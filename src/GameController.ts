import { WebSocket } from 'ws';
import { Game } from './Game.js';
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

  createRoom(ws: WebSocket, withBot: boolean = false): Room {
    const foundRoom = this.findRoomWithWs(ws);
    const foundConnection = this.connections.find((connection) => connection.ws === ws);

    if (!!foundRoom) {
      throw new Error('createRoom error: user cannot create more than 1 room');
    }
    if (!foundConnection) {
      throw new Error('createRoom error: connection is not found');
    }

    const room = new Room(foundConnection, withBot);
    this.rooms.push(room);
    return room;
  }

  getAvailableRooms(): AvailableRoom[] {
    return this.rooms
      .filter((room) => room.connections.length <= 1 && !room.withBot)
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

  createGameWithBot(roomIndex: number, ws: WebSocket): Game {
    const foundRoom = this.rooms.find(
      (room) =>
        room.index === roomIndex && room.connections.some((connection) => connection.ws === ws),
    );
    if (!foundRoom) {
      throw new Error('createGameWithBot error: room with specified index is not found');
    }

    const game = foundRoom.createGame();
    // remove socket from other rooms
    this.excludeBusySocketFromOtherRooms(ws, foundRoom.index);
    return game;
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

  handleAttack(
    gameIndex: number,
    userIndex: number,
    position: Position | null,
    onGameFinish: () => void,
  ): void {
    const foundRoom = this.rooms.find((room) => room.game.index === gameIndex);
    if (!foundRoom) {
      throw new Error('handleAttack error: room is not found');
    }

    const onFinish = (winnerIndex: number, botWin: boolean): void => {
      if (!botWin) this.addWinForUser(winnerIndex);
      onGameFinish();
    };
    foundRoom.handleAttack(userIndex, position, onFinish);
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

  handleDisconnect(ws: WebSocket): void {
    const foundRoom = this.findRoomWithWs(ws);

    if (!foundRoom) {
      throw new Error('handleDisconnect error: room is not found');
    }

    const foundConnection = foundRoom.connections.find(
      (connection) => connection.ws === ws,
    ) as Connection;

    foundRoom.disconnectUser(foundConnection.userIndex);
  }

  clearConnections(...wsockets: WebSocket[]): void {
    this.connections = this.connections.filter((connection) => !wsockets.includes(connection.ws));
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
