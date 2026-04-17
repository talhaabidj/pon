/**
 * Money and token accounting for shift rewards and gacha pulls.
 */
export interface EconomyBalances {
  readonly money: number;
  readonly tokens: number;
  readonly lifetimeMoney: number;
  readonly lifetimeTokensUsed: number;
}

export interface ConversionResult {
  readonly moneySpent: number;
  readonly tokensGained: number;
  readonly balances: EconomyBalances;
}

export class EconomySystem {
  public static readonly MONEY_PER_TOKEN = 100;

  public constructor(
    private money = 0,
    private tokens = 0,
    private lifetimeMoney = 0,
    private lifetimeTokensUsed = 0,
  ) {}

  public addWages(amount: number): void {
    const safeAmount = Math.max(0, Math.floor(amount));
    this.money += safeAmount;
    this.lifetimeMoney += safeAmount;
  }

  public convertMoneyToTokens(moneyToSpend = this.money): ConversionResult {
    const spendable = Math.min(this.money, Math.max(0, Math.floor(moneyToSpend)));
    const tokensGained = Math.floor(spendable / EconomySystem.MONEY_PER_TOKEN);
    const moneySpent = tokensGained * EconomySystem.MONEY_PER_TOKEN;

    this.money -= moneySpent;
    this.tokens += tokensGained;

    return {
      moneySpent,
      tokensGained,
      balances: this.getBalances(),
    };
  }

  public spendTokens(count: number): boolean {
    const safeCount = Math.max(0, Math.floor(count));
    if (safeCount === 0 || this.tokens < safeCount) {
      return false;
    }

    this.tokens -= safeCount;
    this.lifetimeTokensUsed += safeCount;
    return true;
  }

  public getBalances(): EconomyBalances {
    return {
      money: this.money,
      tokens: this.tokens,
      lifetimeMoney: this.lifetimeMoney,
      lifetimeTokensUsed: this.lifetimeTokensUsed,
    };
  }
}
