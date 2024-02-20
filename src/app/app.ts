import { RawData, WebSocket, WebSocketServer } from 'ws';
import { Player } from './Player';
import {
  getSize,
  mapRooms,
  mapWinners,
  parseRawData,
  stringifyData,
} from '../utils/utils';
import { WSMessage } from '../models/message.model';
import { EventType } from '../enums/events.enum';
import {
  ClientAddShipsData,
  ClientAddUserToRoomData,
  ClientRegData,
} from '../models/client-data.model';
import {
  ServerCreateGameData,
  ServerRegData,
  ServerStartGameData,
  ServerUpdateRoomDataItem,
  ServerUpdateWinnersDataItem,
} from '../models/server-data.model';
import { Room } from './Room';
import { Game } from './Game';

export interface AppData<T> {
  [id: string]: T;
}

export class App {
  wss: WebSocketServer;

  clients: AppData<Player>;

  rooms: Room[];

  games: Game[];

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = {};
    this.rooms = [];
    this.games = [];
  }

  public start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = crypto.randomUUID();

      ws.on('message', (rawData: RawData) => {
        const msg: WSMessage = parseRawData(rawData);

        switch (msg.type) {
          case EventType.LoginOrCreate:
            this.registerPlayer(msg.data as ClientRegData, clientId, ws);
            this.updateRooms();
            this.updateWinners();

            break;
          case EventType.CreateRoom: {
            const room = this.createRoom();
            this.addPlayerToRoom(room, clientId);
            this.updateRooms();
            break;
          }
          case EventType.AddUserToRoom: {
            const roomId = (msg.data as ClientAddUserToRoomData).indexRoom;
            const room = this.rooms.find((room) => room.id === roomId);
            const player = this.clients[clientId];
            if (room && player && !room.players.includes(player)) {
              this.addPlayerToRoom(room, clientId);
              this.createGame(room, player.index);
              this.updateRooms();
            }
            break;
          }
          case EventType.AddShips: {
            const data = msg.data as ClientAddShipsData;
            const game = this.getGame(data.gameId);
            if (game) {
              game.prepare();

              if (game.isReady()) {
                this.startGame(game, data);
              }
            }
          }
        }
      });
    });
  }

  private registerPlayer(data: ClientRegData, id: string, ws: WebSocket): void {
    if (!this.clients[id]) {
      const player: Player = new Player(data, getSize(this.clients), ws);
      this.clients[id] = player;

      this.sendMessage<ServerRegData>(ws, EventType.LoginOrCreate, {
        name: player.name,
        index: player.index,
        error: false,
        errorText: '',
      });
    }
  }

  private createRoom(): Room {
    const room = new Room(getSize(this.rooms));
    this.rooms.push(room);
    return room;
  }

  private addPlayerToRoom(room: Room, clientId: string): void {
    const client = this.clients[clientId];
    if (client) {
      room.addPlayer(client);
    }
  }

  private sendMessage<T>(ws: WebSocket, event: EventType, data: T): void {
    ws.send(
      stringifyData({
        type: event,
        data: stringifyData<T>(data),
        id: 0,
      }),
    );
  }

  private updateRooms() {
    const data: ServerUpdateRoomDataItem[] = mapRooms(this.getAvailableRooms());
    this.broadcastAll<ServerUpdateRoomDataItem[]>(EventType.UpdateRoom, data);
  }

  private updateWinners() {
    const data: ServerUpdateWinnersDataItem[] = mapWinners(this.getWinners());
    this.broadcastAll<ServerUpdateWinnersDataItem[]>(EventType.WinnerUpdate, data);
  }

  private broadcastAll<T>(event: EventType, data: T) {
    this.wss.clients.forEach((ws: WebSocket) => {
      this.sendMessage<T>(ws, event, data);
    });
  }

  private getWinners() {
    return Object.values(this.clients).filter((player) => player.wins > 0);
  }

  private getAvailableRooms() {
    return Object.values(this.rooms).filter((room) => room.players.length < 2);
  }

  private broadcastRoomPlayers<T>(players: Player[], event: EventType, data: T): void {
    players.map((pl) => pl.ws).forEach((ws: WebSocket) => {
      this.sendMessage<T>(ws, event, data);
    });
  }

  private createGame(room: Room, playerIndex: number): void {
    const game = new Game(room, getSize(this.rooms));
    this.games.push(game);
    this.broadcastRoomPlayers<ServerCreateGameData>(room.players, EventType.CreateGame, {
      idGame: game.id,
      idPlayer: playerIndex,
    });
  }

  private getGame(gameId: number): Game | undefined {
    return this.games.find((game) => game.id === gameId);
  }

  private startGame(game: Game, clientData: ClientAddShipsData) {
    this.broadcastRoomPlayers<ServerStartGameData>(game.room.players, EventType.StartGame, {
      ships: clientData.ships,
      currentPlayerIndex: clientData.indexPlayer
    })
  }
}
