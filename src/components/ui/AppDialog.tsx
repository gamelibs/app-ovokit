"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * 全站统一弹窗（div modal）。替代浏览器原生 confirm/alert。
 * 用法：
 *   根布局挂 <AppDialogProvider>；
 *   组件内 const dialog = useAppDialog();
 *   if (await dialog.confirm('确定删除？')) { ... }
 *   await dialog.alert('操作失败：...');
 */

type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type DialogState =
  | { kind: "confirm"; message: string; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: "alert"; message: string; opts: { title?: string }; resolve: () => void }
  | null;

const AppDialogContext = createContext<{
  confirm: (message: string, opts?: ConfirmOptions) => Promise<boolean>;
  alert: (message: string, opts?: { title?: string }) => Promise<void>;
} | null>(null);

export function useAppDialog() {
  const ctx = useContext(AppDialogContext);
  if (!ctx) throw new Error("useAppDialog 必须在 <AppDialogProvider> 内使用");
  return ctx;
}

export function AppDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((message: string, opts: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ kind: "confirm", message, opts, resolve });
    });
  }, []);

  const alert = useCallback((message: string, opts: { title?: string } = {}) => {
    return new Promise<void>((resolve) => {
      setState({ kind: "alert", message, opts, resolve });
    });
  }, []);

  const close = useCallback(
    (value: boolean) => {
      if (state?.kind === "confirm") state.resolve(value);
      if (state?.kind === "alert") state.resolve();
      resolverRef.current = null;
      setState(null);
    },
    [state],
  );

  // ESC：confirm=取消，alert=关闭
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <AppDialogContext.Provider value={{ confirm, alert }}>
      {children}
      {state ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/30 px-4"
          onClick={() => close(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl border border-ink-faint bg-paper p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-kalam text-base font-semibold text-ink">
              {state.kind === "confirm"
                ? (state.opts.title ?? "确认操作")
                : (state.opts.title ?? "提示")}
            </div>
            <p className="mt-2 text-sm leading-6 text-ink-light">{state.message}</p>
            <div className="mt-4 flex justify-end gap-2">
              {state.kind === "confirm" ? (
                <>
                  <button
                    type="button"
                    onClick={() => close(false)}
                    className="inline-flex h-9 items-center rounded-lg border border-ink-faint bg-paper px-4 text-sm font-semibold text-ink hover:bg-paper-warm"
                  >
                    {state.opts.cancelText ?? "取消"}
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => close(true)}
                    className={`inline-flex h-9 items-center rounded-lg border px-4 text-sm font-semibold ${
                      state.opts.danger
                        ? "border-highlight-red bg-highlight-red/90 text-ink hover:bg-highlight-red"
                        : "border-ink-faint bg-highlight-yellow text-ink hover:opacity-90"
                    }`}
                  >
                    {state.opts.confirmText ?? "确定"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  autoFocus
                  onClick={() => close(true)}
                  className="inline-flex h-9 items-center rounded-lg border border-ink-faint bg-highlight-yellow px-4 text-sm font-semibold text-ink hover:opacity-90"
                >
                  知道了
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </AppDialogContext.Provider>
  );
}
