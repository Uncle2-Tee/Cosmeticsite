"use client";

import { useEffect, useRef, useState } from "react";
import VisibilityIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffOutlined";
import PersonIcon from "@mui/icons-material/PersonOutlineOutlined";
import ReceiptIcon from "@mui/icons-material/ReceiptLongOutlined";
import FavoriteIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";
import LocationIcon from "@mui/icons-material/LocationOnOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCardOutlined";
import ReplayIcon from "@mui/icons-material/ReplayOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import LockIcon from "@mui/icons-material/LockOutlined";
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import PhoneIcon from "@mui/icons-material/CallOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { signInCustomer, signOutCustomer, signUpCustomer } from "../../lib/customer-auth-client";
import { subscribeToCustomerOrderUpdates } from "../../lib/customer-order-updates";

const notificationPreferenceKey = (userId) => `doresther:order-notifications:${userId}`;

function orderStatusLabel(status) {
  return status.replaceAll("_", " ");
}

const accountSections = [
  { id: "profile", label: "My Profile", icon: PersonIcon },
  { id: "orders", label: "My Orders", icon: ReceiptIcon },
  { id: "wishlist", label: "Wishlist", icon: FavoriteIcon },
  { id: "cart", label: "Cart", icon: ShoppingBagIcon },
  { id: "addresses", label: "Delivery Addresses", icon: LocationIcon },
  { id: "payments", label: "Payment Methods", icon: CreditCardIcon },
  { id: "returns", label: "Returns & Refunds", icon: ReplayIcon },
  { id: "notifications", label: "Notifications", icon: NotificationsIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "support", label: "Help & Support", icon: HelpIcon },
  { id: "logout", label: "Logout", icon: LogoutIcon },
];

async function apiJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value));
}

export default function CustomerAccount({ session, onSignInSuccess, onAccountUpdated, activeSection, onSelectSection, onBackToSections, mobileSectionOpen, wishlistProducts, onAddToCart, onRemoveFromWishlist, onOpenCart, cartCount, refreshKey }) {
  const [authMode, setAuthMode] = useState("signin");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentAccountPassword, setShowCurrentAccountPassword] = useState(false);
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [showConfirmAccountPassword, setShowConfirmAccountPassword] = useState(false);
  const [orders, setOrders] = useState(null);
  const [ordersError, setOrdersError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [accountSettings, setAccountSettings] = useState({
    fullName: session?.user?.user_metadata?.full_name || "",
    email: session?.user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [profileSaveStatus, setProfileSaveStatus] = useState("");
  const [profileSaveRevision, setProfileSaveRevision] = useState(0);
  const [savedProfile, setSavedProfile] = useState({
    fullName: session?.user?.user_metadata?.full_name || "",
    email: session?.user?.email || "",
  });
  const profileSaveInFlight = useRef(false);
  const [notificationPermission, setNotificationPermission] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const notificationEnabledRef = useRef(false);
  const orderStatuses = useRef(new Map());
  const initialOrdersLoaded = useRef(false);

  useEffect(() => {
    const user = session?.user;
    if (!user) return;
    const timer = window.setTimeout(() => {
      const permission = typeof Notification === "undefined" ? "unsupported" : Notification.permission;
      setNotificationPermission(permission);
      setNotificationsEnabled(permission === "granted"
        && window.localStorage.getItem(notificationPreferenceKey(user.id)) === "true");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    const userId = session?.user?.id;
    const fullName = accountSettings.fullName.trim();
    const email = accountSettings.email.trim().toLowerCase();
    if (!userId || (fullName === savedProfile.fullName && email === savedProfile.email)) return undefined;
    if (fullName.length < 2 || fullName.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return undefined;
    }

    let cancelled = false;
    let timer;
    async function saveProfile() {
      if (profileSaveInFlight.current) {
        timer = window.setTimeout(saveProfile, 250);
        return;
      }
      profileSaveInFlight.current = true;
      setProfileSaveStatus("Saving profile changes…");
      try {
        const response = await fetch("/api/customer/account", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, email }),
        });
        const { user: updatedUser } = await apiJson(response);
        setSavedProfile({ fullName, email });
        onAccountUpdated(updatedUser);
        if (!cancelled) setProfileSaveStatus("Profile changes saved.");
      } catch (error) {
        if (!cancelled) {
          console.error("Could not save customer profile changes:", error);
          setProfileSaveStatus(error.message || "Could not save profile changes. Your edits are still here; try changing a field again.");
        }
      } finally {
        profileSaveInFlight.current = false;
      }
    }

    timer = window.setTimeout(saveProfile, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accountSettings.fullName, accountSettings.email, session?.user?.id, savedProfile, profileSaveRevision, onAccountUpdated]);

  useEffect(() => {
    notificationEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    let cancelled = false;
    let requestInFlight = false;
    async function refreshOrders() {
      if (cancelled || requestInFlight || document.visibilityState === "hidden") return;
      requestInFlight = true;
      try {
        const { orders: savedOrders } = await apiJson(await fetch("/api/orders", { cache: "no-store" }));
        if (!cancelled) {
          const nextStatuses = new Map(savedOrders.map((order) => [order.id, order.status]));
          if (initialOrdersLoaded.current && notificationEnabledRef.current && typeof Notification !== "undefined" && Notification.permission === "granted") {
            savedOrders.forEach((order) => {
              const previousStatus = orderStatuses.current.get(order.id);
              if (previousStatus !== undefined && previousStatus !== order.status) {
                try {
                  new Notification("Your order has been updated", {
                    body: `Order ${order.id.slice(0, 8).toUpperCase()} is now ${orderStatusLabel(order.status)}.`,
                    tag: `doresther-order-${order.id}`,
                  });
                } catch (error) {
                  console.error("Could not show browser order notification:", error);
                }
              }
            });
          }
          orderStatuses.current = nextStatuses;
          initialOrdersLoaded.current = true;
          setOrders(savedOrders);
          setOrdersError("");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Could not refresh customer orders:", error);
          setOrdersError(error.message || "Could not load your orders.");
        }
      } finally {
        requestInFlight = false;
      }
    }
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refreshOrders(); };
    void refreshOrders();
    const interval = window.setInterval(refreshWhenVisible, 30000);
    const unsubscribeFromOrderUpdates = subscribeToCustomerOrderUpdates(refreshWhenVisible);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      initialOrdersLoaded.current = false;
      orderStatuses.current = new Map();
      window.clearInterval(interval);
      unsubscribeFromOrderUpdates();
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [session, refreshKey]);

  async function submitAuth(event) {
    event.preventDefault();
    const currentAuthMode = authMode;
    if ((currentAuthMode === "signup" || currentAuthMode === "reset") && form.password !== form.confirmPassword) {
      setMessage("Your passwords do not match. Please check and try again.");
      return;
    }
    if (currentAuthMode === "signup" && !form.fullName.trim()) {
      setMessage("Enter your full name to create an account.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (currentAuthMode === "recovery") {
        setMessage("Email-based password recovery will be available when email delivery is configured. Contact the store for help with your account.");
      } else if (currentAuthMode === "reset") {
        setMessage("Password recovery is not available yet. Contact the store for help with your account.");
      } else if (currentAuthMode === "signup") {
        await signUpCustomer({
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        setMessage("Your account is ready. Log in with your email and password.");
        setAuthMode("signin");
        setForm((current) => ({ ...current, fullName: "", password: "", confirmPassword: "" }));
      } else {
        await signInCustomer({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        onSignInSuccess();
        setMessage("");
      }
    } catch (error) {
      setMessage(error.message || "Could not complete sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutCustomer();
    } catch (error) {
      setMessage(error.message || "Could not sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    if (!accountSettings.newPassword || !accountSettings.currentPassword) {
      setMessage("Enter your current password and a new password to continue.");
      return;
    }
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      setMessage("Your new passwords do not match.");
      return;
    }
    setSettingsBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/customer/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: accountSettings.currentPassword,
          newPassword: accountSettings.newPassword,
        }),
      });
      const { user } = await apiJson(response);
      onAccountUpdated(user);
      setAccountSettings((current) => ({
        ...current,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setMessage("Your password has been changed. Other signed-in sessions have been signed out.");
    } catch (error) {
      setMessage(error.message || "Could not update your account.");
    } finally {
      setSettingsBusy(false);
    }
  }

  async function toggleOrderNotifications() {
    setNotificationMessage("");
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      window.localStorage.setItem(notificationPreferenceKey(session.user.id), "false");
      setNotificationMessage("Browser order notifications are turned off.");
      return;
    }
    if (typeof Notification === "undefined") {
      setNotificationMessage("Browser notifications are not supported in this browser.");
      return;
    }
    let permission = Notification.permission;
    if (permission === "default") {
      try {
        permission = await Notification.requestPermission();
      } catch (error) {
        console.error("Could not request browser notification permission:", error);
        setNotificationMessage("Your browser could not request notification permission. Check its site settings and try again.");
        return;
      }
    }
    setNotificationPermission(permission);
    if (permission !== "granted") {
      setNotificationMessage(permission === "denied"
        ? "Notifications are blocked by your browser. Allow them in your browser settings to turn them on."
        : "Browser notification permission was not granted.");
      return;
    }
    setNotificationsEnabled(true);
    window.localStorage.setItem(notificationPreferenceKey(session.user.id), "true");
    setNotificationMessage("You’ll get a browser notification when an order status changes while you’re signed in.");
  }

  if (!session?.user || authMode === "recovery") {
    const currentAuthMode = authMode;
    const isSigningUp = currentAuthMode === "signup";
    const isRecoveringPassword = currentAuthMode === "recovery";
    if (isRecoveringPassword) {
      return <section className="customer-account-root customer-auth-screen">
        <div className="customer-auth-card">
          <div className="customer-auth-wordmark" aria-label="Doresther Trading">
            <span className="customer-auth-monogram">D</span>
            <span className="customer-auth-brand-name">Doresther <em>Trading</em></span>
          </div>
          <h1>Password Recovery</h1>
          <p className="customer-auth-intro">Email-based password recovery will be available when email delivery is configured. Contact the store for help with your account.</p>
          <button className="primary-button wide" type="button" onClick={() => { setAuthMode("signin"); setMessage(""); }}>Back to Log In</button>
        </div>
      </section>;
    }
    return <section className={`customer-account-root customer-auth-screen${isSigningUp ? " customer-signup-screen" : ""}`}>
      <div className="customer-auth-card">
        <div className="customer-auth-wordmark" aria-label="Doresther Trading">
          <span className="customer-auth-monogram">D</span>
          <span className="customer-auth-brand-name">Doresther <em>Trading</em></span>
        </div>
        <h1>{isSigningUp ? "Sign Up" : "Welcome Back"}</h1>
        <p className="customer-auth-intro">{isSigningUp ? "Join us for thoughtful essentials and easy order tracking." : "Log in to continue to your Doresther Trading account."}</p>
        <form onSubmit={submitAuth}>
          {isSigningUp && <label htmlFor="customer-full-name">Full name<input id="customer-full-name" name="name" type="text" autoComplete="name" placeholder="e.g. Elliot Fiawornu" required maxLength={120} value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>}
          <label htmlFor="customer-email">Email<input id="customer-email" name="email" type="email" autoComplete="email" placeholder="e.g. elliot@example.com" required maxLength={254} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label htmlFor="customer-password">Password
            <span className="customer-password-field">
              <input id="customer-password" name="password" type={showPassword ? "text" : "password"} autoComplete={isSigningUp ? "new-password" : "current-password"} placeholder="Password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="customer-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <VisibilityOffIcon fontSize="small" aria-hidden="true" /> : <VisibilityIcon fontSize="small" aria-hidden="true" />}</button>
            </span>
          </label>
          {isSigningUp && <>
            <label htmlFor="customer-confirm-password">Confirm password
              <span className="customer-password-field">
                <input id="customer-confirm-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" placeholder="Confirm password" minLength={8} required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
                <button type="button" className="customer-password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmPassword}>{showConfirmPassword ? <VisibilityOffIcon fontSize="small" aria-hidden="true" /> : <VisibilityIcon fontSize="small" aria-hidden="true" />}</button>
              </span>
            </label>
            <p className="customer-password-hint">Use at least 8 characters.</p>
          </>}
          {!isSigningUp && <button className="customer-forgot-link" type="button" onClick={() => { setAuthMode("recovery"); setMessage(""); setForm((current) => ({ ...current, password: "", confirmPassword: "" })); }}>Forgot password?</button>}
          {message && <p className="customer-account-notice" role="status" aria-live="polite">{message}</p>}
          <button className="primary-button wide" type="submit" disabled={busy}>{busy ? "Please wait…" : isSigningUp ? "Create Account" : "Log In"}</button>
        </form>
        <p className="customer-auth-switch">{isSigningUp ? "Already have an account?" : "New to Doresther Trading?"}
          <button className="account-text-action" type="button" disabled={busy} onClick={() => { setAuthMode(isSigningUp ? "signin" : "signup"); setMessage(""); setShowPassword(false); setShowConfirmPassword(false); setForm((current) => ({ ...current, password: "", confirmPassword: "" })); }}>
            {isSigningUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </section>;
  }

  const fullName = session.user.user_metadata?.full_name || session.user.email;
  const profileChangesPending = accountSettings.fullName.trim() !== savedProfile.fullName
    || accountSettings.email.trim().toLowerCase() !== savedProfile.email;
  const profileDetailsValid = accountSettings.fullName.trim().length >= 2
    && accountSettings.fullName.trim().length <= 120
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountSettings.email.trim())
    && accountSettings.email.trim().length <= 254;
  return <section className="account-page customer-account-root">
    <header className="account-heading"><div><p className="eyebrow">Customer account</p><h1>Welcome, {fullName}</h1><p>{session.user.email}</p></div><div className="customer-account-actions"><button className="account-cart-link" type="button" onClick={onOpenCart}>Cart <span>{cartCount}</span></button><button className="account-signout-button" type="button" onClick={signOut} disabled={signingOut}><LogoutIcon sx={{ fontSize: 17 }} aria-hidden="true" /> {signingOut ? "Signing out…" : "Sign out"}</button></div></header>
    <div className="account-layout">
      <nav className="account-sidebar" aria-label="Account sections">
        {accountSections.map(({ id, label, icon: SectionIcon }) => (
          <button key={id} className={`${activeSection === id ? "active" : ""}${id === "logout" ? " account-logout-button" : ""}`} onClick={() => {
            if (id === "logout") signOut();
            else if (id === "cart") onOpenCart();
            else onSelectSection(id);
          }}>
            <SectionIcon sx={{ fontSize: 20 }} aria-hidden="true" />
            <span>{label}</span>
            {id === "wishlist" && wishlistProducts.length > 0 && <b>{wishlistProducts.length}</b>}
            {id === "cart" && cartCount > 0 && <b>{cartCount}</b>}
          </button>
        ))}
      </nav>
      <section className="account-content">
        {mobileSectionOpen && <button className="account-mobile-back" type="button" onClick={onBackToSections}>← Back to account sections</button>}
        {activeSection === "orders" && <section className="customer-orders">
          <div className="account-section-heading"><div><p className="eyebrow">Your account</p><h2>Order history</h2></div><span>{orders?.length ?? 0} {(orders?.length ?? 0) === 1 ? "order" : "orders"}</span></div>
          {orders === null && <p className="customer-account-notice">Loading your orders…</p>}
          {ordersError && <p className="customer-account-notice" role="alert">{ordersError}</p>}
          {!ordersError && orders?.length === 0 && <div className="account-empty"><p className="eyebrow">Orders</p><h2>No orders yet</h2><p>Your placed orders will appear here.</p></div>}
          {(orders || []).map((order) => <article className="customer-order-card" key={order.id}>
            <div className="customer-order-heading"><div><span>Placed {formatDate(order.created_at)}</span><strong>{order.status.replaceAll("_", " ")}</strong></div><b>{new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(order.total))}</b></div>
            <ul>{order.items.map((item) => <li key={`${order.id}-${item.product_id}`}>{item.name} × {item.quantity}</li>)}</ul>
            <p className="customer-order-payment">Mobile Money · Awaiting manual payment verification</p>
          </article>)}
        </section>}
        {activeSection === "wishlist" && <section>
          <div className="account-section-heading wishlist-heading"><div><p className="eyebrow">Saved for later</p><h2>My Wishlist <span aria-hidden="true">♥</span></h2></div><span>{wishlistProducts.length} items</span></div>
          {wishlistProducts.length ? <div className="wishlist-grid">{wishlistProducts.map((product) => <article className="wishlist-card" key={product.id}><div className="wishlist-card-image" style={{ backgroundImage: `url(${product.image})` }} role="img" aria-label={product.name}><button className="wishlist-remove" onClick={() => onRemoveFromWishlist(product)} aria-label={`Remove ${product.name} from wishlist`}>×</button>{product.badge && <span className="product-badge">{product.badge}</span>}</div><div className="wishlist-card-info"><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><p className="wishlist-card-price">{new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(product.price)}</p><button className="add-to-cart-button" onClick={() => onAddToCart(product)}>Add to cart</button></div></article>)}</div> : <div className="wishlist-empty"><h3>Your wishlist is empty</h3><p>Save products you love and find them here later.</p></div>}
        </section>}
        {activeSection === "profile" && <div className="account-empty"><p className="eyebrow">Your details</p><h2>My Profile</h2><p><strong>Name</strong><br />{fullName}</p><p><strong>Email</strong><br />{session.user.email}</p><p>Your account details are securely managed in the store database.</p></div>}
        {activeSection === "addresses" && <div className="account-empty"><p className="eyebrow">Delivery details</p><h2>Delivery Addresses</h2><p>No saved delivery addresses yet. Add your delivery address during checkout and it will be included with your order.</p></div>}
        {activeSection === "payments" && <div className="account-empty"><p className="eyebrow">Secure payments</p><h2>Payment Methods</h2><p>Payment is currently handled through Mobile Money at checkout. Payment card details are not stored in your account.</p></div>}
        {activeSection === "returns" && <div className="account-empty account-help-card"><p className="eyebrow">Order support</p><h2>Returns &amp; Refunds</h2><p>For help with a return or refund, contact our support team with your order number. Choose how you’d like to get in touch.</p><div className="account-help-actions"><a className="account-help-call" href="tel:+233535082115"><PhoneIcon aria-hidden="true" /> Call us</a><a className="account-help-whatsapp" href="https://wa.me/233240958153" target="_blank" rel="noreferrer"><WhatsAppIcon aria-hidden="true" /> WhatsApp</a></div></div>}
        {activeSection === "notifications" && <section className="customer-account-tools">
          <div className="account-section-heading"><div><p className="eyebrow">Stay in the loop</p><h2>Notifications</h2></div></div>
          <article className="account-tool-card">
            <div className="account-tool-heading"><div><NotificationsIcon aria-hidden="true" /><div><h3>Order status updates</h3><p>See the latest payment, processing, and delivery status for your orders.</p></div></div></div>
            {orders === null && <p className="customer-account-notice">Loading your order updates…</p>}
            {ordersError && <p className="customer-account-notice" role="alert">{ordersError}</p>}
            {!ordersError && orders?.length === 0 && <p className="account-tool-muted">No order updates yet. Updates will appear here after you place an order.</p>}
            {(orders || []).map((order) => <article className="account-notification-item" key={order.id}>
              <span className="account-notification-status"><span aria-hidden="true" />{orderStatusLabel(order.status)}</span>
              <div><strong>Order {order.id.slice(0, 8).toUpperCase()}</strong><p>{formatDate(order.created_at)} · {new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(order.total))}</p></div>
            </article>)}
          </article>
          <article className="account-tool-card account-notification-preference">
            <div className="account-tool-heading"><div><NotificationsIcon aria-hidden="true" /><div><h3>Browser notifications</h3><p>Get an alert when an order’s status changes while this account is open.</p></div></div>
              {notificationPermission === "unsupported"
                ? <span className="account-tool-muted">Not supported</span>
                : <button className="account-preference-toggle" type="button" onClick={toggleOrderNotifications} disabled={notificationPermission === null} aria-pressed={notificationsEnabled}>{notificationsEnabled ? "Turn off" : "Turn on"}</button>}
            </div>
            {notificationPermission === "denied" && <p className="account-tool-muted">Notifications are blocked in your browser. Update your browser’s site permissions to enable them.</p>}
            {notificationMessage && <p className="customer-account-notice" role="status">{notificationMessage}</p>}
            <p className="account-tool-muted">Email and SMS alerts aren’t available yet. Browser notifications are saved for this device.</p>
          </article>
        </section>}
        {activeSection === "settings" && <section className="customer-account-tools">
          <div className="account-section-heading"><div><p className="eyebrow">Profile &amp; security</p><h2>Settings</h2></div></div>
          <article className="account-tool-card account-settings-form">
            <div className="account-tool-heading"><div><PersonIcon aria-hidden="true" /><div><h3>Personal details</h3><p>Update the name and email address on your account.</p></div></div></div>
            <label htmlFor="account-settings-name">Full name<input id="account-settings-name" autoComplete="name" required minLength={2} maxLength={120} value={accountSettings.fullName} onChange={(event) => { setProfileSaveStatus(""); setAccountSettings({ ...accountSettings, fullName: event.target.value }); }} /></label>
            <label htmlFor="account-settings-email">Email address<input id="account-settings-email" autoComplete="email" type="email" required maxLength={254} value={accountSettings.email} onChange={(event) => { setProfileSaveStatus(""); setAccountSettings({ ...accountSettings, email: event.target.value }); }} /></label>
            <p className="account-profile-save-status" role="status" aria-live="polite">{profileChangesPending && !profileDetailsValid ? "Enter a valid name and email address to save your changes." : profileChangesPending && profileSaveStatus !== "Saving profile changes…" && !profileSaveStatus.startsWith("Could not save") ? "Unsaved profile changes." : profileSaveStatus || "Profile details save automatically as you edit them."}</p>
            {profileSaveStatus.startsWith("Could not save") && <button className="account-text-action" type="button" onClick={() => setProfileSaveRevision((revision) => revision + 1)}>Retry saving profile</button>}
          </article>
          <form className="account-tool-card account-settings-form" onSubmit={changePassword}>
            <div className="account-settings-divider" />
            <div className="account-tool-heading"><div><LockIcon aria-hidden="true" /><div><h3>Change password</h3><p>Leave these fields blank if you don’t want to change your password.</p></div></div></div>
            <label htmlFor="account-current-password">Current password<span className="customer-password-field"><input id="account-current-password" autoComplete="current-password" type={showCurrentAccountPassword ? "text" : "password"} value={accountSettings.currentPassword} onChange={(event) => setAccountSettings({ ...accountSettings, currentPassword: event.target.value })} /><button type="button" className="customer-password-toggle" onClick={() => setShowCurrentAccountPassword((visible) => !visible)} aria-label={showCurrentAccountPassword ? "Hide current password" : "Show current password"} aria-pressed={showCurrentAccountPassword}>{showCurrentAccountPassword ? <VisibilityOffIcon fontSize="small" aria-hidden="true" /> : <VisibilityIcon fontSize="small" aria-hidden="true" />}</button></span></label>
            <div className="account-settings-password-row"><label htmlFor="account-new-password">New password<span className="customer-password-field"><input id="account-new-password" autoComplete="new-password" type={showNewAccountPassword ? "text" : "password"} minLength={8} maxLength={128} value={accountSettings.newPassword} onChange={(event) => setAccountSettings({ ...accountSettings, newPassword: event.target.value })} /><button type="button" className="customer-password-toggle" onClick={() => setShowNewAccountPassword((visible) => !visible)} aria-label={showNewAccountPassword ? "Hide new password" : "Show new password"} aria-pressed={showNewAccountPassword}>{showNewAccountPassword ? <VisibilityOffIcon fontSize="small" aria-hidden="true" /> : <VisibilityIcon fontSize="small" aria-hidden="true" />}</button></span></label><label htmlFor="account-confirm-password">Confirm new password<span className="customer-password-field"><input id="account-confirm-password" autoComplete="new-password" type={showConfirmAccountPassword ? "text" : "password"} minLength={8} maxLength={128} value={accountSettings.confirmPassword} onChange={(event) => setAccountSettings({ ...accountSettings, confirmPassword: event.target.value })} /><button type="button" className="customer-password-toggle" onClick={() => setShowConfirmAccountPassword((visible) => !visible)} aria-label={showConfirmAccountPassword ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmAccountPassword}>{showConfirmAccountPassword ? <VisibilityOffIcon fontSize="small" aria-hidden="true" /> : <VisibilityIcon fontSize="small" aria-hidden="true" />}</button></span></label></div>
            {message && <p className="customer-account-notice" role="status">{message}</p>}
            <button className="primary-button wide" type="submit" disabled={settingsBusy}>{settingsBusy ? "Changing password…" : "Change password"}</button>
          </form>
          <p className="account-tool-muted account-settings-signout">Sign out of this account from the account header whenever you’re using a shared device.</p>
        </section>}
        {activeSection === "support" && <div className="account-empty account-help-card"><p className="eyebrow">We’re here to help</p><h2>Help &amp; Support</h2><p>Our team is ready to help with your orders and any questions. Choose how you’d like to get in touch.</p><div className="account-help-actions"><a className="account-help-call" href="tel:+233535082115"><PhoneIcon aria-hidden="true" /> Call us</a><a className="account-help-whatsapp" href="https://wa.me/233240958153" target="_blank" rel="noreferrer"><WhatsAppIcon aria-hidden="true" /> WhatsApp</a></div></div>}
        {message && <p className="customer-account-notice" role="status">{message}</p>}
      </section>
    </div>
  </section>;
}
