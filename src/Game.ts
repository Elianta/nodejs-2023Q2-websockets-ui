export class Game {
  private static index = 0;
  private currentPlayerIdx: number;
  index: number;
  isStarted = false;
  isFinished = false;
  connectedPlayers = 0;
  maxPlayers = 2;
  gridSize = 10;

  constructor() {
    this.index = ++Game.index;
  }

  setCurrentPlayer(index: number) {
    this.currentPlayerIdx = index;
  }

  getCurrentPlayer() {
    return this.currentPlayerIdx;
  }
}
