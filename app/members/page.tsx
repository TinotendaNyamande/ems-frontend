"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { NoOrganisation } from "@/components/company/NoOrganisation";
import { useAuth } from "@/context/AuthContext";
import {
    assignRole,
    deleteMember,
    getOrganisationMembers,
    type OrganisationMemberDto,
} from "@/services/organisationMembers";
import { getCompanyRoles } from "@/services/roles";
import { formatRoleLabel, getMemberDisplayName } from "@/services/helper";
import { RoleModal } from "@/components/team/teamrolesmodal";
import { ProtectedPage } from "@/components/ProtectedPage";
import { CanPerformAction } from "@/components/CanPerformAction";
import { PermissionKeys, UiPermissionKeys } from "@/constants/permissionKeys";



export default function TeamPage() {
    const { user, isAuthReady, token } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const queryClient = useQueryClient();
    const [roleModalMember, setRoleModalMember] = useState<OrganisationMemberDto | null>(null);
    const companyId = user?.companyId ?? null;
    const userId = user?.id ?? null;
    const membersQueryKey = ["organisationMembers", companyId, token];
    const [selectedRole, setSelectedRole] = useState<string>("");

    const { data: companyRoles, isError: isRolesError, isLoading: isRolesLoading, error: rolesError } = useQuery({
        queryFn: () => getCompanyRoles(user?.companyId!, token!),
        enabled: isAuthReady && !!companyId && !!token,
        queryKey: ["companyRoles", companyId, token],
    });


    const {
        data: members,
        isLoading: isMembersLoading,
        error: membersError,
        isError: isMembersError,
        refetch: refetchMembers,
    } = useQuery({
        queryKey: membersQueryKey,
        enabled: isAuthReady && !!companyId && !!token,
        queryFn: () => getOrganisationMembers(companyId!, token),
    });

    const deleteMemberMutation = useMutation({
        mutationFn: (memberId: string) => deleteMember(memberId, token),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: membersQueryKey });
        },
    });

    const assignRoleMutation = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>

            assignRole(userId!, memberId, role, token),

        onSuccess: async (_, variables) => {
            enqueueSnackbar(`Assigned ${variables.role} role successfully.`, { variant: "success" });
            setRoleModalMember(null);
            await queryClient.invalidateQueries({ queryKey: membersQueryKey });
        },
        onError: (error: unknown) => {
            const message =
                error instanceof Error ? error.message : "Failed to assign role. Please try again.";
            enqueueSnackbar(message, { variant: "error" });
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
        <ProtectedPage permission={PermissionKeys.TeamView}>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
                    <section className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Organisation Members</h1>
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
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900">Organisation members</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                View current members and remove access when needed.
                            </p>
                        </div>

                        {isMembersLoading ? (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm text-slate-700">Loading organisation members...</p>
                            </div>
                        ) : isMembersError ? (
                            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                                <p className="text-sm font-semibold text-rose-900">Failed to load organisation members</p>
                                <p className="mt-1 text-sm text-rose-800">
                                    {(membersError as Error)?.message || "An unexpected error occurred."}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => refetchMembers()}
                                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : members?.length === 0 ? (
                            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <p className="text-sm font-semibold text-slate-900">No organisation members found</p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Your organisation does not have any members to display yet.
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-6 space-y-4">
                                {members?.map((member, index) => {
                                    const memberId = member.id ?? `member-${index}`;
                                    const isDeleting =
                                        deleteMemberMutation.isPending &&
                                        deleteMemberMutation.variables === member.id;

                                    return (
                                        <li
                                            key={memberId}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-100"
                                        >
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="min-w-0">
                                                    <h3 className="truncate text-base font-semibold text-slate-900">
                                                        {getMemberDisplayName(member)}
                                                    </h3>
                                                    <p className="mt-1 break-all text-sm text-slate-600">
                                                        {member.email?.trim() || "No email available"}
                                                    </p>
                                                    <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                        Role: {formatRoleLabel(member.role)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                                    <CanPerformAction permission={PermissionKeys.TeamManage}>
                                                        <button
                                                            type="button"
                                                            disabled={!member.id}
                                                            onClick={() => {
                                                                if (!member.id) {
                                                                    return;
                                                                }

                                                                setSelectedRole(member.role ?? "TeamMember");
                                                                setRoleModalMember(member);
                                                            }}
                                                            className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-amber-300"
                                                        >
                                                            Change role
                                                        </button>
                                                    </CanPerformAction>
                                                    <CanPerformAction permission={UiPermissionKeys.TeamDelete}>
                                                        <button
                                                            type="button"
                                                            disabled={!member.id || isDeleting}
                                                            onClick={() => {
                                                                if (!member.id) {
                                                                    return;
                                                                }

                                                                deleteMemberMutation.mutate(member.id);
                                                            }}
                                                            className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-rose-300"
                                                        >
                                                            {isDeleting ? "Deleting..." : "Delete"}
                                                        </button>
                                                    </CanPerformAction>

                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <RoleModal
                    companyRoles={companyRoles}
                    member={roleModalMember}
                    selectedRole={selectedRole}
                    isSaving={assignRoleMutation.isPending}
                    onClose={() => setRoleModalMember(null)}
                    onRoleChange={(role) => {
                        if (!roleModalMember?.id) {
                            return;
                        }
                        setSelectedRole(role);

                    }}
                    onSave={() => {
                        if (!roleModalMember?.id) {
                            return;
                        }

                        assignRoleMutation.mutate({
                            memberId: roleModalMember.id,
                            role: selectedRole ?? "TeamMember",
                        });
                    }}
                />
            </div>
        </ProtectedPage>
    );
}
