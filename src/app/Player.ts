import { WebSocket } from 'ws';
import { GamePlayer, PlayerLoginData } from '../models/player.model';

export class Player implements GamePlayer {
  name: string;
  password: string;
  index: number;
  wins: number;
  ws: WebSocket;

  constructor(data: PlayerLoginData, index: number, ws: WebSocket) {
    this.name = data.name;
    this.password = data.password;
    this.index = index;
    this.wins = 0;
    this.ws = ws;
  }
}
