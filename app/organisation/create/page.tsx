"use client";

import { useRouter } from "next/navigation";
import { useSnackbar } from "notistack";
import { SyntheticEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createOrganisation } from "@/services/organisation";

export default function LoginPage() {
  const [organisationName, setOrganisationName] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, token, logout } = useAuth();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!token) {
        throw new Error("Authentication token is missing");
      }

      const data = await createOrganisation(organisationName,user?.id, token);
      enqueueSnackbar("Successfully   created organisation!You need to log in again", { variant: "success" });
      setTimeout(() => {
        logout();
        router.push("/login");
      },2000)

    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create organisation. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="text-center">
            <p className="mt-1 text-sm text-slate-600">
              Create an organisation to start managing projects.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="organisationName" className="block text-sm font-medium text-slate-700">
                Organisation Name
              </label>
              <input
                id="organisationName"
                type="text"
                required
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="Enter organisation name"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token}
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
                  Just one second...
                </>
              ) : (
                "Create Organisation"
              )}
            </button>
          </form>
        </div>
      </div >
    </div >
  );
}
