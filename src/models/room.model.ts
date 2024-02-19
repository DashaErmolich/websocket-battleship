import { RoomUser } from './player.model';

export interface GameRoom {
  id: string;
  users: RoomUser[];
}
