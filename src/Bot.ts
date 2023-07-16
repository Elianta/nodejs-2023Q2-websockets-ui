import { Ship } from './Ship.js';
import { Grid } from './Grid.js';

export class Bot {
  private static index = 2;
  index: number;
  gridSize: number;
  grid: Grid;

  constructor(gridSize: number) {
    this.gridSize = gridSize;
    this.index = Bot.index;
    Bot.index += 2;
    this.grid = new Grid(this.gridSize);
  }

  getShips(): Ship[] {
    return this.grid.ships;
  }
}
