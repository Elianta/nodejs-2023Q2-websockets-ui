import { WebSocket, WebSocketServer } from 'ws';
import { GameController } from '../GameController.js';
import { createResponse, parseString } from '../utils.js';
import {
  AddShipsData,
  AddUserToRoomData,
  AttackData,
  FinishGameResponseData,
  IncomingMessage,
  IncomingMessageType,
  RegisterData,
  RegisterResponseData,
  ResponseMessageType,
  UpdateRoomResponseData,
  UpdateWinnersResponseData,
} from '../types.js';

export class WSServer {
  private wss: WebSocketServer;
  private gameController: GameController;

  constructor(port: number, listeningListener?: () => void) {
    this.wss = new WebSocketServer({ port }, listeningListener);
    this.gameController = new GameController();
  }

  broadcast(message: string) {
    this.wss.clients.forEach((client) => client.send(message));
  }

  up() {
    this.wss.on('connection', (ws) => {
      ws.on('error', console.error);

      ws.on('close', () => {
        console.log('Socket disconnect');
      });

      ws.on('message', (data) => {
        console.log('Client request', data.toString());
        try {
          const message = parseString(data.toString()) as IncomingMessage;
          const messageType = message?.type ?? null;

          switch (messageType) {
            case IncomingMessageType.Register: {
              const { data } = message as IncomingMessage<RegisterData>;
              this.handleRegister(ws, data);
              this.updateRooms();
              this.updateWinners();
              return;
            }

            case IncomingMessageType.CreateRoom: {
              this.handleCreateRoom(ws);
              return;
            }

            case IncomingMessageType.AddUserToRoom: {
              const { data } = message as IncomingMessage<AddUserToRoomData>;
              this.handleAddUserToRoom(ws, data);
              return;
            }

            case IncomingMessageType.AddShips: {
              const { data } = message as IncomingMessage<AddShipsData>;
              this.handleAddShips(data);
              return;
            }

            case IncomingMessageType.Attack:
            case IncomingMessageType.RandomAttack: {
              const { data } = message as IncomingMessage<AttackData>;
              this.handleAttack(ws, data);
              return;
            }

            default:
              break;
          }
        } catch (error: any) {
          console.log(error?.message ?? error);
        }
      });
    });
  }

  handleRegister(ws: WebSocket, data: RegisterData) {
    const { name, password } = data;
    const registerResponseData = this.gameController.registerUser(name, password, ws);
    const response = createResponse<RegisterResponseData>(
      ResponseMessageType.Register,
      registerResponseData,
    );
    console.log('Server response: ', response);
    ws.send(response);
  }

  handleCreateRoom(ws: WebSocket) {
    this.gameController.createRoom(ws);
    this.updateRooms();
  }

  handleAddUserToRoom(ws: WebSocket, data: AddUserToRoomData) {
    const { indexRoom } = data;

    this.gameController.addUserToRoomAndCreateGame(indexRoom, ws);
    this.updateRooms();
  }

  handleAddShips(data: AddShipsData) {
    const { gameId, indexPlayer, ships } = data;
    this.gameController.addShipsToGameAndStart(gameId, indexPlayer, ships);
  }

  handleAttack(ws: WebSocket, data: AttackData) {
    const { x, y, gameId, indexPlayer } = data;
    const position = typeof x === 'number' && typeof y === 'number' ? { x, y } : null;

    this.gameController.handleAttack(gameId, indexPlayer, position);

    const { isFinished } = this.gameController.checkIfGameFinished(gameId);
    if (isFinished) {
      const connections = this.gameController.getConnectionsByGameId(gameId);
      const webSockets = connections.map(({ ws }) => ws);
      this.finishGame(indexPlayer, webSockets);

      this.updateWinners();
      this.gameController.closeRoom(ws);
    }
  }

  updateRooms() {
    const availableRooms = this.gameController.getAvailableRooms();
    const roomsResponse = createResponse<UpdateRoomResponseData>(
      ResponseMessageType.UpdateRoom,
      availableRooms,
    );
    console.log('Server response: ', roomsResponse);
    this.broadcast(roomsResponse);
  }

  updateWinners() {
    const winners = this.gameController.getWinners();
    const winnersResponse = createResponse<UpdateWinnersResponseData>(
      ResponseMessageType.UpdateWinners,
      winners,
    );
    console.log('Server response: ', winners);
    this.broadcast(winnersResponse);
  }

  finishGame(winnerIndex: number, webSockets: WebSocket[]) {
    const response = createResponse<FinishGameResponseData>(ResponseMessageType.FinishGame, {
      winPlayer: winnerIndex,
    });
    console.log('Server response: ', response);
    webSockets.forEach((ws) => {
      ws.send(response);
    });
  }
}
