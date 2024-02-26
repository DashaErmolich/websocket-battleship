import { GamePlayer } from './player.model';

export interface GameRoom {
  index: number;
  players: GamePlayer[];
}
