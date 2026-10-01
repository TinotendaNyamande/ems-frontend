"use client";

import { useEffect, useState, useCallback } from "react";
import { getAttachment } from "@/services/tasks"; // adjust import path as needed

interface AttachmentModalProps {
  attachmentId: string;
  fileName: string;
  fileType: string;
  open: boolean;
  onClose: () => void;
}

export default function AttachmentModal({
  attachmentId,
  fileName,
  fileType,
  open,
  onClose,
}: AttachmentModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine file type category
  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType?.includes("pdf");
  const isText =
    fileType?.startsWith("text/") ||
    fileType?.includes("json") ||
    fileType?.includes("xml");
  const canPreview = isImage || isPdf || isText;

  const loadAttachment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await getAttachment(attachmentId);
      // Create a blob URL that the browser can render
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load attachment.");
    } finally {
      setIsLoading(false);
    }
  }, [attachmentId]);

  useEffect(() => {
    if (open && attachmentId) {
      loadAttachment();
    }
    // Cleanup blob URL when modal closes or attachment changes
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attachmentId]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="flex w-full max-w-5xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-4">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-900">
              {fileName}
            </h3>
            <p className="truncate text-xs text-slate-500">{fileType}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!blobUrl}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              aria-label="Close"
            >
              <svg
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <svg
                className="size-8 animate-spin text-indigo-600"
                viewBox="0 0 24 24"
                fill="none"
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
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : error ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <p className="text-sm font-semibold text-rose-600">{error}</p>
              <button
                type="button"
                onClick={loadAttachment}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : blobUrl ? (
            <>
              {isImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={blobUrl}
                  alt={fileName}
                  className="mx-auto max-h-[70vh] rounded-lg shadow-md object-contain"
                />
              )}
              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={fileName}
                  className="h-[70vh] w-full rounded-lg bg-white shadow-md"
                />
              )}
              {isText && (
                <iframe
                  src={blobUrl}
                  title={fileName}
                  className="h-[70vh] w-full rounded-lg bg-white shadow-md"
                />
              )}
              {!canPreview && (
                <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                  <span className="text-5xl">📎</span>
                  <p className="text-sm text-slate-600">
                    This file type cannot be previewed in the browser.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                  >
                    Download File
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}