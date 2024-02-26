import { RawData, WebSocket, WebSocketServer } from 'ws';
import { Player } from './Player';
import {
  getMessage,
  getSize,
  getUUID,
  isPlayerInRoom,
  mapAttackResults,
  mapRooms,
  mapWinners,
  parseRawData,
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
  ServerFinishData,
  ServerRegData,
  ServerStartGameData,
  ServerTurnData,
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

  rooms: AppData<Room>;

  games: Game[];

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = {};
    this.rooms = {};
    this.games = [];
  }

  public start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = getUUID();

      ws.on('error', console.error);

      ws.on('close', () => {
        this.deleteClient(clientId);
      });

      ws.on('message', (rawData: RawData) => {
        const msg: WSMessage = parseRawData(rawData);
        const player: Player | undefined = this.getPlayer(clientId);

        switch (msg.type) {
          case EventType.LoginOrCreate:
            this.registerPlayer(msg.data as ClientRegData, clientId, ws);
            this.updateRooms();
            this.updateWinners();

            break;
          case EventType.CreateRoom: {
            const room = this.createRoom();
            if (player) {
              this.addPlayerToRoom(room, { ...player });
              this.updateRooms();
            }
            break;
          }
          case EventType.AddUserToRoom: {
            const roomId = (msg.data as ClientAddUserToRoomData).indexRoom;
            const room = this.getRoom(roomId);

            if (room && player && !isPlayerInRoom(room.players, player.index)) {
              this.addPlayerToRoom(room, { ...player });
              this.createGame(room);
              this.deleteRoom(room.index);
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
                game.setNextPlayerIndex(data.indexPlayer);
                this.startGame(game, data);
                this.turn(game);
              }
            }
            break;
          }
          case EventType.Attack:
          case EventType.RandomAttack: {
            const data = msg.data as ClientAttackData;
            const game = this.getGame(data.gameId);

            if (
              player &&
              game &&
              game.currentPlayerIndex === data.indexPlayer
            ) {
              if (data.x === undefined && data.y === undefined) {
                const randomCoordinates = game.getRandomCellCoordinates(
                  data.indexPlayer,
                );
                data.x = randomCoordinates.x;
                data.y = randomCoordinates.y;
              }

              this.attack(game, data, player);
            }
            break;
          }
          // case EventType.SinglePlay: {
          //   const room = this.createRoom();
          //   this.addPlayerToRoom(room, clientId);
          //   const game = this.createGame(room);
          //   const BOT_INDEX = 9999;
          //   game.setBotIndex(BOT_INDEX);
          //   game.setGameShips(OPPONENT_PLAYER_SHIPS, BOT_INDEX);
          //   // TODO
          //   const botAttack: ClientAttackData = getBotAttack(
          //     game.id,
          //     BOT_INDEX,
          //   );

          //   ws.emit(
          //     'message',
          //     this.getMessage<ClientAttackData>(EventType.Attack, botAttack),
          //   );
          // }
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
    this.setRoom(room.index, room);
    return room;
  }

  private addPlayerToRoom(room: Room, player: Player): void {
    room.addPlayer(player);
  }

  private sendMessage<T>(ws: WebSocket, event: EventType, data: T): void {
    ws.send(getMessage<T>(event, data));
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

  private broadcastGamePlayers<T>(
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

  private createGame(room: Room): Game {
    const game = new Game({ ...room }, getSize(this.games));
    this.games.push(game);

    game.players.forEach((pl: Player) => {
      this.sendMessage<ServerCreateGameData>(pl.ws, EventType.CreateGame, {
        idGame: game.id,
        idPlayer: pl.index,
      });
    });

    return game;
  }

  private getGame(gameId: number): Game | undefined {
    return this.games.find((game) => game.id === gameId);
  }

  private startGame(game: Game, clientData: ClientAddShipsData) {
    this.broadcastGamePlayers<ServerStartGameData>(
      game.players,
      EventType.StartGame,
      {
        ships: clientData.ships,
        currentPlayerIndex: clientData.indexPlayer,
      },
    );
  }

  private turn(game: Game) {
    this.broadcastGamePlayers<ServerTurnData>(game.players, EventType.Turn, {
      currentPlayer: game.currentPlayerIndex!, //TODO
    });
  }

  private attack(game: Game, data: ClientAttackData, player: Player) {
    const result = game.checkAttack(data);
    if (result !== null) {
      mapAttackResults(result, data.indexPlayer).forEach((res) => {
        this.sendMessage<ServerAttackData>(player.ws, EventType.Attack, res);
      });

      this.checkWinner(game, player);
    }
  }

  private checkWinner(game: Game, player: Player) {
    const winnerIndex = game.getWinnerIndex();
    if (winnerIndex === null) {
      this.turn(game);
    } else {
      this.finishGame(game, winnerIndex, player);
    }
  }

  private finishGame(game: Game, winnerIndex: number, player: Player): void {
    this.broadcastGamePlayers<ServerFinishData>(
      game.players,
      EventType.Finish,
      {
        winPlayer: winnerIndex,
      },
    );
    this.incrementPlayerWins(player);
    this.updateWinners();
  }

  private deleteClient(clientId: string): void {
    delete this.clients[clientId];
  }

  private setRoom(roomId: number, room: Room): void {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = room;
    }
  }

  private getPlayer(id: string): Player | undefined {
    return this.clients[id];
  }

  private getRoom(id: number): Room | undefined {
    return this.rooms[id];
  }

  private deleteRoom(roomIndex: number): void {
    delete this.rooms[roomIndex];
  }

  private incrementPlayerWins(player: Player) {
    player.wins += 1;
  }
}
