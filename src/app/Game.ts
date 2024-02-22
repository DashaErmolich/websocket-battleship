import { WebSocket } from 'ws';
import {
  ClientAttackData,
  Coordinates,
  Ship,
} from '../models/client-data.model';
import { GameRoom } from '../models/room.model';
import { AttackStatus } from '../enums/attack-status.enum';
import { GridCell } from '../enums/grid-cell.enum';
import { setCellValue } from '../utils/utils';
import { ServerAttackData } from '../models/server-data.model';
import { Direction } from '../enums/direction-enum';

type CellData = Omit<ServerAttackData, 'currentPlayer'>;

interface CellNeighbors {
  direction: Direction;
  value: GridCell | undefined;
}

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
  currentPlayerIndex: number | null;

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
    this.currentPlayerIndex = null;
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

  checkAttack(data: ClientAttackData): CellData[] | null {
    const opponent = this.players.find((pl) => pl.index !== data.indexPlayer);

    let attackResult: CellData | null = null;

    if (opponent && opponent.grid) {
      const targetPosition = { x: data.x, y: data.y };
      const targetCell = opponent.grid[targetPosition.y]![targetPosition.x];

      if (targetCell === GridCell.Shot || targetCell === GridCell.Miss) {
        return null;
      }

      if (targetCell === GridCell.Ship) {
        attackResult = {
          status: AttackStatus.Shot,
          position: targetPosition,
        };

        setCellValue(opponent.grid, data.y, data.x, GridCell.Shot);

        if (this.isKilled(opponent.grid, targetPosition)) {
          const attackResult: CellData[] = this.getResults(
            opponent.grid,
            targetPosition,
          );

          attackResult.forEach((res) => {
            setCellValue(
              opponent.grid!,
              res.position.y,
              res.position.x,
              res.status === AttackStatus.Killed
                ? GridCell.Shot
                : GridCell.Miss,
            );
          });

          return attackResult;
        }
      } else {
        attackResult = {
          status: AttackStatus.Miss,
          position: targetPosition,
        };

        setCellValue(opponent.grid, data.y, data.x, GridCell.Miss);
      }
      return [attackResult];
    }
    return null;
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
        setCellValue(grid, ship.position.y, ship.position.x, GridCell.Ship);

        for (let j = 1; j < ship.length; j++) {
          if (ship.direction) {
            //down
            setCellValue(
              grid,
              ship.position.y + j,
              ship.position.x,
              GridCell.Ship,
            );
          } else {
            // right
            setCellValue(
              grid,
              ship.position.y,
              ship.position.x + j,
              GridCell.Ship,
            );
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
    const checkData = this.getNeighbors(grid, target).filter(
      (v) => v.value !== undefined,
    );
    return checkData.every((v) => v.value !== GridCell.Ship);
  }

  private getResults(grid: GridCell[][], target: Coordinates) {
    const neighbors: CellNeighbors[] = this.getNeighbors(grid, target);

    const direction: boolean = neighbors
      .filter((v) => v.value === GridCell.Shot)
      .some(
        (v) => v.direction === Direction.Up || v.direction === Direction.Down,
      );

    let data: GridCell[];

    if (direction) {
      // full column
      data = this.getGridColumn(grid, target.x);
    } else {
      //full row
      data = this.getGridRow(grid, target.y);
    }

    let res: CellData[] = [];

    // ship cells
    for (let i = 0; i < data.length; i++) {
      if (data[i] === GridCell.Shot) {
        const shipCell: CellData = {
          position: direction ? { x: target.x, y: i } : { x: i, y: target.y }, // column : row
          status: AttackStatus.Killed,
        };

        res.push(shipCell);

        const shipNeighbors: CellData[] = this.getNeighbors(
          grid,
          shipCell.position,
        )
          .filter(
            (v) => v.value === GridCell.Empty || v.value === GridCell.Miss,
          )
          .map((v) => {
            let position: Coordinates;
            switch (v.direction) {
              case Direction.Left:
                position = {
                  x: shipCell.position.x - 1,
                  y: shipCell.position.y,
                };
                break;
              case Direction.Right:
                position = {
                  x: shipCell.position.x + 1,
                  y: shipCell.position.y,
                };
                break;
              case Direction.Up:
                position = {
                  x: shipCell.position.x,
                  y: shipCell.position.y - 1,
                };
                break;
              case Direction.Down:
                position = {
                  x: shipCell.position.x,
                  y: shipCell.position.y + 1,
                };
                break;
              case Direction.UpLeft:
                position = {
                  x: shipCell.position.x - 1,
                  y: shipCell.position.y - 1,
                };
                break;
              case Direction.UpRight:
                position = {
                  x: shipCell.position.x + 1,
                  y: shipCell.position.y - 1,
                };
                break;
              case Direction.DownLeft:
                position = {
                  x: shipCell.position.x - 1,
                  y: shipCell.position.y + 1,
                };
                break;
              case Direction.DownRight:
                position = {
                  x: shipCell.position.x + 1,
                  y: shipCell.position.y + 1,
                };
                break;
            }
            const emptyCell: CellData = {
              position: { ...position },
              status: AttackStatus.Miss,
            };
            return emptyCell;
          });

        res = [...res, ...shipNeighbors];
      }
    }

    const set: CellData[] = [...new Set(res.map((v) => JSON.stringify(v)))].map(
      (v) => JSON.parse(v),
    );

    console.log(set);
    return set;
  }

  private getNeighbors(
    grid: GridCell[][],
    target: Coordinates,
  ): CellNeighbors[] {
    return [
      {
        direction: Direction.Up,
        value: grid[target.y - 1] ? grid[target.y - 1]![target.x] : undefined,
      },
      {
        direction: Direction.Down,
        value: grid[target.y + 1] ? grid[target.y + 1]![target.x] : undefined,
      },
      {
        direction: Direction.Left,
        value: grid[target.y]![target.x - 1],
      },
      {
        direction: Direction.Right,
        value: grid[target.y]![target.x + 1],
      },
      {
        direction: Direction.UpLeft,
        value: grid[target.y - 1]
          ? grid[target.y - 1]![target.x - 1]
          : undefined,
      },
      {
        direction: Direction.UpRight,
        value: grid[target.y - 1]
          ? grid[target.y - 1]![target.x + 1]
          : undefined,
      },
      {
        direction: Direction.DownLeft,
        value: grid[target.y + 1]
          ? grid[target.y + 1]![target.x - 1]
          : undefined,
      },
      {
        direction: Direction.DownRight,
        value: grid[target.y + 1]
          ? grid[target.y + 1]![target.x + 1]
          : undefined,
      },
    ];
  }

  getGridColumn(grid: GridCell[][], columnIndex: number): GridCell[] {
    return grid.map((row) => row[columnIndex]!);
  }

  getGridRow(grid: GridCell[][], rowIndex: number): GridCell[] {
    return grid[rowIndex]!;
  }

  getUpCell(grid: GridCell[][], target: Coordinates): GridCell | undefined {
    return grid[target.y - 1] ? grid[target.y - 1]![target.x] : undefined;
  }

  getDownCell(grid: GridCell[][], target: Coordinates): GridCell | undefined {
    return grid[target.y + 1] ? grid[target.y + 1]![target.x] : undefined;
  }

  getLeftCell(grid: GridCell[][], target: Coordinates): GridCell | undefined {
    return grid[target.y]![target.x - 1];
  }

  getRightCell(grid: GridCell[][], target: Coordinates): GridCell | undefined {
    return grid[target.y]![target.x + 1];
  }

  changeCurrentPlayer(playerIndex: number): void {
    const nextPlayerIndex = this.players.find(
      (pl) => pl.index !== playerIndex,
    )?.index;
    if (nextPlayerIndex !== undefined) {
      this.currentPlayerIndex = nextPlayerIndex;
    }
  }
}
