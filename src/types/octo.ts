export type LifeState = 'alive' | 'starving' | 'dying' | 'dead';

export interface OctoState {
  lifeState: LifeState;
  remainingSeconds: number;
  maxSeconds: number;
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
}

// Helper to determine life state from remaining time
export function getLifeState(remainingSeconds: number): LifeState {
  const hours = remainingSeconds / 3600;
  
  if (remainingSeconds <= 0) return 'dead';
  if (hours < 1) return 'dying';
  if (hours < 6) return 'starving';
  return 'alive';
}

// Mock donation amounts to time conversion
export function donationToSeconds(amount: number): number {
  if (amount < 0.001) return 0;
  if (amount >= 1.0) return 24 * 3600;
  if (amount >= 0.5) return 12 * 3600;
  if (amount >= 0.1) return 2 * 3600;
  if (amount >= 0.05) return 45 * 60;
  if (amount >= 0.01) return 7 * 60;
  if (amount >= 0.005) return 3 * 60;
  if (amount >= 0.002) return 60;
  return 30;
}
