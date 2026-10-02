import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, hasValidAdminSession, isAdminAuthConfigured } from "../../lib/admin-auth";
import AdminDashboard from "./admin-dashboard";
import AdminLogin from "./admin-login";
import "./atelier.css";

export const metadata = {
  title: "Store Admin | Doresther Tradings",
  robots: { index: false, follow: false },
};

export default async function AtelierPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = hasValidAdminSession(session);

  return authenticated ? <AdminDashboard /> : <AdminLogin configured={isAdminAuthConfigured()} />;
}
