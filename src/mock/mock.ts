import { Ship } from '../models/client-data.model';

export const CURRENT_PLAYER_SHIPS: Ship[] = [
  {
    position: {
      x: 1,
      y: 6,
    },
    direction: false,
    type: 'huge',
    length: 4,
  },
  {
    position: {
      x: 6,
      y: 1,
    },
    direction: false,
    type: 'large',
    length: 3,
  },
  {
    position: {
      x: 1,
      y: 1,
    },
    direction: false,
    type: 'large',
    length: 3,
  },
  {
    position: {
      x: 9,
      y: 5,
    },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 3,
      y: 3,
    },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 4,
      y: 9,
    },
    direction: false,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 0,
      y: 4,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 6,
      y: 5,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 6,
      y: 7,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 6,
      y: 3,
    },
    direction: true,
    type: 'small',
    length: 1,
  },
];

export const OPPONENT_PLAYER_SHIPS: Ship[] = [
  {
    position: {
      x: 7,
      y: 1,
    },
    direction: true,
    type: 'huge',
    length: 4,
  },
  {
    position: {
      x: 2,
      y: 1,
    },
    direction: true,
    type: 'large',
    length: 3,
  },
  {
    position: {
      x: 6,
      y: 6,
    },
    direction: false,
    type: 'large',
    length: 3,
  },
  {
    position: {
      x: 7,
      y: 8,
    },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 0,
      y: 7,
    },
    direction: false,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 5,
      y: 0,
    },
    direction: true,
    type: 'medium',
    length: 2,
  },
  {
    position: {
      x: 3,
      y: 7,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 0,
      y: 3,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 9,
      y: 2,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
  {
    position: {
      x: 5,
      y: 8,
    },
    direction: false,
    type: 'small',
    length: 1,
  },
];

export function getMockAttack() {
  const maxFloored = 0;
  const minCeiled = 9;

  return {
    x: Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled),
    y: Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled),
    gameId: 2,
    indexPlayer: 2,
  };
}
