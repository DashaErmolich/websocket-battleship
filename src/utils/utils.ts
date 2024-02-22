import { RawData } from 'ws';
import { WSMessage } from '../models/message.model';
import {
  ServerUpdateRoomDataItem,
  ServerUpdateWinnersDataItem,
} from '../models/server-data.model';
import { Room } from '../app/Room';
import { Player } from '../app/Player';
import { GridCell } from '../enums/grid-cell.enum';

export function parseRawData(raw: RawData): WSMessage {
  const msg: WSMessage = JSON.parse(raw.toString());

  if (msg.data && typeof msg.data === 'string') {
    msg.data = JSON.parse(msg.data);
  }

  return msg;
}

export function stringifyData<T>(data: T): string {
  return JSON.stringify(data);
}

export function mapRooms(rooms: Room[]): ServerUpdateRoomDataItem[] {
  return rooms.map((room) => ({
    roomId: room.id,
    roomUsers: room.players.map((user) => ({
      name: user.name,
      index: user.index,
    })),
  }));
}

export function mapWinners(players: Player[]): ServerUpdateWinnersDataItem[] {
  return players.map((player) => ({
    name: player.name,
    wins: player.wins,
  }));
}

export function getSize<T extends Object>(obj: T): number {
  return Object.entries(obj).length;
}

export function setCellValue(
  grid: string[][],
  y: number,
  x: number,
  value: GridCell,
) {
  grid[y]![x] = value;
}
