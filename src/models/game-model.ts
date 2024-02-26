import { GridCell } from '../enums/grid-cell.enum';
import { Coordinates } from './client-data.model';
import { ServerAttackData } from './server-data.model';

export type GridCellData = Omit<ServerAttackData, 'currentPlayer'>;

export type GameGrid = GridCell[][];

export interface GameShipData {
  coordinates: Coordinates[];
  length: number;
  isKilled: boolean;
}
