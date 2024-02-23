import 'dotenv/config';
import { httpServer } from './src/http_server';
import { wss } from './src/ws_server/ws';
import { App } from './src/app/App';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

const app = new App(wss);

app.start();
