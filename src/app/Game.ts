import { GamePlayer, PlayerLoginData } from '../models/player.model';
import { ClientAddUserToRoomData } from '../models/client-data.model';
import { GameRoom } from '../models/room.model';
import { Player } from './Player';
import { Room } from './Room';

export class Game {
  id: number;
  room: GameRoom;

  constructor(room: GameRoom, index: number) {
    this.id = index;
    this.room = room;
  }
}
