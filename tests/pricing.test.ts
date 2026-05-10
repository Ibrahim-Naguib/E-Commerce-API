import { describe, expect, it } from 'vitest';
import { getCartBillableAmountCents, getCartBillableTotal } from '../src/lib/pricing.js';

describe('pricing', () => {
  it('prefers discounted total when set', () => {
    expect(
      getCartBillableTotal({
        totalCartPrice: 100,
        totalPriceAfterDiscount: 80,
      } as never)
    ).toBe(80);
  });

  it('computes cents from billable total', () => {
    expect(
      getCartBillableAmountCents({
        totalCartPrice: 10.5,
        totalPriceAfterDiscount: undefined,
      } as never)
    ).toBe(1050);
  });
});
