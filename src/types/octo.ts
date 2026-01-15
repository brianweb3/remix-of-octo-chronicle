export type LifeState = 'alive' | 'starving' | 'dying' | 'dead';

export interface OctoState {
  lifeState: LifeState;
  hp: number; // 1 HP = 1 minute of life
  maxHP: number;
  isDead: boolean;
}

export interface Writing {
  id: string;
  title: string;
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

export interface Transaction {
  txHash: string;
  amountSol: number;
  hpAdded: number;
  timestamp: Date;
}

// CANONICAL Life state thresholds based on HP
// Alive: > 60 HP
// Starving: 15-60 HP
// Dying: 1-14 HP
// Dead: 0 HP
export function getLifeState(hp: number): LifeState {
  if (hp <= 0) return 'dead';
  if (hp <= 14) return 'dying';
  if (hp <= 60) return 'starving';
  return 'alive';
}

// CANONICAL donation to HP conversion
// 0.01 SOL = 1 HP = 1 minute
// Minimum effective donation: 0.01 SOL
export function donationToHP(amountSOL: number): number {
  if (amountSOL < 0.01) return 0; // Below minimum, no HP added
  return Math.floor(amountSOL / 0.01); // 0.01 SOL = 1 HP
}

// CANONICAL constants
export const MAX_HP = 720; // 12 hours = 720 minutes
export const INITIAL_HP = 10; // Start with 10 minutes
export const WALLET_ADDRESS = '8ejAYL1hNeJreUxTfwUQ5QVay7dN5FCbaEiQspiciVxw'; // Donation wallet
export const CONTRACT_ADDRESS = 'Hxs6ff3NVNk3yjCPH9Z5UtpHmodPD6WLpiWsmXWGpump'; // Token CA
export const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=c5040336-825d-42e6-a592-59ef6633316c';

// Donation table for display
export const DONATION_TABLE = [
  { sol: 0.01, hp: 1, time: '1 minute' },
  { sol: 0.05, hp: 5, time: '5 minutes' },
  { sol: 0.1, hp: 10, time: '10 minutes' },
  { sol: 0.25, hp: 25, time: '25 minutes' },
  { sol: 0.5, hp: 50, time: '50 minutes' },
  { sol: 1.0, hp: 100, time: '100 minutes' },
];
