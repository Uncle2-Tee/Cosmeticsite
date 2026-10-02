import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "lumera_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function hash(value) {
  return createHash("sha256").update(value).digest();
}

function signaturesMatch(expected, received) {
  const expectedHash = hash(expected);
  const receivedHash = hash(received || "");
  return timingSafeEqual(expectedHash, receivedHash);
}

export function isAdminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && sessionSecret());
}

export function passwordMatches(password) {
  const configuredPassword = process.env.ADMIN_PASSWORD;
  return Boolean(configuredPassword && signaturesMatch(configuredPassword, password));
}

export function createAdminSession() {
  const secret = sessionSecret();
  if (!secret) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = `admin.${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { value: `${payload}.${signature}`, expiresAt };
}

export function hasValidAdminSession(session = "") {
  const secret = sessionSecret();
  if (!secret) return false;
  const [role, expiration, signature, extra] = session.split(".");
  const expiresAt = Number(expiration);
  if (extra || role !== "admin" || !Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) return false;
  const payload = `${role}.${expiration}`;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  return signaturesMatch(expectedSignature, signature);
}

export const adminSessionOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/atelier",
  maxAge: SESSION_MAX_AGE,
};
