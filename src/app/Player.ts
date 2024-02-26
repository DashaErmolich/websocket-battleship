import { WebSocket } from 'ws';
import { GamePlayer, PlayerLoginData } from '../models/player.model';
import { Ship } from '../models/client-data.model';
import { GameGrid, GameShipData } from '../models/game-model';

export class Player implements GamePlayer {
  name: string;
  password: string;
  index: number;
  wins: number;
  ws: WebSocket;
  grid: GameGrid | null;
  points: number;
  ships: Ship[] | null;
  shipsData: GameShipData[] | null;

  constructor(data: PlayerLoginData, index: number, ws: WebSocket) {
    this.name = data.name;
    this.password = data.password;
    this.index = index;
    this.wins = 0;
    this.ws = ws;
    this.grid = null;
    this.points = 0;
    this.ships = null;
    this.shipsData = null;
  }
}
