import { WebSocket } from 'ws';
import { Ship } from './client-data.model';
import { GameGrid } from './game-model';

export interface PlayerLoginData {
  name: string;
  password: string;
}

export interface GamePlayer extends PlayerLoginData {
  index: number;
  wins: number;
  ws: WebSocket;
  ships: Ship[] | null;
  grid: GameGrid | null;
  points: number;
}
