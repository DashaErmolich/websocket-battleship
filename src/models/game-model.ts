import { GridCell } from '../enums/grid-cell.enum';
import { ServerAttackData } from './server-data.model';

export type GridCellData = Omit<ServerAttackData, 'currentPlayer'>;

export type GameGrid = GridCell[][];
