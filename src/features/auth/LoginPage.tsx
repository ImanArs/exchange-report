/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { supabase } from "@/shared/supabase/client";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.href = "/deals";
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        toast.success("Регистрация успешна. Выполняем вход…");
        await signIn();
      } else {
        toast.message("Проверьте почту для подтверждения");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#16171A]/30 text-white">
      <div className="w-full border border-[#BEBEBE]/30 rounded-[20px] bg-[#434377]/30 p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-semibold">Вход</h1>

        <div className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="email">
              Email
            </label>
            <Input
              id="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
            />
          </div>

          <div className="grid gap-1">
            <label className="text-sm" htmlFor="password">
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button
              disabled={loading}
              onClick={signIn}
              className={cn(
                "w-full rounded-[45px] text-white",
                "bg-gradient-to-b from-[#6262D9] to-[#9D62D9]"
              )}
            >
              {loading ? "Входим…" : "Войти"}
            </Button>
            <Button
              disabled={loading}
              variant="secondary"
              onClick={signUp}
              className={cn(
                "w-full rounded-[45px] text-white",
                "bg-[#434377] hover:bg-[#6161D6]"
              )}
            >
              Регистрация
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
