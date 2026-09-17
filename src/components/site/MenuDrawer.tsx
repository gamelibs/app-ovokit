"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useFavorites } from "@/components/favorites/FavoritesProvider";

type ModStatus = { isModerator: boolean };

async function fetchModStatus(): Promise<ModStatus> {
  const res = await fetch("/api/mod/me", { cache: "no-store" });
  if (!res.ok) return { isModerator: false };
  return (await res.json()) as ModStatus;
}

export function MenuDrawer({
  open,
  onClose,
  showModeratorTools,
}: {
  open: boolean;
  onClose: () => void;
  showModeratorTools?: boolean;
}) {
  const t = useTranslations("drawer");
  const router = useRouter();
  const { count } = useFavorites();
  const [status, setStatus] = useState<ModStatus>({ isModerator: false });
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 版本号：由 release.sh 构建时注入 NEXT_PUBLIC_APP_VERSION（commit · 日期）；
  // 本地 pnpm dev 未注入时显示 dev。
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "dev";

  const modLabel = useMemo(
    () => (status.isModerator ? t("loggedIn") : t("loggedOut")),
    [status.isModerator, t],
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
        throw new Error(msg || t("loginFailed"));
      }
      setPassword("");
      setStatus(await fetchModStatus());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loginFailed"));
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

  const canShowModTools = Boolean(showModeratorTools || status.isModerator);

  const drawer = (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-ink/30"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-[320px] max-w-[88vw] overflow-y-auto bg-paper pb-[env(safe-area-inset-bottom)] text-ink shadow-2xl">
        <div className="flex items-center justify-between border-b-2 border-ink sketch-border-thin px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="font-kalam text-sm font-semibold">{t("title")}</div>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl hover:bg-ink/5 sm:h-9 sm:w-9"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <section className="rounded-2xl sketch-border bg-paper-warm p-3">
            <div className="font-kalam text-xs font-semibold text-ink-muted">
              {t("navSection")}
            </div>
            <div className="mt-2 grid gap-2">
              <Link
                href="/"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("home")}
              </Link>
              <Link
                href="/favorites"
                onClick={onClose}
                className="font-kalam flex items-center justify-between rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                <span>{t("myFavorites")}</span>
                {count > 0 ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight-red px-1.5 text-[11px] font-semibold text-ink">
                    {count}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/archetypes"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("archetypes")}
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("about")}
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("contact")}
              </Link>
              <Link
                href="/privacy"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("privacy")}
              </Link>
              <Link
                href="/terms"
                onClick={onClose}
                className="font-kalam rounded-xl bg-paper px-3 py-2 text-sm font-semibold text-ink hover:bg-paper-warm"
              >
                {t("terms")}
              </Link>
            </div>
          </section>

          {canShowModTools ? (
            <section className="rounded-2xl sketch-border bg-paper-warm p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-kalam text-xs font-semibold text-ink-muted">
                    {t("adminSection")}
                  </div>
                  <div className="font-kalam mt-1 text-sm font-semibold">
                    {modLabel}
                  </div>
                </div>
                {status.isModerator ? (
                  <button
                    type="button"
                    onClick={logout}
                    disabled={busy}
                    className="font-kalam sketch-border bg-paper px-3 py-2 text-sm font-semibold hover:bg-paper-warm disabled:opacity-50"
                  >
                    {t("logout")}
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
                    placeholder={t("passwordPlaceholder")}
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    className="sketch-input w-full"
                  />
                  <button
                    type="submit"
                    disabled={busy || password.trim().length === 0}
                    className="sketch-button w-full"
                  >
                    {busy ? t("loginBusy") : t("loginSubmit")}
                  </button>
                  {error ? (
                    <div className="text-xs text-highlight-red">{error}</div>
                  ) : null}
                  <div className="text-xs text-ink-muted">
                    {t("loginHint")}
                  </div>
                </form>
              ) : (
                <div className="mt-3 grid gap-2">
                  <Link
                    href="/mod"
                    onClick={onClose}
                    className="sketch-button sketch-button-secondary text-left"
                  >
                    {t("modHome")}
                  </Link>
                  <Link
                    href="/mod?filter=demo"
                    onClick={onClose}
                    className="sketch-button sketch-button-secondary text-left"
                  >
                    {t("modDemoCases")}
                  </Link>
                  <Link
                    href="/mod/new"
                    onClick={onClose}
                    className="sketch-button sketch-button-secondary text-left"
                  >
                    {t("modNew")}
                  </Link>
                  <Link
                    href="/mod/tools"
                    onClick={onClose}
                    className="sketch-button sketch-button-secondary text-left"
                  >
                    {t("modTools")}
                  </Link>
                </div>
              )}
            </section>
          ) : null}

          <div className="pb-2 pt-1 text-center text-[11px] text-ink-muted">
            v {appVersion}
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === "undefined"
    ? null
    : createPortal(drawer, document.body);
}
