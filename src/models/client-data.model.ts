export interface ClientRegData {
  name: string;
  password: string;
}

export interface ClientCreateRoomData {
  data: string;
  id: number;
}

export interface ClientAddUserToRoomData {
  indexRoom: string;
}

export interface Ships {
  position: {
    x: number;
    y: number;
  };
  direction: boolean;
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}

export interface ClientAddShipsData {
  gameId: number;
  ships: Ships[];
  indexPlayer: number;
}

export interface ClientAttack {
  gameId: number;
  x: number;
  y: number;
  indexPlayer: number;
}

export interface ClientRandomAttack {
  gameId: number;
  indexPlayer: number;
}

export type ClientData =
  | ClientRegData
  | ClientCreateRoomData
  | ClientAddUserToRoomData
  | ClientAddShipsData
  | ClientAttack
  | ClientRandomAttack;
