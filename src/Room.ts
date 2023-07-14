import { CreateGameResponseData, ResponseMessageType } from './types.js';
import { Connection } from './Connection.js';
import { Game } from './Game.js';
import { createResponse } from './utils.js';

export class Room {
  private static index = 0;
  index: number;
  connections: Connection[];
  game: Game;

  constructor(connection: Connection) {
    this.connections = [connection];
    this.index = ++Room.index;
  }

  createGame(): Game {
    this.game = new Game();

    this.connections.forEach(({ ws, userIndex }) => {
      const createGameResponseData: CreateGameResponseData = {
        idGame: this.game.index,
        idPlayer: userIndex,
      };
      const response = createResponse(ResponseMessageType.CreateGame, createGameResponseData);
      console.log('Server response: ', response);
      ws.send(response);
    });
    return this.game;
  }
}
