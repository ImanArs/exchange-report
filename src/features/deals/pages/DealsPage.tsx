import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { useDeals } from "@/features/deals/api";

import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/* ========= utils ========= */
function fmtMonth(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function prevMonths(n: number): string[] {
  const res: string[] = [];
  const base = new Date();
  base.setDate(1);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setMonth(base.getMonth() - i);
    res.push(fmtMonth(d));
  }
  return res;
}
function parseMonthStr(value: string): Date {
  const [y, m] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}
function monthLabel(value: string) {
  const d = parseMonthStr(value);
  return d.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

/* ========= итог и прибыль ========= */
// итог = сумма с учётом комиссии (фактически получено/потрачено)
function calcTotal(type: "buy" | "sell", amount: number, commission: number) {
  const fee = (amount * (commission || 0)) / 100;
  return type === "sell" ? amount - fee : amount + fee;
}
// прибыль = только разница от комиссии (PnL)
function calcPnL(type: "buy" | "sell", amount: number, commission: number) {
  const pnl = (amount * (commission || 0)) / 100;
  return type === "sell" ? +pnl : -pnl;
}

/* ========= MonthPicker (shadcn popover + кнопка) ========= */
function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const selected = parseMonthStr(value);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(selected.getFullYear());

  const months = [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className="w-[220px] rounded-[12px] justify-between bg-[#434377] text-white hover:bg-[#6161D6] transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {monthLabel(value)}
          </span>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[260px] p-3 bg-[#434377]/95 border border-[#BEBEBE]/30 rounded-[16px] text-white"
      >
        <div className="flex items-center justify-between mb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-[#6161D6] "
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="text-sm font-semibold">{year}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-[#6161D6]"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {months.map((m, idx) => {
            const isActive =
              year === selected.getFullYear() && idx === selected.getMonth();
            return (
              <Button
                key={m}
                type="button"
                variant="secondary"
                className={[
                  "py-2 bg-[#434377] hover:bg-[#6161D6] transition-colors",
                  "rounded-[10px] text-white",
                  isActive ? "bg-[#6161D6]" : "",
                ].join(" ")}
                onClick={() => {
                  onChange(fmtMonth(new Date(year, idx, 1)));
                  setOpen(false);
                }}
              >
                {m}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ========= table ========= */
function DealsTableByMonth({
  month,
  userId,
  compact = false,
}: {
  month: string;
  userId: string;
  compact?: boolean;
}) {
  const dealsQ = useDeals(month, userId);

  return (
    <div className="overflow-x-auto w-full border border-[#BEBEBE]/30 rounded-[20px] px-5 py-4 bg-[#434377]/30">
      {!compact && (
        <div className="flex justify-center mb-2">
          <p className="text-sm text-white">Сделки за {month}</p>
        </div>
      )}

      <Table>
        <TableHeader className="hover:bg-transparent">
          <TableRow className="text-white bg-transparent hover:bg-transparent">
            <TableHead className="px-2 py-2">Дата транзакции</TableHead>
            <TableHead className="px-2 py-2">тип</TableHead>
            <TableHead className="px-2 py-2 text-right">usdt</TableHead>
            <TableHead className="px-2 py-2 text-right">сумма</TableHead>
            <TableHead className="px-2 py-2 text-right">
              commission (%)
            </TableHead>
            <TableHead className="px-2 py-2 text-right">итог</TableHead>
            <TableHead className="px-2 py-2 text-right">прибыль</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {(dealsQ.data ?? []).map((d) => {
            const amount = Number(d.amount) || 0;
            const commission = Number(d.commission) || 0;
            const total = calcTotal(d.type, amount, commission);
            const pnl = calcPnL(d.type, amount, commission);

            return (
              <TableRow
                key={d.id}
                className="text-white border-b/60 hover:bg-[#6161D6]/10 transition-colors"
              >
                <TableCell className="px-2 py-2">
                  {new Date(d.deal_date).toLocaleString()}
                </TableCell>

                <TableCell className="px-2 py-2">
                  {d.type === "buy" ? "Покупка" : "Продажа"}
                </TableCell>

                <TableCell className="px-2 py-2 text-right">{d.usdt}</TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.amount}
                </TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.commission}
                </TableCell>

                <TableCell className={cn("px-2 py-2 text-right")}>
                  {total.toFixed(2)}
                </TableCell>

                <TableCell
                  className={cn("px-2 py-2 text-right", {
                    "text-green-500": pnl > 0,
                    "text-red-500": pnl < 0,
                  })}
                >
                  {pnl > 0 ? "+" : ""}
                  {pnl.toFixed(2)}
                </TableCell>
              </TableRow>
            );
          })}

          {(dealsQ.data?.length ?? 0) === 0 && (
            <TableRow className="text-white border-b/60 hover:bg-[#6161D6]/10 transition-colors">
              <TableCell colSpan={7} className="px-2 py-8 text-center">
                Нет данных за {month}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

type Preset = "1m" | "3m" | "6m" | "custom";

export default function DealsPage() {
  const { userId, loading } = useAuth();

  const [preset, setPreset] = useState<Preset>("1m");
  const [customMonth, setCustomMonth] = useState<string>(() => fmtMonth());

  const monthsToRender = useMemo(() => {
    if (preset === "1m") return [fmtMonth()];
    if (preset === "3m") return prevMonths(3);
    if (preset === "6m") return prevMonths(6);
    return [customMonth];
  }, [preset, customMonth]);

  if (!loading && !userId) return <Navigate to="/login" replace />;

  return (
    <div className="container mx-auto flex flex-col gap-5">
      {/* Filters */}
      <div className="w-full flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-[#BEBEBE]/30 rounded-[20px] px-5 py-4 bg-[#434377]/30">
        <div className="inline-flex gap-2 text-white">
          <Button
            type="button"
            variant="secondary"
            aria-pressed={preset === "1m"}
            onClick={() => setPreset("1m")}
            className={[
              "rounded-full text-white bg-[#434377]",
              "hover:bg-[#6161D6] transition-colors",
              preset === "1m" ? "bg-[#6161D6]" : "",
            ].join(" ")}
          >
            Этот месяц
          </Button>
          <Button
            type="button"
            variant="secondary"
            aria-pressed={preset === "3m"}
            onClick={() => setPreset("3m")}
            className={[
              "rounded-full text-white bg-[#434377]",
              "hover:bg-[#6161D6] transition-colors",
              preset === "3m" ? "bg-[#6161D6]" : "",
            ].join(" ")}
          >
            3 мес
          </Button>
          <Button
            type="button"
            variant="secondary"
            aria-pressed={preset === "6m"}
            onClick={() => setPreset("6m")}
            className={[
              "rounded-full text-white bg-[#434377]",
              "hover:bg-[#6161D6] transition-colors",
              preset === "6m" ? "bg-[#6161D6]" : "",
            ].join(" ")}
          >
            6 мес
          </Button>
        </div>

        {/* кастомный месяц — кнопка с popup (не input) */}
        <MonthPicker
          value={customMonth}
          onChange={(v) => {
            setCustomMonth(v);
            setPreset("custom");
          }}
        />
      </div>

      {/* Tables */}
      <div className="space-y-4">
        {userId &&
          monthsToRender.map((m) => (
            <DealsTableByMonth
              key={m}
              month={m}
              userId={userId}
              compact={preset !== "1m"}
            />
          ))}
      </div>
    </div>
  );
}
