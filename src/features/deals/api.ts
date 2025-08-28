import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";

export type DealRow = {
  id: string;
  user_id: string;
  deal_date: string; // ISO
  type: 'buy' | 'sell';
  usdt: number;
  amount: number;
  commission: number; // percent
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
        .select("id,user_id,deal_date,type,usdt,amount,commission")
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
