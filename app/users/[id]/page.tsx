"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
import { getAllUsers, getUserById, AssignUserRole } from "@/services/users";
import { ErrorPanel } from "@/components/ErrorPanel";
import { useParams } from "next/dist/client/components/navigation";


export default function OrganisationUsersPage() {
    const { user, isAuthReady, token } = useAuth();
    const params = useParams<{ id: string }>();
    const { enqueueSnackbar } = useSnackbar();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editRole, setEditRole] = useState<string>("Member");
    const [saving, setSaving] = useState(false);


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

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-20">
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
                                <button onClick={() => { setEditRole(data?.role ?? "Member"); setIsEditOpen(true); }} className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-indigo-600 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">Edit</button>

                            </div>
                            <div>
                                <button className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm ring-1 ring-red-600 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">Delete</button>
                            </div>
                        </div>
                    </div>
                </section>
                {isEditOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="fixed inset-0 bg-black/40" onClick={() => setIsEditOpen(false)} />
                        <div role="dialog" aria-modal="true" className="relative z-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg mx-4">
                            <div className="mb-4 flex items-start justify-between">
                                <h3 className="text-lg font-semibold">Edit user</h3>
                                <button type="button" aria-label="Close" onClick={() => setIsEditOpen(false)} className="-mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200">×</button>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                if (!token) return;
                                setSaving(true);
                                try {
                                    await AssignUserRole(token, params.id!, editRole);
                                    enqueueSnackbar("Role updated", { variant: "success" });
                                    refetch();
                                    setIsEditOpen(false);
                                } catch (err: unknown) {
                                    const msg = err instanceof Error ? err.message : "Failed to update role";
                                    enqueueSnackbar(msg, { variant: "error" });
                                } finally {
                                    setSaving(false);
                                }
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Full name</label>
                                    <p className="mt-1 text-slate-900">{data?.firstName} {data?.lastName}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Email</label>
                                    <p className="mt-1 break-all text-slate-700">{data?.email}</p>
                                </div>

                                <div>
                                    <label htmlFor="editRole" className="block text-sm font-medium text-slate-700">Role</label>
                                    <select id="editRole" value={editRole} onChange={(e) => setEditRole(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200">
                                        <option value="Member">Member</option>
                                        <option value="Supervisor">Supervisor</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <button type="button" onClick={() => setIsEditOpen(false)} className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">Cancel</button>
                                    <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">{saving ? 'Saving...' : 'Save'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
