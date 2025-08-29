export function computeBuyTotal(usdt: number, buyCommission: number) {
  const base = Number(usdt) || 0;
  const c = Number(buyCommission) || 0;
  return base - (base * c) / 100;
}

export function computeSellTotal(usdt: number, sellCommission: number) {
  const base = Number(usdt) || 0;
  const c = Number(sellCommission) || 0;
  return base + (base * c) / 100;
}

export type DealLike = {
  buy_amount: number;
  sell_amount: number;
};

export function aggregateMonthNew<T extends DealLike>(deals: T[]) {
  const res = deals.reduce(
    (acc, d) => {
      const buy = Number(d.buy_amount) || 0;
      const sell = Number(d.sell_amount) || 0;
      acc.pnl += sell - buy;
      acc.total += sell + buy;
      return acc;
    },
    { pnl: 0, total: 0 }
  );
  return res;
}

export function clampPercent(n: number) {
  const x = Number(n);
  if (!isFinite(x)) return 0;
  return Math.min(100, Math.max(0, x));
}
