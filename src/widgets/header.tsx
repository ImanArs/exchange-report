import { Button } from "@/shared/ui/button";
import { MoreVertical, User } from "lucide-react";
import { Link } from "react-router-dom";
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
          <div className="text-sm text-green-500 font-medium">
            +17$ за сегодня
          </div>
          <p className="text-lg font-semibold">122112$</p>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[#6161D6] px-3 py-1">
          <div>
            <User className="w-6 h-6 rounded-full" />
          </div>
          <p className="text-sm">email.com</p>
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
