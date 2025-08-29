/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useInsertDeal } from "@/features/deals/api";
import { supabase } from "@/shared/supabase/client";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import {
  computeBuyTotal,
  computeSellTotal,
  clampPercent,
} from "@/features/deals/lib/exchangeCalculations";

const schema = z.object({
  usdt: z
    .number({ invalid_type_error: "Введите число" })
    .positive("Должно быть > 0"),
  buyCommission: z
    .number({ invalid_type_error: "Введите число" })
    .min(-100, "Слишком много")
    .max(100, "Слишком много"),
  sellCommission: z
    .number({ invalid_type_error: "Введите число" })
    .min(-100, "Слишком много")
    .max(100, "Слишком много"),
});

type FormValues = z.infer<typeof schema>;

export function NewTransactionForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      usdt: undefined as unknown as number,
      buyCommission: 0,
      sellCommission: 0,
    },
    mode: "onBlur",
  });

  const insertM = useInsertDeal();

  const usdt = Number(watch("usdt")) || 0;
  const buyCommission = Number(watch("buyCommission")) || 0;
  const sellCommission = Number(watch("sellCommission")) || 0;

  // read-only поля формы для наглядности
  const buyTotal = computeBuyTotal(usdt, buyCommission); // покупка = трата ⇒ меньше
  const sellTotal = computeSellTotal(usdt, sellCommission); // продажа = прибыль ⇒ больше

  const onSubmit = useCallback(
    async (values: FormValues) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      // Пересчитываем по значениям сабмита (а не по watch), чтобы точно сохранить актуальное
      const usdtVal = Number(values.usdt) || 0;
      const buyCom = clampPercent(Number(values.buyCommission) || 0);
      const sellCom = clampPercent(Number(values.sellCommission) || 0);

      const buyAmt = computeBuyTotal(usdtVal, buyCom);
      const sellAmt = computeSellTotal(usdtVal, sellCom);

      try {
        // сохраняем ВСЕ данные с формы в одной записи
        await insertM.mutateAsync({
          user_id: userId,
          usdt: usdtVal,
          buy_commission: buyCom,
          buy_amount: buyAmt,
          sell_commission: sellCom,
          sell_amount: sellAmt,
          // deal_date — дефолт now() в базе
        } as any);

        toast.success("Запись сохранена");
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка сохранения");
      }
    },
    [insertM]
  );

  return (
    <div className="w-full border border-[#BEBEBE]/30 rounded-[20px] px-5 py-4 bg-[#434377]/30 text-white flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Новая транзакция</h1>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <Label htmlFor="usdt">Количество USDT</Label>
          <Input
            id="usdt"
            type="number"
            min="0"
            step="0.0001"
            placeholder="Введите количество"
            {...register("usdt", { valueAsNumber: true })}
          />
          {errors.usdt && (
            <p className="text-xs text-red-500">{errors.usdt.message}</p>
          )}
        </div>

        <div className="mt-2 grid gap-2">
          <Label htmlFor="buyCommission">Комиссия покупки (%)</Label>
          <Input
            id="buyCommission"
            type="number"
            step="0.1"
            placeholder="Например, 0.75"
            {...register("buyCommission", { valueAsNumber: true })}
          />
          {errors.buyCommission && (
            <p className="text-xs text-red-500">
              {errors.buyCommission.message}
            </p>
          )}
          <Label htmlFor="buyTotal" className="text-xs">
            Сумма покупки (итог, USDT)
          </Label>
          <Input
            id="buyTotal"
            type="number"
            readOnly
            value={Number.isFinite(buyTotal) ? buyTotal.toFixed(4) : ""}
          />
        </div>

        <div className="mt-2 grid gap-2">
          <Label htmlFor="sellCommission">Комиссия продажи (%)</Label>
          <Input
            id="sellCommission"
            type="number"
            step="0.1"
            placeholder="Например, 0.75"
            {...register("sellCommission", { valueAsNumber: true })}
          />
          {errors.sellCommission && (
            <p className="text-xs text-red-500">
              {errors.sellCommission.message}
            </p>
          )}
          <Label htmlFor="sellTotal" className="text-xs">
            Сумма продажи (итог, USDT)
          </Label>
          <Input
            id="sellTotal"
            type="number"
            readOnly
            value={Number.isFinite(sellTotal) ? sellTotal.toFixed(4) : ""}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 mt-2">
          {/* ОДНА КНОПКА — сохраняем все поля формы */}
          <Button
            type="submit"
            className={cn(
              "w-full rounded-[45px] text-white",
              "bg-gradient-to-b from-[#6262D9] to-[#9D62D9]"
            )}
          >
            Записать
          </Button>
        </div>
      </form>
    </div>
  );
}

export default NewTransactionForm;
