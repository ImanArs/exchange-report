import { NavLink } from "react-router-dom";
import { Home, History } from "lucide-react";

const items = [
  { to: "/", label: "Новая", Icon: Home },
  { to: "/deals", label: "История", Icon: History },
];

export function BottomNavigation() {
  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#BEBEBE]/30 bg-[#434377]/95 backdrop-blur supports-[backdrop-filter]:bg-[#434377]/80">
      <div className="max-w-[700px] mx-auto px-4 py-2 flex items-center justify-around text-white">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-1 py-1 px-3 rounded-md text-xs transition-colors",
                isActive ? "text-[#FFFFFF] bg-[#6161D6]/30" : "text-white/80 hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

