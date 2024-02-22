import { Ship } from '../models/client-data.model';

export function checkAttack(
  current: Ship[],
  opponent: Ship[],
  attack: {
    x: number;
    y: number;
    gameId: number;
    indexPlayer: number;
  },
) {
  let attackStatus: AttackStatus = AttackStatus.Miss;

  const index = opponent.findIndex(
    (ship) => ship.position.x === attack.x && ship.position.y === attack.y,
  );

  if (index === -1) {
    attackStatus = AttackStatus.Miss;
  } else {
  }

  return attackStatus;
}
