"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

async function apiJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(new Date(value));
}

export default function CustomerAccount({ onSessionChange, activeSection, onSelectSection, wishlistProducts, onAddToCart, onRemoveFromWishlist, onOpenCart, cartCount, refreshKey }) {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("signin");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
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
    setBusy(true);
    setMessage("");
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: { data: { full_name: form.fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Account created. Check your email to confirm your address, then sign in.");
        } else {
          setMessage("Your account is ready.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
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

  if (!session?.user) {
    return <section className="customer-auth-card">
      <p className="eyebrow">Customer account</p>
      <h2>{authMode === "signup" ? "Create your account" : "Sign in to your account"}</h2>
      <p>Access your order history and keep your account details together.</p>
      {!supabase && <p className="customer-account-notice" role="status">Connect Supabase to enable customer accounts.</p>}
      <form onSubmit={submitAuth}>
        {authMode === "signup" && <label>Full name<input autoComplete="name" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>}
        <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" autoComplete={authMode === "signup" ? "new-password" : "current-password"} minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        {message && <p className="customer-account-notice" role="alert">{message}</p>}
        <button className="primary-button wide" type="submit" disabled={busy || !supabase}>{busy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"}</button>
      </form>
      <button className="account-text-action" type="button" onClick={() => { setAuthMode(authMode === "signup" ? "signin" : "signup"); setMessage(""); }}>
        {authMode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </section>;
  }

  const fullName = session.user.user_metadata?.full_name || session.user.email;
  return <section className="account-page customer-account-root">
    <header className="account-heading"><div><p className="eyebrow">Customer account</p><h1>Welcome, {fullName}</h1><p>{session.user.email}</p></div><div className="customer-account-actions"><button className="account-cart-link" type="button" onClick={onOpenCart}>Cart <span>{cartCount}</span></button><button className="account-text-action" type="button" onClick={signOut}>Sign out</button></div></header>
    <div className="account-layout">
      <nav className="account-sidebar" aria-label="Account sections">
        <button className={activeSection === "orders" ? "active" : ""} onClick={() => onSelectSection("orders")}>Order history</button>
        <button className={activeSection === "wishlist" ? "active" : ""} onClick={() => onSelectSection("wishlist")}>Wishlist <b>{wishlistProducts.length}</b></button>
        <button className={activeSection === "profile" ? "active" : ""} onClick={() => onSelectSection("profile")}>My Profile</button>
      </nav>
      <section className="account-content">
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
        {message && <p className="customer-account-notice" role="status">{message}</p>}
      </section>
    </div>
  </section>;
}
