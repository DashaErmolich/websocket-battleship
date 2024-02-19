import { RawData } from "ws";
import { WSMessage } from "../models/message.model";
import { ClientData } from "../models/client-data.model";
import { ServerData } from "../models/server-data.model";

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