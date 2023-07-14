export interface IncomingMessage<T = any> {
  type: IncomingMessageType;
  data: T;
  id: number;
}

export enum IncomingMessageType {
  Register = 'reg',
  CreateRoom = 'create_room',
  AddUserToRoom = 'add_user_to_room',
  AddShips = 'add_ships',
  RandomAttack = 'randomAttack',
  Attack = 'attack',
  SinglePlay = 'single_play',
}

export type RegisterData = {
  name: string;
  password: string;
};

export type AddUserToRoomData = {
  indexRoom: number;
};

export type AddShipsData = {
  gameId: number;
  ships: IShip[];
  indexPlayer: number;
};

export interface ResponseMessage<T = any> {
  type: ResponseMessageType;
  data: T;
  id: number;
}

export enum ResponseMessageType {
  Register = 'reg',
  UpdateRoom = 'update_room',
  CreateGame = 'create_game',
  StartGame = 'start_game',
  PlayerTurn = 'turn',
  Attack = 'attack',
  FinishGame = 'finish',
  UpdateWinners = 'update_winners',
}

export type RegisterResponseData = {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
};

export type UpdateRoomResponseData = AvailableRoom[];

export type CreateGameResponseData = {
  idGame: number;
  idPlayer: number;
};

export type StartGameResponseData = {
  ships: IShip[];
  currentPlayerIndex: number;
};

export type PlayerTurnResponseData = {
  currentPlayer: number;
};

export type AvailableRoom = {
  roomId: number;
  roomUsers: Array<{ name: string; index: number }>;
};

export type Position = {
  x: number;
  y: number;
};

export enum ShipType {
  Destroyer = 'small',
  Submarine = 'medium',
  Cruiser = 'large',
  Battleship = 'huge',
}

export interface IShip {
  position: Position;
  direction: boolean;
  length: number;
  type: ShipType;
}

export type ShipDirection = 'vertical' | 'horizontal';
