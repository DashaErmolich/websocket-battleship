import { GamePlayer } from '../models/player.model';
import { GameRoom } from '../models/room.model';

export class Room implements GameRoom {
  id: number;
  players: GamePlayer[] = [];

  constructor(index: number) {
    this.id = index;
  }

  addPlayer(player: GamePlayer): void {
    this.players.push(player);
  }
}
