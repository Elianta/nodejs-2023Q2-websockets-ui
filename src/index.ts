import { httpServer } from './http_server/index.js';
import { WSServer } from './ws_server/index.js';

const HTTP_PORT = 8181;
const WSS_PORT = 3000;

httpServer.listen(HTTP_PORT, () => {
  console.log(`Start static http server on the ${HTTP_PORT} port!`);
});

const wsServer = new WSServer(WSS_PORT, () => {
  console.log(`Start websocket server on the ${WSS_PORT} port!`);
});
wsServer.up();
