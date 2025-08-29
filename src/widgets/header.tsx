/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/shared/ui/button";
import { MoreVertical, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { useDeals } from "@/features/deals/api";
import { useAppStore, type StoreState } from "@/shared/store/appStore";
import { useEffect, useState } from "react";
import { Modal } from "@/shared/ui/modal";
import { supabase } from "@/shared/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

const navLinks = [
  { label: "Новая транзакция", href: "/" },
  { label: "История", href: "/deals" },
];

export const Header = () => {
  const { userId, email } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  function fmtMonth(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  const currentMonth = fmtMonth();

  const dealsQ = useDeals(currentMonth, userId ?? null);
  const setDealsForMonth = useAppStore((s: StoreState) => s.setDealsForMonth);

  // push data into global store when loaded
  useEffect(() => {
    if (dealsQ.data) setDealsForMonth(currentMonth, dealsQ.data);
  }, [dealsQ.data, currentMonth, setDealsForMonth]);

  // daily aggregation not used in current header

  // Примерная метрика: прибыль как (sell_amount - buy_amount)
  // Переходим на прибыль за СЕГОДНЯ
  function isToday(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  const todayPnl = (dealsQ.data ?? []).reduce((acc, d) => {
    if (!isToday(d.deal_date)) return acc;
    const buy = Number(d.buy_amount) || 0;
    const sell = Number(d.sell_amount) || 0;
    return acc + (sell - buy);
  }, 0);

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-white px-4 sm:px-6 md:px-10 py-3 sm:py-4 border-b border-border">
      {/* Left side: nav (hidden on mobile) */}
      <div className="hidden sm:block w-full max-w-[400px] sm:max-w-[300px] items-center gap-3 sm:gap-6 md:gap-8 flex-wrap">
        <nav className="w-full">
          <ul className="flex flex-wrap justify-between items-center gap-2 sm:gap-4 md:gap-6 text-xs sm:text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="transition-colors text-[20px] sm:text-lg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Right side: stats + user */}
      <div className="flex items-center justify-between gap-3 sm:gap-5 md:gap-6 w-full sm:w-auto">
        <div className="text-right flex-1 sm:flex-none">
          <div
            className={`text-xs text-left lg:text-right lg:text-sm font-medium ${
              todayPnl >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {todayPnl >= 0 ? "+" : ""}
            {todayPnl.toFixed(2)}$ Прибыль за сегодня
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[#6161D6] px-2.5 sm:px-3 py-1">
          <div>
            <User className="w-6 h-6 rounded-full" />
          </div>
          <p className="text-xs sm:text-sm max-w-[140px] truncate">
            {email ?? "—"}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full p-0 h-auto w-4 hover:bg-secondary"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-40 bg-[#434377] text-white border border-[#BEBEBE]/30"
            >
              <DropdownMenuItem
                onClick={() => setLogoutOpen(true)}
                className="cursor-pointer rounded-md hover:bg-[#6161D6] focus:bg-[#6161D6]"
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout confirm modal */}
      <Modal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Выйти из аккаунта?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setLogoutOpen(false)}
              className="rounded-full bg-[#434377] hover:bg-[#6161D6]"
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                  toast.success("Вы вышли из системы");
                  setLogoutOpen(false);
                  window.location.hash = "#/login";
                } catch (e: any) {
                  toast.error(e?.message ?? "Ошибка выхода");
                }
              }}
            >
              Выйти
            </Button>
          </>
        }
      >
        <p className="text-sm opacity-90">Вы действительно хотите выйти?</p>
      </Modal>
    </header>
  );
};
