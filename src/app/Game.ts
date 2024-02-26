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
import { GameGrid, GameShipData, GridCellData } from '../models/game-model';
import {
  createGrid,
  getCellCoordinate,
  setCellValue,
} from '../utils/grid-utils';
import { getRandomCoordinates, getUniqueArrayOfObjects } from '../utils/utils';

interface CellNeighbors {
  relativeDirection: Direction;
  value: GridCell | undefined;
}

export class Game {
  id: number;
  players: GamePlayer[] = [];
  currentPlayerIndex: number | null;
  private GRID_SIZE = 10;

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
      player.shipsData = this.setGameShipsData(player.ships);
    }
  }

  public isReady(): boolean {
    return this.players.every((v) => v.ships !== null);
  }

  public checkAttack(data: ClientAttackData): GridCellData[] | null {
    const opponent = this.getOpponent(data.indexPlayer);

    if (opponent && opponent.grid && opponent.shipsData) {
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
            opponent.shipsData,
          );
      }
    }
    return null;
  }

  private setGameShipsData(data: Ship[]): GameShipData[] {
    const shipsData: GameShipData[] = Array(data.length);

    for (let i = 0; i < data.length; i++) {
      const ship: Ship | undefined = data[i];

      if (ship) {
        shipsData[i] = {
          coordinates: [ship.position],
          isKilled: false,
          length: ship.length,
        };

        for (let j = 1; j < ship.length; j++) {
          let x: number = ship.position.x;
          let y: number = ship.position.y;

          if (ship.direction) {
            //down
            y = ship.position.y + j;
          } else {
            // right
            x = ship.position.x + j;
          }

          shipsData[i]!.coordinates.push({
            y,
            x,
          });
        }
      }
    }

    return shipsData;
  }

  private fillGrid(data: Ship[], size: number) {
    const grid = createGrid<GridCell>(GridCell.Empty, size);

    for (let i = 0; i < data.length; i++) {
      const ship: Ship | undefined = data[i];

      if (ship) {
        setCellValue(grid, ship.position.y, ship.position.x, GridCell.Ship);

        for (let j = 1; j < ship.length; j++) {
          let x: number = ship.position.x;
          let y: number = ship.position.y;

          if (ship.direction) {
            //down
            y = ship.position.y + j;
          } else {
            // right
            x = ship.position.x + j;
          }

          setCellValue(grid, y, x, GridCell.Ship);
        }
      }
    }

    return grid;
  }

  private getShotShipData(
    shipsData: GameShipData[],
    target: {
      x: number;
      y: number;
    },
  ): GameShipData | null {
    return (
      shipsData.find((v) =>
        v.coordinates.find((v) => v.x === target.x && v.y === target.y),
      ) || null
    );
  }

  private isKilled(grid: GameGrid, shipData: GameShipData): boolean {
    const shipValues = shipData.coordinates.map((v) =>
      this.getCellValue(grid, v),
    );

    return shipValues?.every((v) => v === GridCell.Shot) || false;
  }

  private getCellNeighbors(
    grid: GameGrid,
    target: Coordinates,
  ): CellNeighbors[] {
    return Object.values(Direction)
      .map((dir) => ({
        relativeDirection: dir,
        value: this.getCellValue(grid, target, dir),
      }))
      .filter((cell) => cell.value !== undefined);
  }

  private getCellValue(
    grid: GameGrid,
    target: Coordinates,
    relativePosition?: Direction,
  ): GridCell | undefined {
    const coordinate = getCellCoordinate(target, relativePosition);
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
    const loser = this.players.find((pl) =>
      pl.shipsData!.every((data) => data.isKilled === true),
    );
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
    shipsData: GameShipData[],
  ): GridCellData[] {
    setCellValue(grid, position.y, position.x, GridCell.Shot);
    const shipData: GameShipData | null = this.getShotShipData(
      shipsData,
      position,
    );

    if (shipData && this.isKilled(grid, shipData!)) {
      shipData.isKilled = true;
      const attackResults: GridCellData[] = this.getShipWithNeighborsCellData(
        grid,
        shipData,
      );
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

  private getShipWithNeighborsCellData(
    grid: GameGrid,
    data: GameShipData,
  ): GridCellData[] {
    const neighborsData: GridCellData[] = data.coordinates
      .map((cellPosition: Coordinates) =>
        this.getCellNeighbors(grid, cellPosition)
          .filter((cell) => cell.value === GridCell.Empty)
          .map((cell: CellNeighbors) => ({
            position: getCellCoordinate(cellPosition, cell.relativeDirection),
            status: AttackStatus.Miss,
          })),
      )
      .flat();

    const shipData: GridCellData[] = data.coordinates.map(
      (cellPosition: Coordinates) => ({
        position: { ...cellPosition },
        status: AttackStatus.Killed,
      }),
    );

    return getUniqueArrayOfObjects<GridCellData>([
      ...shipData,
      ...neighborsData,
    ]);
  }

  public getRandomCellCoordinates(playerIndex: number): Coordinates {
    const opponentGrid = this.getOpponent(playerIndex)?.grid;
    let randomCoordinates = getRandomCoordinates();
    let isNotAttackedCell: boolean;
    if (opponentGrid) {
      let randomCell = this.getCellValue(opponentGrid, randomCoordinates);
      if (randomCell) {
        isNotAttackedCell = this.isNotAttackedCell(randomCell);
        while (isNotAttackedCell === false) {
          randomCoordinates = getRandomCoordinates();
          randomCell = this.getCellValue(opponentGrid, randomCoordinates);
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
