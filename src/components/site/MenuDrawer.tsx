"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type ModStatus = { isModerator: boolean };

async function fetchModStatus(): Promise<ModStatus> {
  const res = await fetch("/api/mod/me", { cache: "no-store" });
  if (!res.ok) return { isModerator: false };
  return (await res.json()) as ModStatus;
}

export function MenuDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ModStatus>({ isModerator: false });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modLabel = useMemo(
    () => (status.isModerator ? "版主已登录" : "版主未登录"),
    [status.isModerator],
  );

  useEffect(() => {
    if (!open) return;
    fetchModStatus().then(setStatus);
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  async function login() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mod/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "登录失败");
      }
      setPassword("");
      setStatus(await fetchModStatus());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/mod/logout", { method: "POST" });
      setStatus({ isModerator: false });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const drawer = (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-[320px] max-w-[88vw] overflow-y-auto bg-white pb-[env(safe-area-inset-bottom)] text-zinc-900 shadow-2xl dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] dark:border-white/10">
          <div className="text-sm font-semibold">菜单</div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 sm:h-9 sm:w-9 dark:hover:bg-white/10"
            aria-label="Close"
            onClick={onClose}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M6 6l12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-4">
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              导航
            </div>
            <div className="mt-2 grid gap-2">
              <Link
                href="/"
                onClick={onClose}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                首页信息流
              </Link>
              <Link
                href="/#tags"
                onClick={onClose}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                标签（占位）
              </Link>
              <Link
                href="/#about"
                onClick={onClose}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                关于（占位）
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  版主模式
                </div>
                <div className="mt-1 text-sm font-semibold">{modLabel}</div>
              </div>
              {status.isModerator ? (
                <button
                  type="button"
                  onClick={logout}
                  disabled={busy}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-black/30 dark:hover:bg-white/10"
                >
                  退出
                </button>
              ) : null}
            </div>

            {!status.isModerator ? (
              <form
                className="mt-3 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void login();
                }}
              >
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入版主口令"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-white/10 dark:bg-black/30 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-white/10"
                />
                <button
                  type="submit"
                  disabled={busy || password.trim().length === 0}
                  className="h-10 w-full whitespace-nowrap rounded-xl bg-blue-600 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "登录中..." : "进入版主模式"}
                </button>
                {error ? (
                  <div className="text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                ) : null}
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  MVP：使用环境变量 <code className="font-mono">MOD_PASSWORD</code>{" "}
                  作为口令。
                </div>
              </form>
            ) : (
              <div className="mt-3 grid gap-2">
                <Link
                  href="/mod"
                  onClick={onClose}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  内容管理
                </Link>
                <Link
                  href="/mod/cases"
                  onClick={onClose}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  案例演示
                </Link>
                <Link
                  href="/mod/new"
                  onClick={onClose}
                  className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:bg-black/30 dark:text-zinc-50 dark:hover:bg-white/10"
                >
                  新建玩法
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(drawer, document.body);
}
