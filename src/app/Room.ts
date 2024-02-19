import { RoomUser } from '../models/player.model';
import { GameRoom } from '../models/room.model';

export class Room implements GameRoom {
  id: string;
  users: RoomUser[] = [];

  constructor() {
    this.id = crypto.randomUUID();
  }
}
