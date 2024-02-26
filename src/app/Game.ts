import {
  ClientAttackData,
  Coordinates,
  Ship,
} from '../models/client-data.model';
import { GameRoom } from '../models/room.model';
import { AttackStatus } from '../enums/attack-status.enum';
import { GridCell } from '../enums/grid-cell.enum';
import { Direction } from '../enums/direction-enum';
import { GamePlayer } from '../models/player.model';
import { GameGrid, GridCellData } from '../models/game-model';
import {
  createGrid,
  getCellCoordinate,
  setCellValue,
} from '../utils/grid-utils';
import { getRandomCoordinates, getUniqueArrayOfObjects } from '../utils/utils';

interface CellNeighbors {
  direction: Direction;
  value: GridCell | undefined;
}

export class Game {
  id: number;
  players: GamePlayer[] = [];
  currentPlayerIndex: number | null;
  private GRID_SIZE = 10;
  private SHIPS_COUNT = 10;

  constructor(room: GameRoom, index: number) {
    this.id = index;
    this.players = [...room.players];
    this.currentPlayerIndex = null;
  }

  public setGameShips(ships: Ship[], playerIndex: number): void {
    const player = this.players.find((v) => v.index === playerIndex);

    if (player) {
      player.ships = [...ships];
      player.grid = this.fillGrid(player.ships, this.GRID_SIZE);
    }
  }

  public isReady(): boolean {
    return this.players.every((v) => v.ships !== null);
  }

  public checkAttack(data: ClientAttackData): GridCellData[] | null {
    const opponent = this.getOpponent(data.indexPlayer);

    if (opponent && opponent.grid) {
      const targetPosition: Coordinates = { x: data.x, y: data.y };
      const targetCell = this.getTargetCell(opponent.grid, targetPosition);

      switch (targetCell) {
        case GridCell.Shot:
        case GridCell.Miss:
          return null;
        case GridCell.Empty:
          this.setNextPlayerIndex(data.indexPlayer);
          return this.getFailureAttackResult(opponent.grid, targetPosition);
        case GridCell.Ship:
          return this.getSuccessAttackResult(
            opponent.grid,
            targetPosition,
            opponent,
          );
      }
    }
    return null;
  }

  private fillGrid(data: Ship[], size: number) {
    const grid = createGrid<GridCell>(GridCell.Empty, size);

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
    grid: GameGrid,
    target: {
      x: number;
      y: number;
    },
  ): boolean {
    const checkData = this.getCellNeighbors(grid, target).filter(
      (v) => v.value !== undefined,
    );
    return checkData.every((v) => v.value !== GridCell.Ship);
  }

  private getResults(grid: GameGrid, target: Coordinates) {
    const neighbors: CellNeighbors[] = this.getCellNeighbors(grid, target);

    const direction: boolean = neighbors
      .filter((v) => v.value === GridCell.Shot)
      .some(
        (v) => v.direction === Direction.Up || v.direction === Direction.Down,
      );

    const data: GridCell[] = direction
      ? this.getGridColumn(grid, target.x)
      : this.getGridRow(grid, target.y);

    const shipWithNeighbors: GridCellData[] = this.getShipWithNeighbors(
      data,
      direction,
      target,
      grid,
    );

    return getUniqueArrayOfObjects<GridCellData>(shipWithNeighbors);
  }

  private getCellNeighbors(
    grid: GameGrid,
    target: Coordinates,
  ): CellNeighbors[] {
    return Object.values(Direction).map((dir) => ({
      direction: dir,
      value: this.getCell(grid, target, dir),
    }));
  }

  private getGridColumn(grid: GameGrid, columnIndex: number): GridCell[] {
    return grid.map((row) => row[columnIndex]!);
  }

  private getGridRow(grid: GameGrid, rowIndex: number): GridCell[] {
    return grid[rowIndex]!;
  }

  private getCell(
    grid: GameGrid,
    target: Coordinates,
    position?: Direction,
  ): GridCell | undefined {
    const coordinate = getCellCoordinate(target, position);
    const row: GridCell[] | undefined = grid[coordinate.y];

    if (row !== undefined) {
      return row[coordinate.x];
    }

    return undefined;
  }

  public setNextPlayerIndex(playerIndex: number): void {
    const nextPlayerIndex = this.getOpponent(playerIndex)?.index;
    if (nextPlayerIndex !== undefined) {
      this.currentPlayerIndex = nextPlayerIndex;
    }
  }

  public getWinnerIndex(): number | null {
    const loser = this.players.find((pl) => pl.points === this.SHIPS_COUNT);
    if (loser) {
      return this.players.find((pl) => pl.index !== loser.index)!.index!;
    } else {
      return null;
    }
  }

  setBotIndex(index: number): void {
    const bot = this.players.find(
      (pl) => pl.index === undefined && pl.ws === undefined,
    );
    if (bot) {
      bot.index = index;
    }
  }

  private getOpponent(playerIndex: number): GamePlayer | undefined {
    return this.players.find((pl) => pl.index !== playerIndex);
  }

  private getTargetCell(
    grid: GameGrid,
    position: Coordinates,
  ): GridCell | undefined {
    const row = grid[position.y];
    if (row) {
      return row[position.x];
    }
  }

  private multipleSetCellValue(grid: GameGrid, attackResults: GridCellData[]) {
    attackResults.forEach((res) => {
      setCellValue(
        grid,
        res.position.y,
        res.position.x,
        res.status === AttackStatus.Killed ? GridCell.Shot : GridCell.Miss,
      );
    });
  }

  private incrementPlayerPoints(player: GamePlayer): void {
    player.points += 1;
  }

  private getFailureAttackResult(
    grid: GameGrid,
    position: Coordinates,
  ): GridCellData[] {
    setCellValue(grid, position.y, position.x, GridCell.Miss);

    return [
      {
        status: AttackStatus.Miss,
        position: position,
      },
    ];
  }

  private getSuccessAttackResult(
    grid: GameGrid,
    position: Coordinates,
    opponent: GamePlayer,
  ): GridCellData[] {
    setCellValue(grid, position.y, position.x, GridCell.Shot);

    if (this.isKilled(grid, position)) {
      this.incrementPlayerPoints(opponent);
      const attackResults: GridCellData[] = this.getResults(grid, position);
      this.multipleSetCellValue(grid, attackResults);
      return attackResults;
    }
    return [
      {
        status: AttackStatus.Shot,
        position: position,
      },
    ];
  }

  private getShipWithNeighbors(
    data: GridCell[],
    shipDirection: boolean,
    target: Coordinates,
    grid: GameGrid,
  ): GridCellData[] {
    let result: GridCellData[] = [];

    for (let i = 0; i < data.length; i++) {
      if (data[i] === GridCell.Shot) {
        const shipCell: GridCellData = {
          position: shipDirection
            ? { x: target.x, y: i } // column
            : { x: i, y: target.y }, // row
          status: AttackStatus.Killed,
        };

        const shipNeighbors: GridCellData[] = this.getCellNeighbors(
          grid,
          shipCell.position,
        )
          .filter(
            (cell) =>
              cell.value === GridCell.Empty || cell.value === GridCell.Miss,
          )
          .map((v) => ({
            position: getCellCoordinate(shipCell.position, v.direction),
            status: AttackStatus.Miss,
          }));

        result = [...result, { ...shipCell }, ...shipNeighbors];
      }
    }

    return result;
  }

  public getRandomCellCoordinates(playerIndex: number): Coordinates {
    const opponentGrid = this.getOpponent(playerIndex)?.grid;
    let randomCoordinates = getRandomCoordinates();
    let isNotAttackedCell: boolean;
    if (opponentGrid) {
      let randomCell = this.getCell(opponentGrid, randomCoordinates);
      if (randomCell) {
        isNotAttackedCell = this.isNotAttackedCell(randomCell);
        while (isNotAttackedCell === false) {
          randomCoordinates = getRandomCoordinates();
          randomCell = this.getCell(opponentGrid, randomCoordinates);
          if (randomCell) {
            isNotAttackedCell = this.isNotAttackedCell(randomCell);
          }
        }
      }
    }
    return randomCoordinates;
  }

  private isNotAttackedCell(value: GridCell): boolean {
    switch (value) {
      case GridCell.Miss:
      case GridCell.Shot:
        return false;
      case GridCell.Empty:
      case GridCell.Ship:
        return true;
    }
  }
}
