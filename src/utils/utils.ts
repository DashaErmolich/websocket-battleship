import { RawData } from 'ws';
import { WSMessage } from '../models/message.model';
import { ClientData } from '../models/client-data.model';
import {
  ServerData,
  ServerUpdateRoomDataItem,
} from '../models/server-data.model';
import { Room } from '../app/Room';

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
    roomUsers: room.users.map((user) => ({ name: user.name, index: user.index })),
  }));
}
