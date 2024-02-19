import { Ships } from './client-data.model';

export interface ServerRegData {
  name: string;
  index: number;
  error: boolean;
  errorText: string;
}

export interface ServerUpdateWinnersDataItem {
  name: string;
  wins: number;
}

export interface ServerCreateGameData {
  idGame: number;
  idPlayer: number;
}

export interface ServerUpdateRoomDataItem {
  roomId: number;
  roomUsers: {
    name: string;
    index: number;
  }[];
}

export interface ServerStartGameData {
  ships: Ships[];
  currentPlayerIndex: number;
}

export interface ServerAttackData {
  position: {
    x: number;
    y: number;
  };
  currentPlayer: number;
  status: 'miss' | 'killed' | 'shot';
}

export interface ServerTurnData {
  currentPlayer: number;
}

export interface ServerFinishData {
  winPlayer: number;
}

export type ServerData =
  | ServerRegData
  | ServerUpdateWinnersDataItem[]
  | ServerCreateGameData
  | ServerUpdateRoomDataItem[]
  | ServerStartGameData
  | ServerAttackData
  | ServerTurnData
  | ServerFinishData;
