"use client";

import { ConfirmOptions } from "@/types/ConfirmOptions";
import {
  createContext,
  useContext,
} from "react";


interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmContext =
  createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);

  if (!context) {
    throw new Error(
      "useConfirm must be used inside ConfirmProvider"
    );
  }

  return context.confirm;
}