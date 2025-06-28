import { randomBytes } from 'node:crypto';

import { AuthState } from '@slack-time-punch/shared';

class StateManager {
  private states = new Map<string, AuthState>();
  private readonly expiry = 10 * 60 * 1000; // 10分

  generateState(): string {
    const state = randomBytes(32).toString('hex');
    const authState: AuthState = {
      state,
      timestamp: Date.now(),
    };

    this.states.set(state, authState);
    this.cleanExpiredStates();
    return state;
  }

  validateState(state: string): boolean {
    const authState = this.states.get(state);
    if (!authState) {
      return false;
    }

    const isExpired = Date.now() - authState.timestamp > this.expiry;
    if (isExpired) {
      this.states.delete(state);
      return false;
    }

    this.states.delete(state);
    return true;
  }

  private cleanExpiredStates(): void {
    const now = Date.now();
    for (const [state, authState] of this.states.entries()) {
      if (now - authState.timestamp > this.expiry) {
        this.states.delete(state);
      }
    }
  }
}

export const stateManager = new StateManager();
