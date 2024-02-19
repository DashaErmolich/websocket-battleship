export enum PlayerEventType {
  LoginOrCreate = 'reg',
  WinnerUpdate = 'update_winners',
}

export enum RoomEventType {
  CreateNew = 'create_room',
  AddUser = 'add_user_to_room',
  CreateGame = 'create_game',
  Update = 'update_room',
}

export enum ShipsEventType {
  Add = 'add_ships',
  StartGame = 'start_game',
}

export enum GameEventType {
  Attack = 'attack',
  RandomAttack = 'randomAttack',
  Turn = 'turn',
  Finish = 'finish',
}

export type EventType = PlayerEventType | RoomEventType | ShipsEventType | GameEventType;