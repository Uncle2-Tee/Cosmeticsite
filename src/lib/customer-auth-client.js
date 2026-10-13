import { publishCustomerSession, subscribeToCustomerSession } from "./customer-session";

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

export async function getCustomerSession() {
  const { session } = await request("/api/auth/session");
  return session;
}

export async function signUpCustomer({ fullName, email, password }) {
  const result = await request("/api/auth/signup", {
    method: "POST",
    body: { fullName, email, password },
  });
  publishCustomerSession(result.session);
  return result;
}

export async function signInCustomer({ email, password }) {
  const { session } = await request("/api/auth/signin", {
    method: "POST",
    body: { email, password },
  });
  publishCustomerSession(session);
  return session;
}

export async function signOutCustomer() {
  await request("/api/auth/signout", { method: "POST" });
  publishCustomerSession(null);
}

export function listenForCustomerSessionChanges(listener) {
  return subscribeToCustomerSession(listener);
}
