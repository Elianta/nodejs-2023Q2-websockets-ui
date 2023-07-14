import {
  CreateGameResponseData,
  IShip,
  PlayerTurnResponseData,
  ResponseMessageType,
  StartGameResponseData,
} from './types.js';
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

  addShipsForUserAndStart(userIndex: number, ships: IShip[]) {
    this.game.setPlayerShips(userIndex, ships);
    if (this.game.canBeStarted()) {
      this.game.start();
      this.sendStartGameSignal();
      this.sendPlayerTurnSignal();
    }
  }

  sendStartGameSignal() {
    const currentPlayerIndex = this.game.getCurrentPlayer();
    this.connections.forEach(({ ws, userIndex }) => {
      const startGameResponseData: StartGameResponseData = {
        currentPlayerIndex,
        ships: this.game.rowShips.get(userIndex) as IShip[],
      };
      const response = createResponse(ResponseMessageType.StartGame, startGameResponseData);
      console.log('Server response: ', response);
      ws.send(response);
    });
  }

  sendPlayerTurnSignal() {
    const currentPlayerIndex = this.game.getCurrentPlayer();
    this.connections.forEach(({ ws }) => {
      const playerTurnResponseData: PlayerTurnResponseData = {
        currentPlayer: currentPlayerIndex,
      };
      const response = createResponse(ResponseMessageType.PlayerTurn, playerTurnResponseData);
      console.log('Server response: ', response);
      ws.send(response);
    });
  }
}
