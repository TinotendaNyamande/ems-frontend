import type { OptionsObject, SnackbarKey } from "notistack";

type SnackbarFn = (message: string, options?: OptionsObject) => SnackbarKey;

let snackbarRef: SnackbarFn | null = null;

export function setSnackbar(fn: SnackbarFn | null) {
  snackbarRef = fn;
}

export function notify(message: string, options?: OptionsObject) {
  if (snackbarRef) {
    snackbarRef(message, options);
  }
}