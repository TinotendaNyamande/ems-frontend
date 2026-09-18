"use client";

import Link from "next/link";
import { SyntheticEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers } from "@/services/users";
import { ErrorPanel } from "@/components/ErrorPanel";
import { MIN_PASSWORD_LENGTH, register } from "@/services/auth";
import { useSnackbar } from "notistack";
import { useRouter } from "next/navigation";

export default function OrganisationUsersPage() {
  const { user, isAuthReady, token } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Member");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const usersQueryKey = useMemo(
    () => ["all-users", token],
    [token]
  );
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
  const {
    data: users,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: usersQueryKey,
    enabled: isAuthReady && Boolean(token),
    queryFn: () => getAllUsers(token!),
  });
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
      console.log("Role selected:", role);
      await register(email, password, firstName, lastName,role);
      enqueueSnackbar("User created successfully!", { variant: "success" });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setIsModalOpen(false);
      refetchUsers();

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };



  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Not logged in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 lg:px-10">
      <main className="mx-auto w-full max-w-7xl">

        <section className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Users and Roles
              </h1>

            </div>
            <div className="flex grid grid-cols-2 gap-4">
              {users && (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm">
                  <span className="text-sm text-slate-500">
                    Total users
                  </span>

                  <span className="ml-2 text-sm font-semibold text-slate-900">
                    {users.length}
                  </span>
                </div>
              )}
              <div className="">
                <button onClick={() => setIsModalOpen(true)} className="my-primary-btn ">
                  Add User
                </button>
              </div>

            </div>

          </div>
        </section>

        {isUsersError && (
          <div className="mb-6">
            <ErrorPanel
              title="Error loading users"
              message={usersError.message}
              onRetry={() => refetchUsers()}
            />
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="grid grid-cols-[1.5fr_1.5fr_1fr_8rem] items-center border-b border-slate-200 bg-slate-50 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Name
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Role
            </span>

            <span className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Actions
            </span>
          </div>

          {isUsersLoading && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              Loading users...
            </div>
          )}

          {!isUsersLoading && users?.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-slate-900">
                No users found
              </p>

              <p className="mt-1 text-sm text-slate-500">
                There are currently no users in this organisation.
              </p>
            </div>
          )}

          {!isUsersLoading && users && users.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {users.map((user) => (
                <li
                  key={user.id}
                  className="group grid grid-cols-[1.5fr_1.5fr_1fr_8rem] items-center px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/users/${user.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                    >
                      {user.firstName} {user.lastName}
                    </Link>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-600">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                      {user.role}
                    </span>
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                      View details
                      <span
                        aria-hidden="true"
                        className="text-slate-400 transition-transform group-hover:translate-x-0.5"
                      >
                        →
                      </span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="fixed inset-0 bg-black/40"
              onClick={() => setIsModalOpen(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg mx-4"
            >
              <div className="mb-4 flex items-start justify-between">
                <h2 className="text-lg font-semibold">Add user</h2>
                <button
                  type="button"
                  aria-label="Close modal"
                  onClick={() => setIsModalOpen(false)}
                  className="-mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                    Role
                  </label>
                  <select
                    id="role"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={loading}
                    className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <option value="Member">Member</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
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
                      Creating user...
                    </>
                  ) : (
                    "Create user"
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

