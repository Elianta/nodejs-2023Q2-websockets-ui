import {
  AttackResponseData,
  AttackStatus,
  CreateGameResponseData,
  FinishGameResponseData,
  IShip,
  PlayerTurnResponseData,
  Position,
  ResponseMessageType,
  StartGameResponseData,
} from './types.js';
import { Connection } from './Connection.js';
import { Game } from './Game.js';
import { createResponse } from './utils.js';

export class Room {
  private static index = 0;
  index: number;
  withBot: boolean;
  connections: Connection[];
  game: Game;

  constructor(connection: Connection, withBot: boolean = false) {
    this.withBot = withBot;
    this.connections = [connection];
    this.index = ++Room.index;
    this.game = new Game(this.withBot);
  }

  createGame(): Game {
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
      if (this.botShouldAttack()) {
        this.botAttack();
      }
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

  handleAttack(
    userIndex: number,
    position: Position | null,
    onGameFinish?: (winnerIndex: number, botWin: boolean) => void,
  ): void {
    const currentPlayerIndex = this.game.getCurrentPlayer();
    if (userIndex !== currentPlayerIndex) {
      console.log('handleAttack error: player is out of turn');
      return;
    }

    try {
      const attacks = this.game.handleAttack(position);
      this.sendAttackSignal(currentPlayerIndex, attacks);
    } catch (error: any) {
      console.log(`handleAttack error: ${error?.message}`);
    } finally {
      this.sendPlayerTurnSignal();
      const { isFinished, winnerIdx, botWin } = this.checkIfGameFinished();
      if (isFinished) {
        this.sendFinishSignal(winnerIdx!);
        onGameFinish?.(winnerIdx!, botWin);
      }
      if (this.botShouldAttack()) {
        this.botAttack(onGameFinish);
      }
    }
  }

  sendAttackSignal(
    playerIdx: number,
    attacks: Array<{ position: Position; status: AttackStatus }>,
  ) {
    this.connections.forEach(({ ws }) => {
      attacks.forEach((attack) => {
        const attackResponseData: AttackResponseData = {
          currentPlayer: playerIdx,
          position: attack.position,
          status: attack.status,
        };
        const response = createResponse(ResponseMessageType.Attack, attackResponseData);
        console.log('Server response: ', response);
        ws.send(response);
      });
    });
  }

  botShouldAttack(): boolean {
    return (
      this.game.bot !== null &&
      this.game.getCurrentPlayer() === this.game.bot.index &&
      !this.game.isFinished
    );
  }

  botAttack(onGameFinish?: (winnerIndex: number, botWin: boolean) => void) {
    if (!!this.game.bot) {
      const botIndex = this.game.bot.index;
      setTimeout(() => {
        this.handleAttack(botIndex, null, onGameFinish);
      }, 1000);
    }
  }

  checkIfGameFinished(): {
    isFinished: boolean;
    botWin: boolean;
    winnerIdx?: number;
  } {
    const isFinished = this.game.isFinished;
    const winnerIdx = this.game.winnerIdx;
    const botIdx = this.game.bot?.index;

    if (typeof botIdx === 'number' && typeof winnerIdx === 'number' && botIdx === winnerIdx) {
      return { isFinished, botWin: true, winnerIdx };
    }
    return { isFinished, botWin: false, winnerIdx };
  }

  sendFinishSignal(winnerIndex: number) {
    const response = createResponse<FinishGameResponseData>(ResponseMessageType.FinishGame, {
      winPlayer: winnerIndex,
    });
    console.log('Server response: ', response);
    this.connections.forEach(({ ws }) => {
      ws.send(response);
    });
  }

  disconnectUser(userIndex: number): void {
    if (this.game.isStarted) {
      this.game.excludePlayerAndFinish(userIndex);
      this.sendFinishSignal(this.game.winnerIdx!);
    }
  }
}
