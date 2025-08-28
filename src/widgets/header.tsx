import { Button } from "@/shared/ui/button";
import { MoreVertical, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { useDeals } from "@/features/deals/api";
import { calcPnL } from "@/features/deals/lib/calculations";
import { useAppStore, type StoreState } from "@/shared/store/appStore";
import { useEffect } from "react";
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

  const today = new Date();
  const isSameDay = (iso: string) => {
    const d = new Date(iso);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  };

  const monthProfit = (dealsQ.data ?? []).reduce((acc, d) => {
    const amount = Number(d.amount) || 0;
    const commission = Number(d.commission) || 0;
    return acc + calcPnL(d.type, amount, commission);
  }, 0);

  const todayProfit = (dealsQ.data ?? [])
    .filter((d) => isSameDay(d.deal_date))
    .reduce((acc, d) => {
      const amount = Number(d.amount) || 0;
      const commission = Number(d.commission) || 0;
      return acc + calcPnL(d.type, amount, commission);
    }, 0);

  return (
    <header className="flex items-center justify-between text-white px-10 py-4 border-b border-border">
      {/* Left side: Logo + nav */}
      <div className="flex items-center gap-8">
        <nav>
          <ul className="flex items-center gap-6 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Right side: stats + user */}
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className={`text-sm font-medium ${todayProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {todayProfit >= 0 ? '+' : ''}{todayProfit.toFixed(2)}$ за сегодня
          </div>
          <p className="text-lg font-semibold">
            {monthProfit.toFixed(2)}$ за месяц
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[#6161D6] px-3 py-1">
          <div>
            <User className="w-6 h-6 rounded-full" />
          </div>
          <p className="text-sm">{email ?? "—"}</p>
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => console.log("logout")}>
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
