// Session administrateur : cookie HttpOnly signé (HMAC-SHA256), valable 30 jours.
// Le secret de signature vient de APP_SECRET ; changer ADMIN_PASSWORD invalide les sessions.
import { env } from "./shared.mts";

const COOKIE = "me_admin";
const MAX_AGE = 60 * 60 * 24 * 30;

const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

async function hmac(data: string, purpose: string) {
  const secret = `${env("APP_SECRET")}|${env("ADMIN_PASSWORD")}|${purpose}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}
function safeEq(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export const authConfigured = () => env("ADMIN_PASSWORD").length >= 6 && env("APP_SECRET").length >= 16;

export async function checkPassword(pw: string) {
  const expected = env("ADMIN_PASSWORD");
  if (!expected) return false;
  // Comparaison à temps constant sur des empreintes de même longueur
  const [a, b] = await Promise.all([hmac(pw, "pw"), hmac(expected, "pw")]);
  return safeEq(a, b);
}

export async function sessionCookie() {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 })));
  const sig = await hmac(payload, "session");
  return `${COOKIE}=${payload}.${sig}; Path=/api/admin; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}
export const clearCookie = () => `${COOKIE}=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function isAuthed(req: Request) {
  if (!authConfigured()) return false;
  const raw = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!raw) return false;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!payload || !sig) return false;
  if (!safeEq(sig, await hmac(payload, "session"))) return false;
  try {
    const { exp } = JSON.parse(fromB64url(payload));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// Jeton de désinscription (lien dans chaque e-mail de prospection)
export const unsubscribeToken = (email: string) => hmac(email.trim().toLowerCase(), "unsubscribe");
export async function checkUnsubscribeToken(email: string, token: string) {
  return safeEq(token, await unsubscribeToken(email));
}
