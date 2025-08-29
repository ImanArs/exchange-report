/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/shared/supabase/client";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";

type Mode = "login" | "register" | "forgot" | "reset";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  // register
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);

  // forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [loadingForgot, setLoadingForgot] = useState(false);

  // reset (после письма)
  const [newPassword, setNewPassword] = useState("");
  const [loadingReset, setLoadingReset] = useState(false);

  // роуты
  const redirectAfterLogin = useMemo(() => "#/deals", []);
  const redirectTo = useMemo(() => `${window.location.origin}/#/login`, []);

  // единый эффект: обмениваем ?code= на сессию и показываем экран reset
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hasRecoveryFlag =
      /(^|[?&#])type=recovery(&|$)/i.test(window.location.search) ||
      /(^|[?&#])type=recovery(&|$)/i.test(window.location.hash);

    (async () => {
      try {
        // если уже есть сессия — обмен кода не нужен
        const { data: sessionRes } = await supabase.auth.getSession();
        const hasSession = !!sessionRes.session;

        if (code && !hasSession) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error(error);
            toast.error("Не удалось подтвердить ссылку восстановления");
            return;
          }
          // убрать ?code= из URL (оставить hash-роутинг)
          window.history.replaceState(
            null,
            "",
            `${url.origin}${url.pathname}${url.hash}`
          );
        }

        if (hasRecoveryFlag || code) {
          setMode("reset");
        }
      } catch (e: any) {
        toast.error(e?.message ?? "Ошибка восстановления");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setLoadingLogin(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.hash = redirectAfterLogin;
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка входа");
    } finally {
      setLoadingLogin(false);
    }
  };

  const signUp = async () => {
    try {
      setLoadingReg(true);
      const { data, error } = await supabase.auth.signUp({
        email: regEmail,
        password: regPassword,
      });
      if (error) throw error;
      if (data.user)
        toast.message("Проверьте почту для подтверждения регистрации");
      setMode("login");
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка регистрации");
    } finally {
      setLoadingReg(false);
    }
  };

  const requestReset = async () => {
    if (!forgotEmail) {
      toast.message("Введите email");
      return;
    }
    try {
      setLoadingForgot(true);
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo,
      });
      if (error) throw error;
      toast.success("Письмо отправлено. Откройте ссылку из почты.");
      setMode("login");
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка отправки письма");
    } finally {
      setLoadingForgot(false);
    }
  };

  const saveNewPassword = async () => {
    if (!newPassword) {
      toast.message("Введите новый пароль");
      return;
    }
    try {
      setLoadingReset(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Пароль обновлен");
      window.location.hash = redirectAfterLogin;
    } catch (e: any) {
      toast.error(e?.message ?? "Ошибка обновления пароля");
    } finally {
      setLoadingReset(false);
    }
  };

  return (
    <div className="w-full bg-[#16171A]/30 text-white">
      <div className="w-full border border-[#BEBEBE]/30 rounded-[20px] bg-[#434377]/30 p-6 shadow-sm">
        {mode === "login" && (
          <>
            <h1 className="mb-1 text-2xl font-semibold">Вход</h1>
            <p className="mb-4 text-sm opacity-80">Введите email и пароль.</p>

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

              <div className="w-full flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setMode("forgot")}
                  className="px-0 text-white"
                >
                  Забыли пароль?
                </Button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <Button
                  disabled={loadingLogin}
                  onClick={signIn}
                  className={cn(
                    "w-full rounded-[45px] px-6 bg-gradient-to-b from-[#6262D9] to-[#9D62D9]"
                  )}
                >
                  {loadingLogin ? "Входим…" : "Войти"}
                </Button>
              </div>

              <div className="pt-2 text-sm text-center">
                Еще не зарегистрированы?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1 text-white underline"
                  onClick={() => setMode("register")}
                >
                  Создать аккаунт
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === "register" && (
          <>
            <h1 className="mb-1 text-2xl font-semibold">Регистрация</h1>
            <p className="mb-4 text-sm opacity-80">
              Введите email и пароль. На почту придет письмо для подтверждения.
            </p>

            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-sm" htmlFor="reg_email">
                  Email
                </label>
                <Input
                  id="reg_email"
                  placeholder="you@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
                />
              </div>
              <div className="grid gap-1">
                <label className="text-sm" htmlFor="reg_password">
                  Пароль
                </label>
                <Input
                  id="reg_password"
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-white"
                  onClick={() => setMode("login")}
                >
                  Уже есть аккаунт? Войти
                </Button>
              </div>
              <div className="w-full flex items-center justify-between pt-3">
                <Button
                  onClick={signUp}
                  disabled={loadingReg}
                  className="w-full rounded-[45px] px-6 bg-[#6161D6] hover:bg-[#6161D6]/90"
                >
                  {loadingReg ? "Отправка…" : "Зарегистрироваться"}
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === "forgot" && (
          <>
            <h1 className="mb-1 text-2xl font-semibold">Восстановление</h1>
            <p className="mb-4 text-sm opacity-80">
              Укажите email. Мы отправим ссылку для сброса пароля.
            </p>

            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-sm" htmlFor="forgot_email">
                  Email
                </label>
                <Input
                  id="forgot_email"
                  placeholder="you@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
                />
              </div>

              <div className="flex flex-col gap-3 items-center justify-between pt-3">
                <Button
                  onClick={requestReset}
                  disabled={loadingForgot}
                  className="w-full rounded-[45px] px-6 bg-[#6161D6] hover:bg-[#6161D6]/90"
                >
                  {loadingForgot ? "Отправка…" : "Отправить ссылку"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-white"
                  onClick={() => setMode("login")}
                >
                  Назад к входу
                </Button>
              </div>
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <h1 className="mb-1 text-2xl font-semibold">Новый пароль</h1>
            <p className="mb-4 text-sm opacity-80">
              Вы перешли по ссылке из письма. Установите новый пароль.
            </p>

            <div className="space-y-3">
              <div className="grid gap-1">
                <label className="text-sm" htmlFor="new_password">
                  Новый пароль
                </label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#434377] text-white placeholder:text-white/50 border-0 focus-visible:ring-[#6161D6]"
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <Button
                  onClick={saveNewPassword}
                  disabled={loadingReset}
                  className="rounded-[45px] px-6 bg-[#6161D6] hover:bg-[#6161D6]/90"
                >
                  {loadingReset ? "Сохраняю…" : "Сохранить пароль"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => setMode("login")}
                >
                  Отмена
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
