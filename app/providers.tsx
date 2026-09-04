"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { SnackbarProvider } from "notistack";
import { notify } from "@/lib/notification";
import { ConfirmProvider } from "@/lib/confirmProvider";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            notify(getErrorMessage(error), { variant: "error" });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            notify(getErrorMessage(error), { variant: "error" });
          },
        }),
        defaultOptions: {
          queries: {
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center",
          }}
        >
          <Navbar />
          <Chrome>{children}</Chrome>

          {/* <SiteFooter /> */}
        </SnackbarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Chrome({ children }: { children: React.ReactNode }) {
  const { user, isAuthReady, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div
      style={{
        marginLeft: "var(--app-sidebar-width, 17rem)",
        transition: "margin-left 200ms ease",
        minWidth: 0,
      }}
    >
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-sm font-bold text-white shadow-sm">
                EMS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">Email Management System</p>
                <p className="text-xs text-slate-500">Workspace overview</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthReady ? (
              <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-200/70" />
            ) : user ? (
              <>
                <div className="hidden items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 sm:flex">
                  <span className="text-sm font-medium text-slate-800">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <ConfirmProvider>
        <main style={{ minWidth: 0 }}>{children}</main>
      </ConfirmProvider>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (error instanceof Error && error.message) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Something went wrong.";
  }
}
