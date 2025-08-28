import { create } from 'zustand'
import type { DealRow } from '@/features/deals/api'
import { aggregateMonth } from '@/features/deals/lib/calculations'

export type User = { id: string; email?: string | null } | null
export type MonthlyStats = { total: number; profit: number }

export type StoreState = {
  user: User
  dealsByMonth: Record<string, DealRow[]>
  monthly: Record<string, MonthlyStats>
  setUser: (user: User) => void
  setDealsForMonth: (month: string, deals: DealRow[]) => void
}

export const useAppStore = create<StoreState>((set: (updater: any) => void) => ({
  user: null,
  dealsByMonth: {},
  monthly: {},
  setUser: (user: User) => set({ user }),
  setDealsForMonth: (month: string, deals: DealRow[]) =>
    set((prev: StoreState) => ({
      dealsByMonth: { ...prev.dealsByMonth, [month]: deals },
      monthly: { ...prev.monthly, [month]: aggregateMonth(deals) },
    })),
}))
