import { WebSocket, WebSocketServer } from 'ws';
import { GameController } from '../GameController.js';
import { createResponse, parseString } from '../utils.js';
import {
  IncomingMessage,
  IncomingMessageType,
  RegisterData,
  RegisterResponseData,
  ResponseMessageType,
  UpdateRoomResponseData,
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
              return;
            }

            case IncomingMessageType.CreateRoom: {
              this.handleCreateRoom(ws);
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

  updateRooms() {
    const availableRooms = this.gameController.getAvailableRooms();
    const roomsResponse = createResponse<UpdateRoomResponseData>(
      ResponseMessageType.UpdateRoom,
      availableRooms,
    );
    console.log('Server response: ', roomsResponse);
    this.broadcast(roomsResponse);
  }
}
