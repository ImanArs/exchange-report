/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Label } from "@/shared/ui/label";
import { useInsertDeal } from "@/features/deals/api";
import { supabase } from "@/shared/supabase/client";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

const schema = z.object({
  type: z.enum(["buy", "sell"]).default("buy"),
  commission: z
    .number({ invalid_type_error: "Введите число" })
    .min(0, "Не может быть отрицательным")
    .max(100, "Слишком много"),
  useCustomCommission: z.boolean().default(false),
  usdt: z
    .number({ invalid_type_error: "Введите число" })
    .positive("Должно быть > 0"),
  amount: z
    .number({ invalid_type_error: "Введите число" })
    .positive("Должно быть > 0"),
});

type FormValues = z.infer<typeof schema>;

const presetCommissions = [0.5, 1, 5] as const;

export function NewTransactionForm() {
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "buy",
      commission: 0.5,
      useCustomCommission: false,
      // usdt и amount стартуют пустыми — RHF + valueAsNumber корректно обработает
    },
    mode: "onBlur",
  });

  const useCustom = watch("useCustomCommission");
  const commission = watch("commission");

  const insertM = useInsertDeal();

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      await insertM.mutateAsync({
        user_id: userId,
        type: tab,
        commission: data.commission,
        usdt: data.usdt,
        amount: data.amount,
      } as any);

      toast.success("Сделка сохранена");
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка сохранения");
    }
  };

  return (
    <div className="w-full border border-[#BEBEBE]/30 rounded-[20px] px-5 py-4 bg-[#434377]/30 text-white flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Новая транзакция</h1>

      <div className="flex items-center gap-4">
        <Button
          type="button"
          className={cn("py-1 h-auto rounded-[45px] bg-[#434377] text-white", {
            "bg-[#6161D6] from-[#6262D9] to-[#9D62D9] ": tab === "buy",
          })}
          onClick={() => setTab("buy")}
        >
          Buy
        </Button>
        <Button
          type="button"
          className={cn("py-1 h-auto rounded-[45px] bg-[#434377] text-white", {
            "bg-[#6161D6] from-[#6262D9] to-[#9D62D9]": tab === "sell",
          })}
          onClick={() => setTab("sell")}
        >
          Sell
        </Button>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        {/* Commission presets */}
        <div className="flex flex-col gap-4">
          <Label className="text-sm">Комиссия</Label>
          <div className="flex flex-wrap items-center gap-2">
            {presetCommissions.map((p) => {
              const isSelectedPreset = commission === p && !useCustom;
              return (
                <Button
                  key={p}
                  type="button"
                  variant={isSelectedPreset ? "default" : "secondary"}
                  className={cn(
                    "rounded-full bg-[#434377] py-1 h-auto text-white",
                    {
                      "bg-[#6161D6]": isSelectedPreset,
                    }
                  )}
                  onClick={() => {
                    setValue("commission", p, { shouldValidate: true });
                    setValue("useCustomCommission", false, {
                      shouldValidate: true,
                    });
                  }}
                >
                  {p}%
                </Button>
              );
            })}

            <div className="ml-2 inline-flex items-center gap-2">
              <Switch
                checked={useCustom}
                onCheckedChange={(val) =>
                  setValue("useCustomCommission", Boolean(val), {
                    shouldValidate: true,
                  })
                }
                className="data-[state=checked]:bg-[#6161D6] data-[state=unchecked]:bg-[#434377]"
                aria-label="Custom commission"
              />
              <span className="text-sm">Custom</span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {useCustom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 grid gap-2">
                  <Label htmlFor="commission">Своя комиссия (%)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.1"
                    placeholder="Например, 0.75"
                    {...register("commission", { valueAsNumber: true })}
                  />
                  {errors.commission && (
                    <p className="text-xs text-red-500">
                      {errors.commission.message}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* USDT amount */}
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

        {/* Price/Amount */}
        <div className="grid gap-2">
          <Label htmlFor="amount">
            {tab === "buy" ? "Сумма покупки" : "Сумма продажи"}
          </Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            className={cn("border-b border-white")}
            placeholder={
              tab === "buy" ? "За сколько купили" : "За сколько продали"
            }
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-b from-[#6262D9] to-[#9D62D9] text-white rounded-[45px]"
        >
          Записать
        </Button>
      </form>
    </div>
  );
}

export default NewTransactionForm;
