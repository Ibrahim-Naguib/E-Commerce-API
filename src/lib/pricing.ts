import type { CartDocument } from '../models/Cart.js';

/** Billable total in major currency units (e.g. USD). Uses discount when present. */
export function getCartBillableTotal(cart: Pick<CartDocument, 'totalCartPrice' | 'totalPriceAfterDiscount'>): number {
  if (cart.totalPriceAfterDiscount != null && cart.totalPriceAfterDiscount !== '') {
    const n = Number(cart.totalPriceAfterDiscount);
    if (!Number.isNaN(n)) return n;
  }
  return Number(cart.totalCartPrice ?? 0);
}

/** Amount in smallest currency unit (cents) for Stripe. */
export function getCartBillableAmountCents(cart: Pick<CartDocument, 'totalCartPrice' | 'totalPriceAfterDiscount'>): number {
  return Math.round(getCartBillableTotal(cart) * 100);
}
