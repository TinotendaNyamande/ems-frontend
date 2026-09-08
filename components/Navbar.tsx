"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const COLLAPSED_WIDTH = "4.75rem";
const EXPANDED_WIDTH = "17rem";

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
  return (first + (second ?? "")).toUpperCase();
}



function hasAdminAccess(role?: string | null) {
  const normalized = role?.trim().toLowerCase();
  return normalized === "admin" || normalized === "supervisor";
}

function getNavItems(role?: string | null): NavItem[] {
  const adminAccess = hasAdminAccess(role);

  if (adminAccess) {
    return [
      {
        href: "/",
        label: "Dashboard",
        icon: (
          <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
        ),
      },
      {
        href: "/email-accounts",
        label: "Email accounts",
        icon: (
          <path d="M12 3 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-4Z" />
        ),
      },
      {
        href: "/users",
        label: "Users",
        icon: (
          <>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </>
        ),
      },

      {
        href: "/tasks",
        label: "My Tasks",
        icon: (
          <>
            <path d="M9 11 12 14 22 4" />
            <path d="M21 12.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11.5" />
          </>
        ),
      },
    ];
  }

  return [
    {
      href: "/",
      label: "Dashboard",
      icon: (
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
      ),
    },
    {
      href: "/tasks",
      label: "My Tasks",
      icon: (
        <>
          <path d="M9 11 12 14 22 4" />
          <path d="M21 12.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11.5" />
        </>
      ),
    },
    {
      href: "/tasks/all",
      label: "All tasks",
      icon: (
        <>
          <path d="M9 11 12 14 22 4" />
          <path d="M21 12.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11.5" />
          <path d="M4 16h16" />
        </>
      ),
    },
  ];
}

function SidebarLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={[
        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
        collapsed ? "justify-center" : "",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {item.icon}
      </svg>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthReady, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("ems-sidebar-collapsed");
    if (saved === "1") return true;
    if (saved === "0") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });

  const navItems = useMemo(() => getNavItems(user?.role), [user?.role]);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      "--app-sidebar-width",
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    );
    window.localStorage.setItem("ems-sidebar-collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  const firstName = user?.firstName?.trim() || "User";

  const handleSignOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-[var(--app-sidebar-width)] border-r border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-end gap-3 border-b border-slate-200 px-4 py-4">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {collapsed ? <path d="m9 18 6-6-6-6" /> : <path d="m15 18-6-6 6-6" />}
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          {!collapsed ? (
            <div className="mb-3 rounded-2xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{user?.email || "Guest"}</p>
              <p className="mt-1 text-xs text-slate-500">{firstName}</p>
            </div>
          ) : null}

          <div className={collapsed ? "flex flex-col gap-2" : "flex items-center gap-2"}>
            {isAuthReady && user ? (
              <>
                <div
                  className={[
                    "grid shrink-0 place-items-center rounded-full bg-indigo-600 font-semibold text-white",
                    collapsed ? "size-10 text-xs" : "size-9 text-xs",
                  ].join(" ")}
                  title={user.email}
                >
                  {getInitials(firstName)}
                </div>
                {!collapsed ? (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{firstName}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/70" />
            )}
          </div>

          <div className={collapsed ? "mt-3 grid gap-2" : "mt-3 grid gap-2"}>
            {user ? (
              <button
                type="button"
                onClick={handleSignOut}
                className={[
                  "inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  collapsed ? "w-full" : "",
                ].join(" ")}
              >
                {collapsed ? "Out" : "Sign out"}
              </button>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {collapsed ? "In" : "Log in"}
              </Link>
            )}

          </div>
        </div>
      </div>
    </aside>
  );
}
