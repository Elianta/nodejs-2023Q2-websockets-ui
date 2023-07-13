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
