import { cookies } from "next/headers";

export const MOD_COOKIE = "ovofroge_mod";

export function isModeratorCookieValue(v: string | undefined) {
  return v === "1";
}

export async function isModerator() {
  const c = await cookies();
  return isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
}

