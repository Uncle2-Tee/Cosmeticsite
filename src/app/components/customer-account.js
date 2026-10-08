"use client";

import { useEffect, useState } from "react";
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
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

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

export default function CustomerAccount({ onSessionChange, onSignUpStart, onSignInSuccess, activeSection, onSelectSection, onBackToSections, mobileSectionOpen, wishlistProducts, onAddToCart, onRemoveFromWishlist, onOpenCart, cartCount, refreshKey }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [requireSignIn, setRequireSignIn] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [orders, setOrders] = useState(null);
  const [ordersError, setOrdersError] = useState("");
  const [authChecked, setAuthChecked] = useState(!supabase);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;
    let mounted = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setMessage("Could not check your sign-in session.");
      setSession(data.session);
      setAuthChecked(true);
      onSessionChange(data.session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setOrders(null);
      setAuthChecked(true);
      onSessionChange(nextSession);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [onSessionChange, supabase]);

  useEffect(() => {
    if (!session?.access_token) return undefined;
    let cancelled = false;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(apiJson)
      .then(({ orders: savedOrders }) => { if (!cancelled) { setOrders(savedOrders); setOrdersError(""); } })
      .catch((error) => { if (!cancelled) { setOrders([]); setOrdersError(error.message); } });
    return () => { cancelled = true; };
  }, [session, refreshKey]);

  if (!authChecked) {
    return <section className="account-page customer-account-root"><p className="customer-account-notice">Checking your account…</p></section>;
  }

  async function submitAuth(event) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Customer accounts are unavailable until the Supabase URL and public key are configured.");
      return;
    }
    if (authMode === "signup" && form.password !== form.confirmPassword) {
      setMessage("Your passwords do not match. Please check and try again.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      if (authMode === "signup") {
        setRequireSignIn(true);
        onSignUpStart();
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim() } },
        });
        if (error) throw error;
        if (data.session) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
        }
        setAuthMode("signin");
        setForm((current) => ({ ...current, fullName: "", password: "", confirmPassword: "" }));
        setMessage(data.session
          ? "Your account has been created. Please sign in to continue."
          : "Your sign-up was received. Check your inbox to verify your address, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
        if (error) throw error;
        onSignInSuccess();
        setRequireSignIn(false);
        setMessage("");
      }
    } catch (error) {
      setMessage(error.message || "Could not complete sign-in.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setMessage(error.message);
  }

  if (!session?.user || requireSignIn) {
    const isSigningUp = authMode === "signup";
    return <section className="customer-account-root customer-auth-screen">
      <div className="customer-auth-card">
        <div className="customer-auth-wordmark" aria-label="Doresther Trading">
          <span className="customer-auth-monogram">D</span>
          <span className="customer-auth-brand-name">Doresther <em>Trading</em></span>
        </div>
        <h1>{isSigningUp ? "Create Account" : "Welcome Back"}</h1>
        <p className="customer-auth-intro">{isSigningUp ? "Join us for thoughtful essentials and easy order tracking." : "Log in to continue to your Doresther Trading account."}</p>
        {!supabase && <p className="customer-account-notice" role="status">Customer accounts are temporarily unavailable. Please try again later.</p>}
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
          {message && <p className="customer-account-notice" role="status" aria-live="polite">{message}</p>}
          <button className="primary-button wide" type="submit" disabled={busy || !supabase}>{busy ? "Please wait…" : isSigningUp ? "Create Account" : "Log In"}</button>
        </form>
        <p className="customer-auth-switch">{isSigningUp ? "Already have an account?" : "New to Doresther Trading?"}
          <button className="account-text-action" type="button" onClick={() => { setAuthMode(isSigningUp ? "signin" : "signup"); setMessage(""); setShowPassword(false); setShowConfirmPassword(false); setForm((current) => ({ ...current, password: "", confirmPassword: "" })); }}>
            {isSigningUp ? "Log In" : "Create Account"}
          </button>
        </p>
      </div>
    </section>;
  }

  const fullName = session.user.user_metadata?.full_name || session.user.email;
  return <section className="account-page customer-account-root">
    <header className="account-heading"><div><p className="eyebrow">Customer account</p><h1>Welcome, {fullName}</h1><p>{session.user.email}</p></div><div className="customer-account-actions"><button className="account-cart-link" type="button" onClick={onOpenCart}>Cart <span>{cartCount}</span></button><button className="account-text-action" type="button" onClick={signOut}>Sign out</button></div></header>
    <div className="account-layout">
      <nav className="account-sidebar" aria-label="Account sections">
        {accountSections.map(({ id, label, icon: SectionIcon }) => (
          <button key={id} className={activeSection === id ? "active" : ""} onClick={() => {
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
        {activeSection === "profile" && <div className="account-empty"><p className="eyebrow">Your details</p><h2>My Profile</h2><p><strong>Name</strong><br />{fullName}</p><p><strong>Email</strong><br />{session.user.email}</p><p>Your account is securely managed through Supabase.</p></div>}
        {activeSection === "addresses" && <div className="account-empty"><p className="eyebrow">Delivery details</p><h2>Delivery Addresses</h2><p>No saved delivery addresses yet. Add your delivery address during checkout and it will be included with your order.</p></div>}
        {activeSection === "payments" && <div className="account-empty"><p className="eyebrow">Secure payments</p><h2>Payment Methods</h2><p>Payment is currently handled through Mobile Money at checkout. Payment card details are not stored in your account.</p></div>}
        {activeSection === "returns" && <div className="account-empty"><p className="eyebrow">Order support</p><h2>Returns &amp; Refunds</h2><p>For help with a return or refund, contact our support team with your order number.</p><a className="account-text-action" href="https://wa.me/233240958153" target="_blank" rel="noreferrer">Contact support</a></div>}
        {activeSection === "notifications" && <div className="account-empty"><p className="eyebrow">Stay in the loop</p><h2>Notifications</h2><p>You’re all caught up. Account notifications will appear here when available.</p></div>}
        {activeSection === "settings" && <div className="account-empty"><p className="eyebrow">Preferences</p><h2>Settings</h2><p>Your account settings will be available here. You can sign out securely from the account header or menu.</p></div>}
        {activeSection === "support" && <div className="account-empty"><p className="eyebrow">We’re here to help</p><h2>Help &amp; Support</h2><p>Call us at <a href="tel:+233535082115">0535082115</a> or message us on WhatsApp.</p><a className="account-text-action" href="https://wa.me/233240958153" target="_blank" rel="noreferrer">Message on WhatsApp</a></div>}
        {message && <p className="customer-account-notice" role="status">{message}</p>}
      </section>
    </div>
  </section>;
}
