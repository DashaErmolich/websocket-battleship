import {
  EventType,
} from '../enums/events.enum';
import { ClientData } from './client-data.model';
import { ServerData } from './server-data.model';

export interface WSMessage {
  type: EventType;
  data: ClientData | ServerData;
  id: 0;
}
