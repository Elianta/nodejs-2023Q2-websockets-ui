import { IShip } from './types.js';

export class Game {
  private static index = 0;
  private currentPlayerIdx: number;
  index: number;
  shipsQuantity: number;
  isStarted = false;
  isFinished = false;
  connectedPlayers = 0;
  maxPlayers = 2;
  gridSize = 10;
  rowShips = new Map<number, IShip[]>();

  constructor() {
    this.index = ++Game.index;
  }

  setCurrentPlayer(index: number) {
    this.currentPlayerIdx = index;
  }

  getCurrentPlayer() {
    return this.currentPlayerIdx;
  }

  setPlayerShips(playerIdx: number, ships: IShip[]) {
    this.shipsQuantity = ships.length;
    this.rowShips.set(playerIdx, ships);
    this.connectedPlayers++;
    console.log(`Ships of player #: ${playerIdx}`, this.rowShips.get(playerIdx));
  }
}
