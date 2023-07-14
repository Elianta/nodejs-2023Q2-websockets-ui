import { getRandomFromList } from './utils.js';
import { AttackStatus, IShip, Position } from './types.js';
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
  winnerIdx?: number;
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

  addKillForPlayer(playerIdx: number) {
    const prevCount = this.killCount.get(playerIdx) as number;
    this.killCount.set(playerIdx, prevCount + 1);
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

  getEnemyIndex(playerIdx: number): number {
    return [...this._shipsMatrix.keys()].find((idx) => idx !== playerIdx) as number;
  }

  handleAttack(position: Position | null): Array<{ status: AttackStatus; position: Position }> {
    const enemyIdx = this.getEnemyIndex(this.currentPlayerIdx);
    const target = position || this.getRandomTarget();

    if (!this.attackIsAllowed(target)) {
      throw new Error('attack is not allowed');
    }

    const { x, y } = target;
    const matrix = this._shipsMatrix.get(enemyIdx) as MatrixShip[][];
    const matrixCell = matrix?.[x]?.[y] as MatrixShip;
    let attacks: Array<{ status: AttackStatus; position: Position }> = [];

    if (matrixCell.isShip && !!matrixCell.ship) {
      const isKilled = matrixCell.ship.shot();
      if (isKilled) {
        const seaPositions = matrixCell.ship.seaPositions;
        const partsPositions = matrixCell.ship.partsPositions;
        this.revalidateInGameCells(matrix, target, ...seaPositions);
        this.addKillForPlayer(this.currentPlayerIdx);
        attacks = [
          ...partsPositions.map((position) => ({ status: AttackStatus.Killed, position })),
          ...seaPositions.map((position) => ({ status: AttackStatus.Miss, position })),
        ];
      } else {
        this.revalidateInGameCells(matrix, target);
        attacks = [{ status: AttackStatus.Shot, position: target }];
      }
    } else {
      this.revalidateInGameCells(matrix, target);
      this.setCurrentPlayer(enemyIdx);
      attacks = [{ status: AttackStatus.Miss, position: target }];
    }

    this.checkIfFinished();
    return attacks;
  }

  revalidateInGameCells(matrix: MatrixShip[][], ...positionsToExclude: Position[]) {
    positionsToExclude.forEach(({ x, y }) => {
      const matrixCell = matrix?.[x]?.[y] as MatrixShip;
      if (!!matrixCell) {
        matrixCell.inGame = false;
      }
    });
  }

  getInGamePositions(playerIdx: number): Position[] {
    const matrix = this._shipsMatrix.get(playerIdx) as MatrixShip[][];
    const inGamePositions: Position[] = matrix.reduce((acc, currentRow, rowIdx) => {
      currentRow.forEach((col, colIdx) => {
        if (col.inGame) acc.push({ x: rowIdx, y: colIdx });
      });
      return acc;
    }, [] as Position[]);
    return inGamePositions;
  }

  getRandomTarget(): Position {
    const enemyIdx = this.getEnemyIndex(this.currentPlayerIdx);
    const inGamePositions = this.getInGamePositions(enemyIdx);
    const randomPosition = getRandomFromList(inGamePositions);
    return randomPosition;
  }

  attackIsAllowed(position: Position): boolean {
    const enemyIdx = this.getEnemyIndex(this.currentPlayerIdx);
    const inGamePositions = this.getInGamePositions(enemyIdx);
    return inGamePositions.some((pos) => pos.x === position.x && pos.y === position.y);
  }

  checkIfFinished() {
    for (const [playerIdx, killCount] of this.killCount.entries()) {
      if (killCount >= this.shipsQuantity) {
        this.isStarted = false;
        this.winnerIdx = playerIdx;
        this.isFinished = true;
      }
    }
  }

  excludePlayerAndFinish(playerIdx: number) {
    for (const player of this.killCount.keys()) {
      if (player !== playerIdx) {
        if (this.isStarted) this.winnerIdx = player;
        this.isStarted = false;
        this.isFinished = true;
      }
    }
  }
}
