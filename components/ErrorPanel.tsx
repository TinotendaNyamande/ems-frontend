export const ErrorPanel = ({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) =>{
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
      <p className="text-sm font-semibold text-rose-900">{title}</p>
      <p className="mt-1 text-sm text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
      >
        Retry
      </button>
    </div>
  );
}