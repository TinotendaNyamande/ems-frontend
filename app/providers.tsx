"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { SnackbarProvider } from "notistack";
import { notify } from "@/lib/notification";
import { usePathname } from "next/navigation";
import { ConfirmProvider } from "@/lib/confirmProvider";


export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
          <Navbar key={pathname} />
          <ConfirmProvider>
            <main style={{ width: "100%", maxWidth: "100vw" }}>{children}</main>
          </ConfirmProvider>

          {/* <SiteFooter /> */}
        </SnackbarProvider>
      </AuthProvider>
    </QueryClientProvider>
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
