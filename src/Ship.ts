import { ShipDirection, Position, ShipType } from './types.js';

export class Ship {
  gridSize: number;
  size: number;
  type: ShipType;
  shots = 0;
  isKilled = false;
  partsPositions: Position[] = [];
  seaPositions: Position[] = [];

  constructor({
    size,
    startPos: { x: startX, y: startY },
    direction,
    gridSize,
    type,
  }: {
    size: number;
    startPos: Position;
    direction: ShipDirection;
    gridSize: number;
    type: ShipType;
  }) {
    this.size = size;
    this.type = type;
    this.gridSize = gridSize;
    this.calcPositions(startX, startY, direction);
  }

  isValidPos(pos: Position) {
    return pos.x >= 0 && pos.x <= this.gridSize - 1 && pos.y >= 0 && pos.y <= this.gridSize - 1;
  }

  calcPositions(startX: number, startY: number, direction: ShipDirection) {
    if (direction === 'horizontal') {
      for (let x = startX; x < startX + this.size; x++) {
        const pos = { x, y: startY };
        const isFirst = x === startX;
        const isLast = x === startX + this.size - 1;
        this.partsPositions.push(pos);
        if (isFirst && isLast) {
          const seaPositions = [
            { x, y: startY - 1 },
            { x: x - 1, y: startY - 1 },
            { x: x - 1, y: startY },
            { x: x - 1, y: startY + 1 },
            { x, y: startY + 1 },
            { x: x + 1, y: startY - 1 },
            { x: x + 1, y: startY },
            { x: x + 1, y: startY + 1 },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else if (isFirst) {
          const seaPositions = [
            { x, y: startY - 1 },
            { x: x - 1, y: startY - 1 },
            { x: x - 1, y: startY },
            { x: x - 1, y: startY + 1 },
            { x, y: startY + 1 },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else if (isLast) {
          const seaPositions = [
            { x, y: startY - 1 },
            { x: x + 1, y: startY - 1 },
            { x: x + 1, y: startY },
            { x: x + 1, y: startY + 1 },
            { x, y: startY + 1 },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else {
          const seaPositions = [
            { x, y: startY - 1 },
            { x, y: startY + 1 },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        }
      }
    } else {
      for (let y = startY; y < startY + this.size; y++) {
        const pos = { x: startX, y };
        const isFirst = y === startY;
        const isLast = y === startY + this.size - 1;
        this.partsPositions.push(pos);
        if (isFirst && isLast) {
          const seaPositions = [
            { x: startX - 1, y },
            { x: startX - 1, y: y - 1 },
            { x: startX, y: y - 1 },
            { x: startX + 1, y: y - 1 },
            { x: startX + 1, y },
            { x: startX - 1, y: y + 1 },
            { x: startX, y: y + 1 },
            { x: startX + 1, y: y + 1 },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else if (isFirst) {
          const seaPositions = [
            { x: startX - 1, y },
            { x: startX - 1, y: y - 1 },
            { x: startX, y: y - 1 },
            { x: startX + 1, y: y - 1 },
            { x: startX + 1, y },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else if (isLast) {
          const seaPositions = [
            { x: startX - 1, y },
            { x: startX - 1, y: y + 1 },
            { x: startX, y: y + 1 },
            { x: startX + 1, y: y + 1 },
            { x: startX + 1, y },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        } else {
          const seaPositions = [
            { x: startX - 1, y },
            { x: startX + 1, y },
          ].filter(this.isValidPos.bind(this));
          this.seaPositions.push(...seaPositions);
        }
      }
    }
  }
}
