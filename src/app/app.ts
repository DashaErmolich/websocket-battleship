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
  ClientAttackData,
  ClientRegData,
} from '../models/client-data.model';
import {
  ServerAttackData,
  ServerCreateGameData,
  ServerRegData,
  ServerStartGameData,
  ServerTurnData,
  ServerUpdateRoomDataItem,
  ServerUpdateWinnersDataItem,
} from '../models/server-data.model';
import { Room } from './Room';
import { CellData, Game } from './Game';
import { AttackStatus } from '../enums/attack-status.enum';

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
              this.createGame(room);
              this.updateRooms();
            }
            break;
          }
          case EventType.AddShips: {
            const data = msg.data as ClientAddShipsData;
            const game = this.getGame(data.gameId);
            if (game) {
              game.setGameShips(data.ships, data.indexPlayer);
              if (game.isReady()) {
                this.startGame(game, data);
                this.turn(game, data);
              }
            }
            break;
          }
          case EventType.Attack: {
            const data = msg.data as ClientAttackData;
            const player = this.clients[clientId];

            const attackResult: ServerAttackData[] = this.attack(data).map(
              (v) => ({
                ...v,
                currentPlayer: player!.index,
              }),
            );

            attackResult.forEach((res: ServerAttackData) => {
              this.sendMessage<ServerAttackData>(ws, EventType.Attack, res);
            });

            // //fo one
            // this.sendMessage<ServerAttackData>(ws, EventType.Attack, {
            //   status: attackResult,
            //   currentPlayer: player!.index,
            //   position: {
            //     x: data.x,
            //     y: data.y,
            //   },
            // });

            // if (attackResult !== AttackStatus.Miss) {
            //   this.turn(this.getGame(data.gameId)!, data);
            // }
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
    this.broadcastAll<ServerUpdateWinnersDataItem[]>(
      EventType.WinnerUpdate,
      data,
    );
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

  private broadcastRoomPlayers<T>(
    players: Player[],
    event: EventType,
    data: T,
  ): void {
    players
      .map((pl) => pl.ws)
      .forEach((ws: WebSocket) => {
        this.sendMessage<T>(ws, event, data);
      });
  }

  private createGame(room: Room): void {
    const game = new Game(room, getSize(this.rooms));
    this.games.push(game);

    room.players.forEach((pl: Player) => {
      this.sendMessage<ServerCreateGameData>(pl.ws, EventType.CreateGame, {
        idGame: game.id,
        idPlayer: pl.index,
      });
    });
  }

  private getGame(gameId: number): Game | undefined {
    return this.games.find((game) => game.id === gameId);
  }

  private startGame(game: Game, clientData: ClientAddShipsData) {
    this.broadcastRoomPlayers<ServerStartGameData>(
      game.room.players,
      EventType.StartGame,
      {
        ships: clientData.ships,
        currentPlayerIndex: clientData.indexPlayer,
      },
    );
  }

  private turn(game: Game, clientData: ClientAddShipsData | ClientAttackData) {
    this.broadcastRoomPlayers<ServerTurnData>(
      game.room.players,
      EventType.Turn,
      {
        currentPlayer: clientData.indexPlayer,
      },
    );
  }

  private attack(data: ClientAttackData): CellData[] {
    const game = this.getGame(data.gameId);
    return game!.checkAttack(data); //TODO
  }
}
