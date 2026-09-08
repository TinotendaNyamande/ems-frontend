"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, getUserById } from "@/services/users";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useParams } from "next/dist/client/components/navigation";


export default function OrganisationUsersPage() {
    const { user, isAuthReady, token } = useAuth();
    const params = useParams<{ id: string }>();


    const usersQueryKey = useMemo(
        () => ["all-users", token],
        [token]
    );

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: usersQueryKey,
        enabled: isAuthReady && Boolean(token),
        queryFn: () => getUserById(token!, params.id),
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

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div
                        className="px-4 py-4"
                    >
                        <div className="space-y-3 grid grid-cols-2 gap-4 space-y-0 items-center">
                            <div>
                                <p className="text-xs font-medium text-slate-500 ">Full Name</p>
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900">
                                    {data?.firstName} {data?.lastName}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-500 ">Email</p>
                            </div>

                            <div>
                                <p className="break-all text-slate-700">
                                    {data?.email}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-500 ">Role</p>

                            </div>
                            <div>
                                <p className="break-all text-slate-700">
                                    {data?.role}
                                </p>
                            </div>
                            <div>
                                <button className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">Edit</button>

                            </div>
                            <div>
                                <button className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-red-600 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">Delete</button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
