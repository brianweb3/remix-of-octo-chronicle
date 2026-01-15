export type LifeState = 'alive' | 'starving' | 'dying' | 'dead';

export interface OctoState {
  lifeState: LifeState;
  hp: number; // 1 HP = 1 minute of life
  maxHP: number;
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

// Life state thresholds based on HP
// Alive: > 15 HP (happy, colorful)
// Starving: 5-15 HP
// Dying: 1-4 HP (color changes)
// Dead: 0 HP
export function getLifeState(hp: number): LifeState {
  if (hp <= 0) return 'dead';
  if (hp < 5) return 'dying';
  if (hp <= 15) return 'starving';
  return 'alive';
}

// Canonical donation to HP conversion
// 0.01 SOL = 1 HP = 1 minute
export function donationToHP(amountSOL: number): number {
  if (amountSOL < 0.01) return 0; // Below minimum, no HP added
  return Math.floor(amountSOL * 100); // 0.01 SOL = 1 HP
}

// Donation table for display
export const DONATION_TABLE = [
  { sol: 0.01, hp: 1, time: '1 minute' },
  { sol: 0.05, hp: 5, time: '5 minutes' },
  { sol: 0.1, hp: 10, time: '10 minutes' },
  { sol: 0.25, hp: 25, time: '25 minutes' },
  { sol: 0.5, hp: 50, time: '50 minutes' },
  { sol: 1.0, hp: 100, time: '100 minutes' },
];
