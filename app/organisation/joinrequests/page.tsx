"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/company/NoOrganisation";
import { useAuth } from "@/context/AuthContext";
import {
    approveCompanyJoinRequest,
    CompanyJoinRequestDto,
    getPendingCompanyJoinRequests,
} from "@/services/companyJoinRequests";
import { getCompanyRoles } from "@/services/roles";
import { formatDateTime, getUserDisplayName } from "@/services/helper";
import { JoinRequestRoleModal } from "@/components/team/JoinRequestRolesModal";
import { ProtectedPage } from "@/components/ProtectedPage";
import { CanPerformAction } from "@/components/CanPerformAction";
import { PermissionKeys } from "@/constants/permissionKeys";

export default function TeamPage() {
    const { user, isAuthReady, token } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [selectedRequest, setSelectedRequest] = useState<CompanyJoinRequestDto | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>("TeamMember");
    const companyId = user?.companyId ?? null;
    const userId = user?.id ?? null;
    const membersQueryKey = ["organisationMembers", companyId, token];
    const joinRequestsQueryKey = ["companyJoinRequests", companyId, token];

    const { data: companyRoles, isError: isRolesError, isLoading: isRolesLoading, error: rolesError } = useQuery({
        queryFn: () => getCompanyRoles(user?.companyId!, token!),
        enabled: isAuthReady && !!companyId && !!token,
        queryKey: ["companyRoles", companyId, token],
    });


    const {
        data: joinRequests,
        isLoading: isJoinRequestsLoading,
        error: joinRequestsError,
        isError: isJoinRequestsError,
        refetch: refetchJoinRequests,
    } = useQuery({
        queryKey: joinRequestsQueryKey,
        enabled: isAuthReady && !!companyId && !!token,
        queryFn: () => getPendingCompanyJoinRequests(companyId!, token),
    });

    const approveRequestMutation = useMutation({
        mutationFn: (requestId: string | null) => approveCompanyJoinRequest(requestId, userId!, selectedRole, token),
        onSuccess: async (_, requestId) => {
            setSelectedRequest(null);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: joinRequestsQueryKey }),
                queryClient.invalidateQueries({ queryKey: membersQueryKey }),
                queryClient.invalidateQueries({ queryKey: ["companyJoinRequest", requestId, token] }),
            ]);
        },
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

    if (!companyId) {
        return <NoOrganisation />;
    }

    return (
        <ProtectedPage permission={PermissionKeys.JoinRequestsView}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
                    <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Team</h1>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    Manage your organisation members and review company join requests in one place.
                                </p>
                            </div>
                            <Link
                                href="/organisation"
                                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                            >
                                Back to organisation
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-slate-900">Pending join requests</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Review requests from people who want to join this organisation.
                                </p>
                            </div>
                            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                {joinRequests?.length ?? 0} pending
                            </span>
                        </div>

                        {isJoinRequestsLoading ? (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-700">Loading join requests...</p>
                            </div>
                        ) : isJoinRequestsError ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                                <p className="text-sm font-semibold text-rose-900">Failed to load join requests</p>
                                <p className="mt-1 text-sm text-rose-800">
                                    {(joinRequestsError as Error)?.message || "An unexpected error occurred."}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => refetchJoinRequests()}
                                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : joinRequests?.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">No pending requests</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    New company join requests will appear here when someone applies.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                                <ul className="space-y-4">
                                    {joinRequests?.map((request, index) => {
                                        const requestId = request.id ?? `request-${index}`;
                                        const isApproving =
                                            approveRequestMutation.isPending &&
                                            approveRequestMutation.variables === request.id;

                                        return (
                                            <li
                                                key={requestId}
                                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
                                            >
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-base font-semibold text-slate-900">
                                                            {getUserDisplayName(request.requestBy)}
                                                        </h3>
                                                        <p className="mt-1 break-all text-sm text-slate-600">
                                                            {request.requestBy?.email?.trim() || "No email available"}
                                                        </p>
                                                        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                                                            Requested {formatDateTime(request.requestedAt)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <CanPerformAction permission={PermissionKeys.JoinRequestsApprove}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedRequest(request)}
                                                                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-emerald-300"
                                                            >
                                                                Approve
                                                            </button>
                                                        </CanPerformAction>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>


                            </div>
                        )}
                    </section>
                </div>

                <JoinRequestRoleModal
                    request={selectedRequest}
                    selectedRole={selectedRole}
                    companyRoles={companyRoles}
                    isSaving={approveRequestMutation.isPending}
                    onClose={() => {
                        setSelectedRequest(null);
                        setSelectedRole("TeamMember");
                    }}
                    onRoleChange={(role) => { setSelectedRole(role); }}
                    onSave={() => {
                        if (!selectedRequest || !selectedRequest.id) {
                            return;
                        }

                        approveRequestMutation.mutate(selectedRequest.id);
                    }}
                />
            </div>
        </ProtectedPage>
    );
}
