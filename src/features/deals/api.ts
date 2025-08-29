import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";

export type DealRow = {
  id: string;
  user_id: string;
  deal_date: string; // ISO
  usdt: number;
  buy_commission: number; // percent
  buy_amount: number;
  sell_commission: number; // percent
  sell_amount: number;
};

export const dealsKey = (month?: string) => (month ? ["deals", month] as const : ["deals"] as const);

export function useDeals(month: string, userId: string | null) {
  return useQuery({
    queryKey: dealsKey(month),
    enabled: Boolean(userId && month),
    queryFn: async (): Promise<DealRow[]> => {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, (m ?? 1) - 1, 1);
      const end = new Date(year, (m ?? 1), 1);
      const { data, error } = await supabase
        .from("deals")
        .select("id,user_id,deal_date,usdt,buy_commission,buy_amount,sell_commission,sell_amount")
        .gte("deal_date", start.toISOString())
        .lt("deal_date", end.toISOString())
        .eq("user_id", userId)
        .order("deal_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });
}

export function useInsertDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<DealRow, 'id'|'deal_date'|'user_id'> & { user_id: string }) => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("deals")
        .insert([{ ...payload, deal_date: nowIso }])
        .select("id")
        .single();
      if (error) throw error;
      return data?.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealsKey() });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { id: string } & Partial<Omit<DealRow, 'id' | 'user_id'>>) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from('deals').update(rest).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealsKey() });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dealsKey() });
    },
  });
}
