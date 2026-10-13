export function publishCustomerSession(session) {
  window.dispatchEvent(new CustomEvent("customer-session-change", { detail: session }));
}

export function subscribeToCustomerSession(listener) {
  const handleSessionChange = (event) => listener(event.detail);
  window.addEventListener("customer-session-change", handleSessionChange);
  return () => window.removeEventListener("customer-session-change", handleSessionChange);
}
