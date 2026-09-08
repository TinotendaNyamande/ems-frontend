"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers } from "@/services/users";
import { ErrorPanel } from "@/components/ErrorPanel";


export default function OrganisationUsersPage() {
  const { user, isAuthReady, token } = useAuth();

  const usersQueryKey = useMemo(
    () => ["all-users", token],
    [token]
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



  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p>Not logged in</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Users and permissions
              </h1>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="hidden md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(12rem,0.8fr)] bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Name</span>
            <span>Email</span>
            <span>Current Role</span>
          </div>

          <ul className="divide-y divide-slate-200">
            {users?.map((user) => (
              <li
                key={user.id}
                className="px-4 py-4"
              >
                <div className="space-y-3 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(12rem,0.8fr)] md:gap-4 md:space-y-0 md:items-center">
                  <div>
                    <p className="text-xs font-medium text-slate-500 md:hidden">Name</p>
                    <p className="font-semibold text-slate-900">
                      <Link href={`/users/${user.id}`} className="hover:underline">
                        {user.firstName} {user.lastName}
                      </Link>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 md:hidden">Email</p>
                    <p className="break-all text-slate-700">
                      {user.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 md:hidden">Role</p>
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {user.role}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
