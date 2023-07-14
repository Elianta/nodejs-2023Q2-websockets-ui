import { getRandomFromList } from './utils.js';
import { IShip } from './types.js';
import { Ship } from './Ship.js';

export type MatrixShip = {
  isShip: boolean;
  inGame: boolean;
  ship: Ship | null;
};
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
  killCount = new Map<number, number>();
  rowShips = new Map<number, IShip[]>();
  private _ships = new Map<number, Ship[]>();
  private _shipsMatrix = new Map<number, MatrixShip[][]>();

  constructor() {
    this.index = ++Game.index;
  }

  canBeStarted(): boolean {
    return this.connectedPlayers === this.maxPlayers;
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

  start() {
    const players = [...this.rowShips.keys()];
    const randomPlayer = getRandomFromList(players);

    players.forEach((player) => {
      this.killCount.set(player, 0);
    });
    this.setCurrentPlayer(randomPlayer);

    this.generateShipsForAllPlayers();
    this.generateShipsMatrix();

    this.isStarted = true;
  }

  generateShipsForAllPlayers() {
    for (const [playerIdx, shipsData] of this.rowShips) {
      const ships = shipsData.map((data) => {
        const size = data.length;
        const { x, y } = data.position;
        const direction = data.direction ? 'vertical' : 'horizontal';
        return new Ship({
          size,
          startPos: { x, y },
          direction,
          gridSize: this.gridSize,
          type: data.type,
        });
      });
      this._ships.set(playerIdx, ships);
    }
  }

  generateShipsMatrix() {
    for (const [playerIdx, ships] of this._ships) {
      const matrix: MatrixShip[][] = [];
      for (let x = 0; x < this.gridSize; x++) {
        for (let y = 0; y < this.gridSize; y++) {
          const shipFound = ships.find((ship) =>
            ship.partsPositions.some((pos) => pos.x === x && pos.y === y),
          );
          (matrix[x] = matrix[x] ?? [])[y] = {
            inGame: true,
            isShip: !!shipFound,
            ship: shipFound ?? null,
          };
        }
      }

      this._shipsMatrix.set(playerIdx, matrix);
    }
  }
}
