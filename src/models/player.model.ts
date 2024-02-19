import { WebSocket } from "ws";

export interface PlayerLoginData {
  name: string;
  password: string;
}

export interface GamePlayer extends PlayerLoginData {
  index: number;
  wins: number;
  ws: WebSocket;
}
// export type RoomUser = Pick<GamePlayer, 'name' | 'index'>;
