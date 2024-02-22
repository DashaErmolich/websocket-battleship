import { WebSocket } from 'ws';
import { ClientAttackData, Ship } from '../models/client-data.model';
import { GameRoom } from '../models/room.model';
import { AttackStatus } from '../enums/attack-status.enum';
import { GridCell } from '../enums/grid-cell.enum';
import { setCellValue } from '../utils/utils';

interface GameShip extends Ship {
  isAlive: boolean;
}

interface GamePlayer {
  index?: number;
  ws?: WebSocket;
  ships: GameShip[] | null;
  grid: GridCell[][] | null;
}

export class Game {
  id: number;
  room: GameRoom;
  players: GamePlayer[] = [];

  constructor(room: GameRoom, index: number) {
    this.id = index;
    this.room = room;
    this.players = [
      {
        index: room.players[0]?.index,
        ws: room.players[0]?.ws,
        ships: null,
        grid: null,
      },
      {
        index: room.players[1]?.index,
        ws: room.players[1]?.ws,
        ships: null,
        grid: null,
      },
    ];
  }

  setGameShips(ships: Ship[], playerIndex: number): void {
    const player = this.players.find((v) => v.index === playerIndex);

    if (player) {
      player.ships = [...ships].map((v) => ({ ...v, isAlive: true }));
      player.grid = this.fillGrid(player.ships);
    }
  }

  isReady(): boolean {
    return this.players.every((v) => v.ships !== null);
  }

  checkAttack(data: ClientAttackData) {
    // const current = this.players.find((pl) => pl.index === data.indexPlayer);
    const opponent = this.players.find((pl) => pl.index !== data.indexPlayer);

    let status = AttackStatus.Miss;

    if (opponent && opponent.grid) {
      const targetPosition = { x: data.x, y: data.y };

      if (
        opponent.grid[targetPosition.y]![targetPosition.x] === GridCell.Ship
      ) {
        status = AttackStatus.Shot;
        if (this.isKilled(opponent.grid, targetPosition)) {
          status = AttackStatus.Killed;
        }
      }
    }

    return status;
  }

  createGrid<T>(filler: T, size = 10): T[][] {
    return Array.from(new Array(size), () =>
      Array.from(new Array(size), () => filler),
    );
  }

  private fillGrid(data: Ship[]) {
    const grid = this.createGrid<GridCell>(GridCell.Empty);

    for (let i = 0; i < data.length; i++) {
      const ship = data[i];

      if (ship) {
        setCellValue(grid, ship.position.y, ship.position.x);

        for (let j = 1; j < ship.length; j++) {
          if (ship.direction) {
            //down
            setCellValue(grid, ship.position.y + j, ship.position.x);
          } else {
            // right
            setCellValue(grid, ship.position.y, ship.position.x + j);
          }
        }
      }
    }

    return grid;
  }

  private isKilled(
    grid: GridCell[][],
    target: {
      x: number;
      y: number;
    },
  ): boolean {
    const up = grid[target.y - 1] ? grid[target.y - 1]![target.x] : undefined;
    const down = grid[target.y + 1] ? grid[target.y + 1]![target.x] : undefined;
    const left = grid[target.y]![target.x - 1];
    const right = grid[target.y]![target.x + 1];

    const checkData = [up, down, left, right].filter((v) => v !== undefined);
    return checkData.every((v) => v !== GridCell.Ship);

    // return [
    //   grid[target.y + 1]![target.x],
    //   grid[target.y - 1]![target.x],
    //   grid[target.y]![target.x + 1],
    //   grid[target.y]![target.x - 1],
    // ].every((v) => v !== GridCell.Ship);
  }
}
