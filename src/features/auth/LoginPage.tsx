import { useState } from "react";
import { supabase } from "@/shared/supabase/client";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    <div className="min-h-dvh grid place-items-center bg-background text-foreground">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow">
        <h1 className="mb-4 text-2xl font-semibold">Login</h1>
        <div className="space-y-3">
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="email">Email</label>
            <Input id="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1">
            <label className="text-sm" htmlFor="password">Пароль</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button disabled={loading} onClick={signIn}>Войти</Button>
            <Button disabled={loading} variant="secondary" onClick={signUp}>Регистрация</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

