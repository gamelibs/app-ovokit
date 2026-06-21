/**
 * Cookie 同意状态管理。
 *
 * - `necessary`：必要 Cookie（如安全、会话），始终为 true。
 * - `analytics`：分析/统计 Cookie（如 Google Analytics），由用户授权决定。
 */
export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  timestamp: string;
};

const STORAGE_KEY = "ovoforge-cookie-consent";

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsent;
  } catch {
    return null;
  }
}

export function setCookieConsent(consent: Omit<CookieConsent, "necessary" | "timestamp">): CookieConsent {
  const value: CookieConsent = {
    necessary: true,
    analytics: consent.analytics,
    timestamp: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
  return value;
}

export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}
