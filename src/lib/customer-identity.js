const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeCustomerIdentifier(value) {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || input.length > 254) return null;

  if (input.includes("@")) {
    const email = input.toLowerCase();
    if (!EMAIL_PATTERN.test(email)) return null;
    return { type: "email", identifier: `email:${email}`, email, phone: null, destination: email };
  }

  const compact = input.replace(/[\s().-]/g, "");
  let digits = compact.replace(/\D/g, "");
  if (compact.startsWith("00")) digits = digits.slice(2);
  else if (!compact.startsWith("+")) {
    if (digits.startsWith("0")) digits = `233${digits.slice(1)}`;
    else if (digits.length === 9) digits = `233${digits}`;
    else if (!digits.startsWith("233")) return null;
  }
  if (!/^\d{10,15}$/.test(digits)) return null;

  const phone = `+${digits}`;
  return { type: "phone", identifier: `phone:${digits}`, email: null, phone, destination: digits };
}

export function maskCustomerIdentifier(contact) {
  if (contact.type === "email") {
    const [local, domain] = contact.email.split("@");
    return `${local.slice(0, 1)}${"*".repeat(Math.max(2, Math.min(local.length - 1, 5)))}@${domain}`;
  }
  return `${"*".repeat(Math.max(0, contact.phone.length - 4))}${contact.phone.slice(-4)}`;
}