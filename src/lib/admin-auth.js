import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "doresther_admin_session";
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
  return Boolean(process.env.ADMIN_USERNAME?.trim() && process.env.ADMIN_PASSWORD && sessionSecret());
}

export function credentialsMatch(username, password) {
  const configuredUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;
  return Boolean(
    configuredUsername
    && typeof username === "string"
    && signaturesMatch(configuredUsername, username.trim().toLowerCase())
    && configuredPassword
    && typeof password === "string"
    && signaturesMatch(configuredPassword, password),
  );
}

export function createAdminSession() {
  const secret = sessionSecret();
  const username = process.env.ADMIN_USERNAME?.trim();
  if (!secret || !username) return null;
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(JSON.stringify({ role: "admin", username, expiresAt })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { value: `${payload}.${signature}`, expiresAt, username };
}

function parseAdminSession(session = "") {
  const secret = sessionSecret();
  const [payload, signature, extra] = session.split(".");
  if (!secret || extra || !payload || !signature) return null;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!signaturesMatch(expectedSignature, signature)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.role !== "admin"
      || typeof claims.username !== "string"
      || !claims.username
      || !Number.isFinite(claims.expiresAt)
      || claims.expiresAt <= Date.now()
      || claims.username !== process.env.ADMIN_USERNAME?.trim()) return null;
    return claims;
  } catch {
    return null;
  }
}

export function hasValidAdminSession(session = "") {
  return Boolean(parseAdminSession(session));
}

export function getAdminSessionUsername(session = "") {
  return parseAdminSession(session)?.username || null;
}

export const adminSessionOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MAX_AGE,
};
