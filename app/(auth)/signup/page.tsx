"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { SyntheticEvent, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const MIN_PASSWORD_LENGTH = 4;

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const passwordTooShort = useMemo(
    () => password !== "" && password.length < MIN_PASSWORD_LENGTH,
    [password]
  );
  const confirmMismatch = useMemo(
    () => confirmPassword !== "" && confirmPassword !== password,
    [confirmPassword, password]
  );

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();

    if (passwordTooShort) {
      enqueueSnackbar(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, {
        variant: "error",
      });
      return;
    }

    if (confirmMismatch) {
      enqueueSnackbar("Passwords do not match", { variant: "error" });
      return;
    }

    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
      enqueueSnackbar("Sign up successful!", { variant: "success" });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      router.push("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign up";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-lg">
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
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Set up your profile to start managing team email.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="First name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  placeholder="Last name"
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                aria-invalid={passwordTooShort || undefined}
                className={[
                  "mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70",
                  passwordTooShort
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200",
                ].join(" ")}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              />
              {passwordTooShort ? (
                <p className="mt-1 text-xs text-rose-700">
                  Must be at least {MIN_PASSWORD_LENGTH} characters.
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                aria-invalid={confirmMismatch || undefined}
                className={[
                  "mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-70",
                  confirmMismatch
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                    : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200",
                ].join(" ")}
                placeholder="••••••••"
              />
              {confirmMismatch ? (
                <p className="mt-1 text-xs text-rose-700">Passwords do not match.</p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading || passwordTooShort || confirmMismatch}
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
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-indigo-700 hover:text-indigo-800">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
