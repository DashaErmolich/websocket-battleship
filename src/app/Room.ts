import { GamePlayer } from '../models/player.model';
import { GameRoom } from '../models/room.model';

export class Room implements GameRoom {
  id: number;
  users: GamePlayer[] = [];

  constructor(index: number) {
    this.id = index;
  }

  addUser(user: GamePlayer): void {
    this.users.push(user);
  }
}
