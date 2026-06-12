"use client";

import ConfirmDialog from "@/components/ConfirmDialog";
import { ConfirmContext } from "@/context/useConfirm";
import {
  useState,
  useRef,
} from "react";


interface ConfirmState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialog, setDialog] =
    useState<ConfirmState | null>(null);

  const resolver =
    useRef<(value: boolean) => void>(null);

  const confirm = (
    options: ConfirmState
  ): Promise<boolean> => {
    setDialog(options);

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  };

  const handleConfirm = () => {
    resolver.current?.(true);
    setDialog(null);
  };

  const handleCancel = () => {
    resolver.current?.(false);
    setDialog(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      <ConfirmDialog
        isOpen={!!dialog}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmText={dialog?.confirmText}
        cancelText={dialog?.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
}