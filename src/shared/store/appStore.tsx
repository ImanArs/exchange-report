/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import type { DealRow } from "@/features/deals/api";
import { aggregateMonthNew } from "@/features/deals/lib/exchangeCalculations";

export type User = { id: string; email?: string | null } | null;
export type MonthlyStats = { pnl: number; total: number };

export type StoreState = {
  user: User;
  dealsByMonth: Record<string, DealRow[]>;
  monthly: Record<string, MonthlyStats>;
  setUser: (user: User) => void;
  setDealsForMonth: (month: string, deals: DealRow[]) => void;
};

export const useAppStore = create<StoreState>(
  (set: (updater: any) => void) => ({
    user: null,
    dealsByMonth: {},
    monthly: {},
    setUser: (user: User) => set({ user }),
    setDealsForMonth: (month: string, deals: DealRow[]) =>
      set((prev: StoreState) => ({
        dealsByMonth: { ...prev.dealsByMonth, [month]: deals },
        monthly: { ...prev.monthly, [month]: aggregateMonthNew(deals) },
      })),
  })
);
