import { GamePlayer } from '../models/player.model';
import { GameRoom } from '../models/room.model';

export class Room implements GameRoom {
  index: number;
  players: GamePlayer[] = [];

  constructor(index: number) {
    this.index = index;
  }

  addPlayer(player: GamePlayer): void {
    this.players.push(player);
  }
}
