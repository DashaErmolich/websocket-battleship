// import { RawData, Server, WebSocket } from 'ws';
// import { webSocketServer } from '../ws_server/ws';
// import { WSMessage } from '../models/message.model';
// import { PlayerEventType, RoomEventType } from '../enums/events.enum';
// import { game } from './Game';
// import { GamePlayer, PlayerLoginData } from '../models/player.model';
// import { ServerRegData } from '../models/server-data.model';
// import { ClientAddUserToRoomData } from '../models/client-data.model';
// import { Player } from './Player';
// import { Room } from './Room';
// import { GameRoom } from '../models/room.model';

// export class Application {
//   players: Set<GamePlayer>;
//   rooms: Room[] = [];
//   winners: Player[] = [];

//   server: Server;

//   constructor(webSocketServer: Server) {
//     this.server = webSocketServer;

//     this.server.on('connection', (ws: WebSocket) => {
//       this.handleNewConnection(ws);
//     });

//     this.players = new Set<GamePlayer>()
//   }

//   handleNewConnection(ws: WebSocket) {
//     const id = crypto.randomUUID();
//     this.clients[id]!.ws = ws;

//     ws.on('message', (rawMessage: RawData) => {
//       const message = JSON.parse(rawMessage.toString());

//       if (message.data && typeof message.data === 'string') {
//         message.data = JSON.parse(message.data);
//       }

//       switch (message.type) {
//         case PlayerEventType.LoginOrCreate:
//           const player = this.loginPlayer(message.data as PlayerLoginData, ws);
//           this.clients[id]!.player = player;
//           ws.send(
//             JSON.stringify({
//               type: PlayerEventType.LoginOrCreate,
//               data: JSON.stringify(this.getPlayerRegData(player)),
//               id: 0,
//             }),
//           );
//           ws.send(
//             JSON.stringify({
//               type: PlayerEventType.WinnerUpdate,
//               data: JSON.stringify([]),
//               id: 0,
//             }),
//           );
//           ws.send(
//             JSON.stringify({
//               type: RoomEventType.Update,
//               data: JSON.stringify([]),
//               id: 0,
//             }),
//           );
//           break;
//         case RoomEventType.CreateNew:
//           this.createRoom();
//           const data = this.rooms.map((room) => ({
//             roomId: room.id,
//             roomUsers: room.users,
//           }));

//           ws.send(
//             JSON.stringify({
//               type: RoomEventType.Update,
//               data: JSON.stringify(data),
//               id: 0,
//             }),
//           );
//           break;
//         case RoomEventType.AddUser:
//           this.addUserToRoom(message.data as ClientAddUserToRoomData, id);
//       }
//     });
//   }

//   private loginPlayer(loginData: PlayerLoginData, ws): Player {
//     const player = new Player(loginData, this.players.size, ws);
//     this.players.push(player);
//     return player;
//   }

//   private getPlayerRegData(player: Player): ServerRegData {
//     return {
//       name: player.name,
//       index: player.index,
//       error: false,
//       errorText: '',
//     };
//   }

//   private createRoom(): Room {
//     const room = new Room();
//     this.rooms.push(room);
//     return room;
//   }

//   private addUserToRoom(data: ClientAddUserToRoomData, id: string) {
//     const room = this.rooms.find((room) => room.id === data.indexRoom);
//     room?.users.push(this.clients[id]!.player);
//     console.log(room);
//   }
// }
