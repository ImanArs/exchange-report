/* eslint-disable @typescript-eslint/no-explicit-any */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { Toaster } from "sonner";
import DealsPage from "@/features/deals/pages/DealsPage";
import NewTransactionForm from "@/features/new-transaction/ui/NewTransactionForm";
import { useAuth } from "@/shared/auth/useAuth";
import LoginPage from "@/features/auth/LoginPage";
import { Header } from "./widgets/header";
import { BottomNavigation } from "./widgets/BottomNavigation";
import { useAppStore, type StoreState } from "@/shared/store/appStore";
import { useEffect } from "react";

const qc = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      const e = error as any;
      if (e?.status === 401 || /jwt|auth/i.test(String(e?.message ?? ""))) {
        if (location.hash !== "#/login") window.location.hash = "#/login";
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const e = error as any;
      if (e?.status === 401 || /jwt|auth/i.test(String(e?.message ?? ""))) {
        if (location.hash !== "#/login") window.location.hash = "#/login";
      }
    },
  }),
});

// eslint-disable-next-line react-refresh/only-export-components
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, userId } = useAuth();
  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Загрузка…</div>;
  if (!userId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// ⟵ LAYOUT ВНУТРИ ROUTER (Header теперь в контексте Router)
// eslint-disable-next-line react-refresh/only-export-components
function RootLayout() {
  // keep layout UI untouched, but sync auth → global store
  const setUser = useAppStore((s: StoreState) => s.setUser);
  const { userId, email } = useAuth();
  const location = useLocation();
  const hideHeader = location.pathname === "/login";
  useEffect(() => {
    setUser(userId ? { id: userId, email } : null);
  }, [setUser, userId, email]);
  return (
    <>
      {!hideHeader && <Header />}
      <div className="min-h-screen w-full">
        <Toaster richColors position="top-right" />
        <div className="p-2 max-w-[700px] flex flex-col pt-10 pb-20 sm:pb-0 items-center justify-center w-full mx-auto">
          <Outlet />
        </div>
      </div>
      {!hideHeader && <BottomNavigation />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <HashRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route
              index
              element={
                <RequireAuth>
                  <NewTransactionForm />
                </RequireAuth>
              }
            />
            <Route
              path="deals"
              element={
                <RequireAuth>
                  <DealsPage />
                </RequireAuth>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>
);
