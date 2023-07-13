import { WebSocket } from 'ws';
import { Connection } from './Connection.js';
import { User } from './User.js';
import { RegisterResponseData } from './types.js';

export class GameController {
  private users: User[] = [];
  private connections: Connection[] = [];

  registerUser(name: string, pass: string, ws: WebSocket): RegisterResponseData {
    const foundUser = this.users.find((user) => user.name === name);

    if (!!foundUser) {
      if (foundUser.password === pass) {
        const connection = new Connection(ws, foundUser.index);
        this.connections.push(connection);
        return {
          name: foundUser.name,
          index: foundUser.index,
          error: false,
          errorText: '',
        };
      } else {
        return {
          name: foundUser.name,
          index: foundUser.index,
          error: true,
          errorText: 'Invalid password!',
        };
      }
    } else {
      const user = new User(name, pass);
      const connection = new Connection(ws, user.index);
      this.users.push(user);
      this.connections.push(connection);

      return {
        name: user.name,
        index: user.index,
        error: false,
        errorText: '',
      };
    }
  }
}
