/**
 * Money and token accounting for shift rewards and gacha pulls.
 */
export class EconomySystem {
  public constructor(
    private money = 0,
    private tokens = 0,
  ) {}

  public addWages(amount: number): void {
    this.money += Math.max(0, amount);
  }

  public getBalances(): { money: number; tokens: number } {
    return { money: this.money, tokens: this.tokens };
  }
}
