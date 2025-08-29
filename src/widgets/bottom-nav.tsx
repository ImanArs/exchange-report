import { NavLink } from "react-router-dom";
import { Home, History } from "lucide-react";

export function BottomNav() {
  // показываем только на мобильных
  return (
    <nav
      className="
        sm:hidden
        fixed bottom-0 left-0 right-0 z-50
        bg-[#434377]/90 backdrop-blur
        border-t border-[#BEBEBE]/30
        px-6 pb-[max(env(safe-area-inset-bottom),8px)] pt-2
      "
    >
      <ul className="flex items-center justify-between gap-8">
        <li className="flex-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              [
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[#6161D6] text-white"
                  : "text-white/80 hover:bg-white/10",
              ].join(" ")
            }
            aria-label="Главная"
          >
            <Home className="h-6 w-6" />
          </NavLink>
        </li>
        <li className="flex-1">
          <NavLink
            to="/deals"
            className={({ isActive }) =>
              [
                "mx-auto flex h-10 w-10 items-center justify-center rounded-full transition",
                isActive
                  ? "bg-[#6161D6] text-white"
                  : "text-white/80 hover:bg-white/10",
              ].join(" ")
            }
            aria-label="История"
          >
            <History className="h-6 w-6" />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
