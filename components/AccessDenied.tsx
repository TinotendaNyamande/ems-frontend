export const AccessDenied = () => {
    return (
        <div className="flex min-h-1/4 justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 pt-20">
            <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-white/85 p-8 shadow-sm backdrop-blur">
                <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">403 Forbidden</p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Access denied</h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Your account is signed in, but your current role does not have permission to view this page or perform this action.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            If you need access, ask an organisation administrator to review your role and permission settings.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
