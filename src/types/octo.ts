export type LifeState = 'alive' | 'starving' | 'dying' | 'dead';

export interface OctoState {
  lifeState: LifeState;
  xp: number; // 1 XP = 1 minute of life
  maxXP: number;
  isDead: boolean;
}

export interface Writing {
  id: string;
  content: string;
  timestamp: Date;
  lifeState: LifeState;
}

export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  isOctoResponse?: boolean;
}

export interface XPost {
  id: string;
  content: string;
  timestamp: Date;
}

// Life state thresholds based on XP
// Alive: > 60 XP
// Starving: 15-60 XP
// Dying: 1-14 XP
// Dead: 0 XP
export function getLifeState(xp: number): LifeState {
  if (xp <= 0) return 'dead';
  if (xp < 15) return 'dying';
  if (xp <= 60) return 'starving';
  return 'alive';
}

// Canonical donation to XP conversion
// 0.01 SOL = 1 XP = 1 minute
export function donationToXP(amountSOL: number): number {
  if (amountSOL < 0.01) return 0; // Below minimum, no XP added
  return Math.floor(amountSOL * 100); // 0.01 SOL = 1 XP
}

// Donation table for display
export const DONATION_TABLE = [
  { sol: 0.01, xp: 1, time: '1 minute' },
  { sol: 0.05, xp: 5, time: '5 minutes' },
  { sol: 0.1, xp: 10, time: '10 minutes' },
  { sol: 0.25, xp: 25, time: '25 minutes' },
  { sol: 0.5, xp: 50, time: '50 minutes' },
  { sol: 1.0, xp: 100, time: '100 minutes' },
];
