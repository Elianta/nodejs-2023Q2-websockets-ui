import { Position, ShipDirection, ShipType } from './types.js';
import { Ship } from './Ship.js';
import { getRandomFromList } from './utils.js';

type GridShip = {
  type: ShipType;
  size: number;
};

type GridCell = {
  isShip: boolean;
  isSea: boolean;
};

export class Grid {
  private _config: GridShip[] = [
    {
      type: ShipType.Battleship,
      size: 4,
    },
    ...new Array(2).fill({
      type: ShipType.Cruiser,
      size: 3,
    }),
    ...new Array(3).fill({
      type: ShipType.Destroyer,
      size: 2,
    }),
    ...new Array(4).fill({
      type: ShipType.Submarine,
      size: 1,
    }),
  ];
  gridSize: number;
  cells: GridCell[] = [];
  ships: Ship[] = [];

  constructor(size: number) {
    this.gridSize = size;
    this.createCells();
    this.computerPlaceShips();
  }

  createCells() {
    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      this.cells.push({ isSea: false, isShip: false });
    }
  }

  computerPlaceShips() {
    const ships = this._config.slice();

    while (ships.length > 0) {
      const ship = ships[0] as GridShip;
      const shipLength = ship.size;
      const shipType = ship.type;

      let canPlaceShip = true;

      // Choose horizontal or vertical ship
      const randomDirection: boolean = getRandomFromList([true, false]);
      let randomIndex = Math.floor(Math.random() * this.cells.length);

      let columnIndex = randomIndex % this.gridSize;
      let rowIndex = Math.floor(randomIndex / this.gridSize);
      let orientation: number;

      //Make horizontal ship
      if (randomDirection === true) {
        orientation = 1;
        // while not enough space for ship
        while (this.gridSize - columnIndex < shipLength) {
          randomIndex = Math.floor(Math.random() * this.gridSize);
          columnIndex = randomIndex % this.gridSize;
        }
        // Make vertical ship
      } else {
        orientation = this.gridSize;
        while (rowIndex + shipLength >= this.gridSize) {
          randomIndex = Math.floor(Math.random() * this.cells.length);
          columnIndex = randomIndex % this.gridSize;
          rowIndex = Math.floor(randomIndex / this.gridSize);
        }
      }

      // check that place is allowed
      for (let i = 0; i < shipLength; i++) {
        const nextIndex = randomIndex + i * orientation;
        if (this.cells[nextIndex]!.isShip || this.cells[nextIndex]!.isSea) {
          canPlaceShip = false;
        }
      }

      if (canPlaceShip) {
        ships.shift();
      }

      if (canPlaceShip) {
        const startX = columnIndex;
        const startY = rowIndex;
        const direction: ShipDirection = randomDirection === true ? 'horizontal' : 'vertical';
        const ship = new Ship({
          size: shipLength,
          startPos: { x: startX, y: startY },
          direction,
          gridSize: this.gridSize,
          type: shipType,
        });
        this.ships.push(ship);

        const shipParts = ship.partsPositions;
        const seaPositions = ship.seaPositions;
        this.markShipCells(shipParts);
        this.blockCellsAroundShip(seaPositions);
      }
    }
  }

  markShipCells(positions: Position[]): void {
    positions.forEach(({ x, y }) => {
      const cellIndex = x + y * this.gridSize;
      this.cells[cellIndex]!.isShip = true;
    });
  }

  blockCellsAroundShip(positions: Position[]): void {
    positions.forEach(({ x, y }) => {
      const cellIndex = x + y * this.gridSize;
      this.cells[cellIndex]!.isSea = true;
    });
  }
}
