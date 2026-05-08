"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { SyntheticEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      enqueueSnackbar("Successfully logged in!", { variant: "success" });
      router.push("/");
      setEmail("");
      setPassword("");
    } catch (error: unknown) {
      console.log("Login Error",error)
      const message =
        error instanceof Error ? error.message : "Failed to login. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v18" />
                <path d="M3 12h18" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back!!
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Sign in to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg
                    className="size-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 0 1 8-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

