import 'dotenv/config';
import { httpServer } from './src/http_server';
import { wss } from './src/ws_server/ws';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

console.log(wss.options);