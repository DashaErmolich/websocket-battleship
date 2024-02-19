import { RawData, WebSocket, WebSocketServer } from 'ws';
import { GamePlayer, PlayerLoginData } from '../models/player.model';
import { Player } from '../app/Player';
import { mapRooms, parseRawData, stringifyData } from '../utils/utils';
import {
  GameEventType,
  PlayerEventType,
  RoomEventType,
} from '../enums/events.enum';
import { GameRoom } from '../models/room.model';
import { Room } from '../app/Room';
import { ClientAddUserToRoomData } from '../models/client-data.model';
import { Game } from '../app/Game';
import { ServerCreateGameData, ServerUpdateRoomDataItem } from '../models/server-data.model';

const PORT = Number(process.env.PORT) || 3000;

export const wss = new WebSocketServer(
  {
    port: PORT,
  },
  () => console.log(`Start websocket server started on the ${PORT} port!`),
);

interface Client {
  id: string;
  player: GamePlayer;
}

const connections: Client[] = [];

const rooms: Room[] = [];

const games: Game[] = [];

wss.on('connection', function connection(ws) {
  ws.on('error', console.error);

  const clientId = crypto.randomUUID();

  ws.on('message', function message(data: RawData) {
    console.log('received: %s', data);

    const msg = parseRawData(data);

    switch (msg.type) {
      case PlayerEventType.LoginOrCreate:
        connections.push({
          id: clientId,
          player: new Player(
            msg.data as PlayerLoginData,
            connections.length,
            ws,
          ),
        });

        console.log(connections);

        ws.send(
          stringifyData({
            type: PlayerEventType.LoginOrCreate,
            data: stringifyData(data),
            id: 0,
          }),
        );
        ws.send(
          stringifyData({
            type: PlayerEventType.WinnerUpdate,
            data: stringifyData([]),
            id: 0,
          }),
        );

        ws.send(
          stringifyData({
            type: RoomEventType.Update,
            data: stringifyData<ServerUpdateRoomDataItem[]>(mapRooms(rooms)),
            id: 0,
          }),
        );
        break;
      case RoomEventType.CreateNew:
        const newRoom = new Room(rooms.length);
        const currentUser = connections.find(
          (item) => item.id === clientId,
        )?.player;

        if (currentUser) {
          newRoom.addUser(currentUser);
          rooms.push(newRoom);

          ws.send(
            stringifyData({
              type: RoomEventType.Update,
              data: stringifyData<ServerUpdateRoomDataItem[]>(mapRooms(rooms)),
              id: 0,
            }),
          );
        }
        break;
      case RoomEventType.AddUser:
        const user = connections.find((item) => item.id === clientId)?.player;
        console.log(user);
        const roomId = (msg.data as ClientAddUserToRoomData).indexRoom;
        const room = rooms.find((item) => item.id === roomId);

        if (user && room && !room.users.includes(user)) {
          room.users.push(user);
          const game = new Game(room, games.length);

          game.room.users.forEach((user) => {
            const client = connections.find((v) => v.player.index === user.index);
            client?.player.ws.send(
              stringifyData({
                type: RoomEventType.CreateGame,
                data: stringifyData<ServerCreateGameData>({
                  idGame: game.id,
                  idPlayer: user.index,
                }),
                id: 0,
              }),
            )
          })

          ws.send(
            stringifyData({
              type: RoomEventType.Update,
              data: stringifyData<ServerUpdateRoomDataItem[]>(mapRooms(rooms)),
              id: 0,
            }),
          );
        }
    }
  });
});
