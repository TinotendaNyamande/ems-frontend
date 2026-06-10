"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";
import { useAuth } from "@/context/AuthContext";
import { getRolesForOrganisation, type RoleDto } from "@/services/roles";
import { ProtectedPage } from "@/components/ProtectedPage";
import { PermissionKeys } from "@/contants/PermissionKey";

function countAllowedPermissions(role: RoleDto) {
  return role.permissions.filter((permission) => permission.isAllowed).length;
}

export default function OrganisationRolesPage() {
  const { user, isAuthReady, token } = useAuth();
  const organisationId = user?.organisationId ?? "";

  const {
    data: roles,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["organisationRoles", organisationId, token],
    enabled: isAuthReady && Boolean(organisationId && token),
    queryFn: () => getRolesForOrganisation(organisationId, token!),
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

  if (!organisationId) {
    return <NoOrganisation />;
  }

  return (
    <ProtectedPage permission={PermissionKeys.PermissionsView}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white/75 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
                  Organisation access
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Roles
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  Review every organisation role and open a role to manage its permissions.
                </p>
              </div>
              {/* <Link
                href="/organisation"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-300 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                Back to organisation
              </Link> */}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Organisation roles</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Each role groups permissions that can be assigned to users.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                {roles?.length ?? 0} roles
              </span>
            </div>

            {isLoading ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm text-slate-700">Loading roles...</p>
              </div>
            ) : isError ? (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
                <p className="text-sm font-semibold text-rose-900">Could not load roles</p>
                <p className="mt-1 text-sm text-rose-800">
                  {(error as Error)?.message || "An unexpected error occurred."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : roles?.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm font-semibold text-slate-900">No roles found</p>
                <p className="mt-1 text-sm text-slate-600">
                  Organisation roles will appear here once they are configured.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {roles?.map((role) => {
                  const allowedCount = countAllowedPermissions(role);
                  const totalCount = role.permissions.length;

                  return (
                    <Link
                      key={role.id}
                      href={`/roles/${role.id}`}
                      className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-slate-900">
                            {role.roleName}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {allowedCount} of {totalCount} permissions allowed
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-indigo-700 opacity-0 transition group-hover:opacity-100">
                          Open -&gt;
                        </span>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-indigo-600"
                          style={{
                            width: totalCount ? `${(allowedCount / totalCount) * 100}%` : "0%",
                          }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </ProtectedPage>
  );
}
