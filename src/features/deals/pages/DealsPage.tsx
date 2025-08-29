/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import {
  useDeals,
  useDeleteDeal,
  useUpdateDeal,
  type DealRow,
} from "@/features/deals/api";
import { useAppStore, type StoreState } from "@/shared/store/appStore";

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
import { Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/shared/ui/modal";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { toast } from "sonner";

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

/* ========= бизнес-логика вынесена в features/deals/lib/calculations.ts ========= */

/* ========= MonthPicker (shadcn popover + кнопка) ========= */
function MonthPicker({
  value,
  onChange,
  active = true,
  placeholder = "Выберите месяц",
}: {
  value: string | null;
  onChange: (v: string) => void;
  active?: boolean;
  placeholder?: string;
}) {
  const selected = value ? parseMonthStr(value) : new Date();
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

  const buttonLabel = value ? monthLabel(value) : placeholder;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={[
            "w-[220px] rounded-[12px] justify-between text-white transition-colors",
            active ? "bg-[#434377] hover:bg-[#6161D6]" : "bg-[#434377]/60",
          ].join(" ")}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {buttonLabel}
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
            const isActive = Boolean(value) &&
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
  const setDealsForMonth = useAppStore((s: StoreState) => s.setDealsForMonth);
  const updateM = useUpdateDeal();
  const deleteM = useDeleteDeal();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState<{
    id: string;
    usdt: number;
    buy_commission: number;
    buy_amount: number;
    sell_commission: number;
    sell_amount: number;
  } | null>(null);
  const [toDelete, setToDelete] = useState<DealRow | null>(null);

  // Синхронизация данных Supabase → глобальный стор (по месяцам)
  useEffect(() => {
    if (dealsQ.data) {
      setDealsForMonth(month, dealsQ.data);
    }
  }, [dealsQ.data, setDealsForMonth, month]);

  return (
    <div className="overflow-x-auto w-full border border-[#BEBEBE]/30 rounded-[20px] px-5 py-4 bg-[#434377]/30">
      {!compact && (
        <div className="flex justify-center mb-2">
          <p className="text-sm text-white">Сделки за {monthLabel(month).replace(' г.', '')}</p>
        </div>
      )}

      <Table className="min-w-[820px]">
        <TableHeader className="hover:bg-transparent">
          <TableRow className="text-white bg-transparent hover:bg-transparent">
            <TableHead className="px-2 py-2">Дата транзакции</TableHead>
            <TableHead className="px-2 py-2 text-right">USDT</TableHead>
            <TableHead className="px-2 py-2 text-right">
              Комиссия покупки (%)
            </TableHead>
            <TableHead className="px-2 py-2 text-right">
              Сумма покупки
            </TableHead>
            <TableHead className="px-2 py-2 text-right">
              Комиссия продажи (%)
            </TableHead>
            <TableHead className="px-2 py-2 text-right">
              Сумма продажи
            </TableHead>
            <TableHead className="px-2 py-2 text-right">прибыль</TableHead>
            <TableHead className="px-2 py-2 text-right">действия</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {(dealsQ.data ?? []).map((d) => {
            return (
              <TableRow
                key={d.id}
                className="text-white border-b/60 hover:bg-[#6161D6]/10 transition-colors"
              >
                <TableCell className="px-2 py-2">
                  {new Date(d.deal_date).toLocaleString()}
                </TableCell>
                <TableCell className="px-2 py-2 text-right">{d.usdt}</TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.buy_commission}
                </TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.buy_amount}
                </TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.sell_commission}
                </TableCell>
                <TableCell className="px-2 py-2 text-right">
                  {d.sell_amount}
                </TableCell>
                {(() => {
                  const profit = (Number(d.sell_amount) || 0) - (Number(d.buy_amount) || 0);
                  return (
                    <TableCell
                      className={`px-2 py-2 text-right ${profit > 0 ? 'text-green-500' : ''} ${profit < 0 ? 'text-red-500' : ''}`}
                    >
                      {profit > 0 ? '+' : ''}
                      {profit.toFixed(2)}
                    </TableCell>
                  );
                })()}
                <TableCell className="px-2 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-[#6161D6]/20"
                      onClick={() => {
                        setForm({
                          id: d.id,
                          usdt: Number(d.usdt) || 0,
                          buy_commission: Number(d.buy_commission) || 0,
                          buy_amount: Number(d.buy_amount) || 0,
                          sell_commission: Number(d.sell_commission) || 0,
                          sell_amount: Number(d.sell_amount) || 0,
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-[#6161D6]/20"
                      onClick={() => {
                        setToDelete(d);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}

          {(dealsQ.data?.length ?? 0) === 0 && (
            <TableRow className="text-white border-b/60 hover:bg-[#6161D6]/10 transition-colors">
              <TableCell colSpan={8} className="px-2 py-8 text-center">
                Нет данных за {monthLabel(month).replace(' г.', '')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Изменить сделку"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setEditOpen(false)}
              className="rounded-full bg-[#434377] hover:bg-[#6161D6]"
            >
              Отмена
            </Button>
            <Button
              onClick={async () => {
                if (!form) return;
                try {
                  await updateM.mutateAsync({
                    id: form.id,
                    usdt: form.usdt,
                    buy_commission: form.buy_commission,
                    buy_amount: form.buy_amount,
                    sell_commission: form.sell_commission,
                    sell_amount: form.sell_amount,
                  });
                  toast.success("Сделка обновлена");
                  setEditOpen(false);
                } catch (e: any) {
                  toast.error(e?.message ?? "Ошибка обновления");
                }
              }}
              className="rounded-full bg-[#6161D6] hover:bg-[#6161D6]/90"
            >
              Сохранить
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="usdt">USDT</Label>
              <Input
                id="usdt"
                type="number"
                value={form.usdt}
                onChange={(e) =>
                  setForm({ ...form, usdt: Number(e.target.value) })
                }
                className="text-white"
              />
            </div>
            <div>
              <Label htmlFor="buy_commission">Комиссия покупки (%)</Label>
              <Input
                id="buy_commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.buy_commission}
                onChange={(e) => {
                  let v = Number(e.target.value);
                  if (!isFinite(v)) v = 0;
                  if (v < 0) v = 0;
                  if (v > 100) v = 100;
                  setForm({ ...form, buy_commission: v });
                }}
                className="text-white"
              />
            </div>
            <div>
              <Label htmlFor="buy_amount">Сумма покупки</Label>
              <Input
                id="buy_amount"
                type="number"
                value={form.buy_amount}
                onChange={(e) =>
                  setForm({ ...form, buy_amount: Number(e.target.value) })
                }
                className="text-white"
              />
            </div>
            <div>
              <Label htmlFor="sell_commission">Комиссия продажи (%)</Label>
              <Input
                id="sell_commission"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.sell_commission}
                onChange={(e) => {
                  let v = Number(e.target.value);
                  if (!isFinite(v)) v = 0;
                  if (v < 0) v = 0;
                  if (v > 100) v = 100;
                  setForm({ ...form, sell_commission: v });
                }}
                className="text-white"
              />
            </div>
            <div>
              <Label htmlFor="sell_amount">Сумма продажи</Label>
              <Input
                id="sell_amount"
                type="number"
                value={form.sell_amount}
                onChange={(e) =>
                  setForm({ ...form, sell_amount: Number(e.target.value) })
                }
                className="text-white"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Удалить сделку"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteOpen(false)}
              className="rounded-full bg-[#434377] hover:bg-[#6161D6]"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await deleteM.mutateAsync(toDelete.id);
                  toast.success("Сделка удалена");
                  setDeleteOpen(false);
                } catch (e: any) {
                  toast.error(e?.message ?? "Ошибка удаления");
                }
              }}
              className="rounded-full"
            >
              Удалить
            </Button>
          </>
        }
      >
        <p className="text-sm opacity-90">
          Вы уверены, что хотите удалить сделку от{" "}
          {toDelete ? new Date(toDelete.deal_date).toLocaleString() : ""}?
        </p>
      </Modal>
    </div>
  );
}

type Preset = "1m" | "3m" | "6m" | "custom";

export default function DealsPage() {
  const { userId, loading } = useAuth();

  const [preset, setPreset] = useState<Preset>("1m");
  const [customMonth, setCustomMonth] = useState<string | null>(null);

  const monthsToRender = useMemo(() => {
    if (preset === "1m") return [fmtMonth()];
    if (preset === "3m") return prevMonths(3);
    if (preset === "6m") return prevMonths(6);
    return customMonth ? [customMonth] : [];
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
            onClick={() => { setPreset("1m"); setCustomMonth(null); }}
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
            onClick={() => { setPreset("3m"); setCustomMonth(null); }}
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
            onClick={() => { setPreset("6m"); setCustomMonth(null); }}
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
          active={preset === "custom"}
          placeholder="Выберите месяц"
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
