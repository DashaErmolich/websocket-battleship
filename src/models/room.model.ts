import { Player } from "../app/Player";
import { GamePlayer } from "./player.model";

export interface GameRoom {
  id: number;
  users: GamePlayer[];
}
