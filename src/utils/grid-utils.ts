import { Direction } from '../enums/direction-enum';
import { GridCell } from '../enums/grid-cell.enum';
import { Coordinates } from '../models/client-data.model';

export function createGrid<T>(filler: T, size: number): T[][] {
  return Array.from(new Array(size), () =>
    Array.from(new Array(size), () => filler),
  );
}

export function setCellValue(
  grid: string[][],
  y: number,
  x: number,
  value: GridCell,
) {
  grid[y]![x] = value;
}

export function getCellCoordinate(
  target: Coordinates,
  position?: Direction,
): Coordinates {
  switch (position) {
    case Direction.Left:
      return { ...target, x: target.x - 1 };
    case Direction.Right:
      return { ...target, x: target.x + 1 };
    case Direction.Up:
      return { ...target, y: target.y - 1 };
    case Direction.Down:
      return { ...target, y: target.y + 1 };
    case Direction.UpLeft:
      return { x: target.x - 1, y: target.y - 1 };
    case Direction.UpRight:
      return { x: target.x + 1, y: target.y - 1 };
    case Direction.DownLeft:
      return { x: target.x - 1, y: target.y + 1 };
    case Direction.DownRight:
      return { x: target.x + 1, y: target.y + 1 };
    default:
      return { ...target };
  }
}
