/**
 * EconomySystem — Manages money and token balances.
 *
 * Pure logic, no DOM or Three.js dependencies.
 */

import { TOKEN_PRICE, PULL_COST } from '../core/Config.js';

export class EconomySystem {
  private money: number;
  private tokens: number;

  constructor(initialMoney = 0, initialTokens = 0) {
    this.money = initialMoney;
    this.tokens = initialTokens;
  }

  getMoney(): number {
    return this.money;
  }

  getTokens(): number {
    return this.tokens;
  }

  /** Add wages from completing a task */
  earnMoney(amount: number) {
    if (amount <= 0) return;
    this.money += amount;
  }

  /** Grant tokens directly (e.g., jackpot bonus) — no money cost. */
  addTokens(amount: number) {
    if (amount <= 0) return;
    this.tokens += amount;
  }

  /**
   * Buy tokens with money.
   * Returns the number of tokens purchased.
   */
  buyTokens(count: number): number {
    const cost = count * TOKEN_PRICE;
    if (this.money < cost) {
      // Buy as many as affordable
      const affordable = Math.floor(this.money / TOKEN_PRICE);
      if (affordable <= 0) return 0;
      this.money -= affordable * TOKEN_PRICE;
      this.tokens += affordable;
      return affordable;
    }
    this.money -= cost;
    this.tokens += count;
    return count;
  }

  /**
   * Spend tokens for a gacha pull.
   * Returns true if the pull was affordable.
   */
  spendPull(): boolean {
    if (this.tokens < PULL_COST) return false;
    this.tokens -= PULL_COST;
    return true;
  }

  /** Check if player can afford a pull */
  canPull(): boolean {
    return this.tokens >= PULL_COST;
  }

  /** Check if player can afford at least one token */
  canBuyToken(): boolean {
    return this.money >= TOKEN_PRICE;
  }

  /** Load state */
  loadState(money: number, tokens: number) {
    this.money = money;
    this.tokens = tokens;
  }
}
