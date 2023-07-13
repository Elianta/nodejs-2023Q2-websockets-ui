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

export type AvailableRoom = {
  roomId: number;
  roomUsers: Array<{ name: string; index: number }>;
};
