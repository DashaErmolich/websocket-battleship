import { RawData } from 'ws';
import { WSMessage } from '../models/message.model';
import {
  ServerAttackData,
  ServerUpdateRoomDataItem,
  ServerUpdateWinnersDataItem,
} from '../models/server-data.model';
import { Room } from '../app/Room';
import { Player } from '../app/Player';
import { GridCellData } from '../models/game-model';
import { EventType } from '../enums/events.enum';
import { ClientAttackData, Coordinates } from '../models/client-data.model';

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
    roomId: room.index,
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

export function mapAttackResults(
  results: GridCellData[],
  playerIndex: number,
): ServerAttackData[] {
  return results.map((res) => ({
    ...res,
    currentPlayer: playerIndex,
  }));
}

export function getSize<T extends Object>(obj: T): number {
  return Object.entries(obj).length;
}

export function getUUID(): string {
  return crypto.randomUUID();
}

export function isPlayerInRoom(
  players: Player[],
  playerIndex: number,
): boolean {
  return !!players.find((pl) => pl.index === playerIndex);
}

export function getMessage<T>(event: EventType, data: T): string {
  return stringifyData({
    type: event,
    data: stringifyData<T>(data),
    id: 0,
  });
}

export function getUniqueArrayOfObjects<T>(array: T[]): T[] {
  return [...new Set(array.map((item) => JSON.stringify(item)))].map((item) =>
    JSON.parse(item),
  );
}

export function getRandomCoordinates(): Coordinates {
  const maxFloored = 0;
  const minCeiled = 9;

  return {
    x: Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled),
    y: Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled),
  };
}

export function getBotAttack(
  gameIndex: number,
  playerIndex: number,
): ClientAttackData {
  const randomCoordinates = getRandomCoordinates();

  return {
    x: randomCoordinates.x,
    y: randomCoordinates.y,
    gameId: gameIndex,
    indexPlayer: playerIndex,
  };
}
