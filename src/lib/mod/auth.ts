import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const MOD_COOKIE = "ovoforge_mod";

function deriveSigningSecret(password: string): string {
  // 从 MOD_PASSWORD 派生一个固定长度的签名密钥
  return createHmac("sha256", password).update("ovoforge-mod-signer").digest("hex");
}

function computeCookieValue(password: string): string {
  const secret = deriveSigningSecret(password);
  return createHmac("sha256", secret).update(MOD_COOKIE).digest("hex");
}

/**
 * 生成版主 cookie 的签名值。
 * 登录成功后由服务端调用，写入 httpOnly cookie。
 */
export function signModeratorCookie(password: string): string {
  return computeCookieValue(password);
}

/**
 * 验证版主 cookie 值是否有效。
 * 若未传入 password，默认读取 process.env.MOD_PASSWORD。
 */
export function isModeratorCookieValue(
  v: string | undefined,
  password: string | undefined = process.env.MOD_PASSWORD,
): boolean {
  if (!v || !password) return false;

  const expected = Buffer.from(computeCookieValue(password), "hex");
  const actual = Buffer.from(v, "hex");

  if (actual.length !== expected.length) return false;

  try {
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export async function isModerator() {
  const c = await cookies();
  return isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
}
