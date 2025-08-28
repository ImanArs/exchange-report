export type DealType = 'buy' | 'sell'

export function calcTotal(type: DealType, amount: number, commission: number) {
  const fee = (amount * (commission || 0)) / 100
  return type === 'sell' ? amount - fee : amount + fee
}

export function calcPnL(type: DealType, amount: number, commission: number) {
  const pnl = (amount * (commission || 0)) / 100
  return type === 'sell' ? +pnl : -pnl
}

export function aggregateMonth(deals: Array<{ type: DealType; amount: number; commission: number }>) {
  return deals.reduce(
    (acc, d) => {
      const amount = Number(d.amount) || 0
      const commission = Number(d.commission) || 0
      acc.total += calcTotal(d.type, amount, commission)
      acc.profit += calcPnL(d.type, amount, commission)
      return acc
    },
    { total: 0, profit: 0 }
  )
}

