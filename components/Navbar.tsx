"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { CanPerformAction } from "./CanPerformAction";
import { PermissionKeys, UiPermissionKeys } from "@/contants/PermissionKey";

type NavItem = {
  href: string;
  label: string;
  auth?: "any" | "in" | "out";
  company?: "any" | "has" | "none";
  permission: string;
};

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
  return (first + (second ?? "")).toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthReady, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasCompany = Boolean(user?.organisationId);

  const navItems: NavItem[] = useMemo(
    () => [
      { href: "/", label: "Dashboard", auth: "any", permission: UiPermissionKeys.Allow },
      { href: "/users", label: "Users", auth: "in", company: "has", permission: PermissionKeys.UsersView },
      { href: "/roles", label: "Roles", auth: "in", company: "has", permission: PermissionKeys.PermissionsView },
      { href: "/manage", label: "Manage Org", auth: "in", company: "has", permission: PermissionKeys.OrganisationEdit },
      { href: "/requests", label: "Requests", auth: "in", company: "has", permission: PermissionKeys.JoinRequestsView },
      { href: "/email-accounts", label: "Email Accounts", auth: "in", company: "has", permission: PermissionKeys.MailBoxesView },
      { href: "/email-settings/email-categories", label: "Email Categories", auth: "in", company: "has", permission: PermissionKeys.MailBoxesView },
      { href: "/create-organisation", label: "Create Org", auth: "in", company: "none", permission: UiPermissionKeys.Allow },
      { href: "/join-organisation", label: "Join Org", auth: "in", company: "none", permission: UiPermissionKeys.Allow },
      { href: "/my-join-requests", label: "My Requests", auth: "in", company: "none", permission: UiPermissionKeys.Allow },
      { href: "/forgot-password", label: "Forgot Password", auth: "out", permission: UiPermissionKeys.Allow },
    ],
    []
  );

  const filteredNavItems = navItems.filter((item) => {
    const authOk =
      item.auth === "any" ||
      !item.auth ||
      (item.auth === "in" ? Boolean(user) : !user);

    const companyOk =
      item.company === "any" ||
      !item.company ||
      (item.company === "has" ? hasCompany : !hasCompany);

    return authOk && companyOk;
  });

  const firstName = user?.firstName?.trim() || "User";

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 text-sm font-bold text-white shadow-sm">
              EMS
            </div>
            <span className="hidden text-sm font-semibold text-slate-900 sm:block">
              Email Management System
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {filteredNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <CanPerformAction key={item.href} permission={item.permission}>
                  <Link

                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </CanPerformAction>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {!isAuthReady ? (
              <div className="h-9 w-40 animate-pulse rounded-md bg-slate-200/70" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <div className="grid size-7 place-items-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {getInitials(firstName)}
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {firstName}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:hidden"
            aria-controls="mobile-nav"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileOpen ? (
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={[
          "md:hidden",
          mobileOpen ? "block" : "hidden",
        ].join(" ")}
      >
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <nav className="flex flex-col gap-1">
            {filteredNavItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <CanPerformAction key={item.href} permission={item.permission}>
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </CanPerformAction>
              );
            })}
          </nav>

          <div className="mt-3 flex flex-col gap-2">
            {!isAuthReady ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-slate-200/70" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2">
                  <div className="grid size-9 place-items-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                    {getInitials(firstName)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">
                      {firstName}
                    </span>
                    <span className="text-xs text-slate-600">{user.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
