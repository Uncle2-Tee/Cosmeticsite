"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CreditCardIcon from "@mui/icons-material/CreditCardOutlined";
import FavoriteIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteRoundedIcon from "@mui/icons-material/Favorite";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import HelpIcon from "@mui/icons-material/HelpOutlineOutlined";
import LocationIcon from "@mui/icons-material/LocationOnOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import NotificationsIcon from "@mui/icons-material/NotificationsNone";
import PersonIcon from "@mui/icons-material/PersonOutlineOutlined";
import ReceiptIcon from "@mui/icons-material/ReceiptLongOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import ReplayIcon from "@mui/icons-material/ReplayOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import ShieldIcon from "@mui/icons-material/VerifiedUserOutlined";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBagOutlined";
import StarIcon from "@mui/icons-material/StarRounded";
import { defaultProductCaution, defaultProductUsage, initialProducts, productCategories } from "../lib/catalog";
import MobileMenu from "./components/mobile-menu";
import CustomerAccount from "./components/customer-account";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";

const categories = ["All", ...productCategories];
const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 });
const accountSections = [
  { id: "profile", label: "My Profile", icon: "user" },
  { id: "orders", label: "My Orders", icon: "orders" },
  { id: "wishlist", label: "Wishlist", icon: "heart" },
  { id: "cart", label: "Cart", icon: "bag" },
  { id: "addresses", label: "Delivery Addresses", icon: "location" },
  { id: "payments", label: "Payment Methods", icon: "payment" },
  { id: "returns", label: "Returns & Refunds", icon: "returns" },
  { id: "notifications", label: "Notifications", icon: "bell" },
  { id: "settings", label: "Settings", icon: "settings" },
  { id: "support", label: "Help & Support", icon: "help" },
  { id: "logout", label: "Logout", icon: "logout" },
];
const iconComponents = { bag: ShoppingBagIcon, search: SearchIcon, arrow: ArrowForwardIcon, close: CloseIcon, plus: AddIcon, minus: RemoveIcon, check: CheckIcon, shield: ShieldIcon, user: PersonIcon, home: HomeRoundedIcon, orders: ReceiptIcon, heart: FavoriteIcon, favorite: FavoriteRoundedIcon, star: StarIcon, location: LocationIcon, payment: CreditCardIcon, returns: ReplayIcon, bell: NotificationsIcon, settings: SettingsIcon, help: HelpIcon, logout: LogoutIcon };

function Icon({ name, size = 20 }) {
  const IconComponent = iconComponents[name] || HelpIcon;
  return <IconComponent sx={{ fontSize: size }} aria-hidden="true" focusable="false" />;
}

function ProductCard({ product, onAdd, onPreview, isWishlisted, onToggleWishlist }) {
  return <article className="product-card"><div className="product-card-visual"><button className="product-image" onClick={() => onPreview(product)} aria-label={`View ${product.name}`}><span className="product-photo" style={{ backgroundImage: `url(${product.image})` }} />{product.badge && <span className="product-badge">{product.badge}</span>}<span className="quick-add">Quick view <Icon name="arrow" size={15} /></span></button><button className={`wishlist-toggle${isWishlisted ? " active" : ""}`} onClick={() => onToggleWishlist(product)} aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} aria-pressed={isWishlisted}><Icon name={isWishlisted ? "favorite" : "heart"} size={19} /></button></div><div className="product-info"><div><p className="eyebrow">{product.category}</p><h3>{product.name}</h3></div><p className="product-price">{money.format(product.price)}</p></div><button className="add-to-cart-button" onClick={() => onAdd(product)}>Add to cart <Icon name="plus" size={16} /></button></article>;
}

function AccountEmptyState({ title, message, action, onAction }) {
  return <div className="account-empty"><p className="eyebrow">Account</p><h2>{title}</h2><p>{message}</p>{action && <button className="account-text-action" onClick={onAction}>{action} <Icon name="arrow" size={15} /></button>}</div>;
}

function ProductGuideList({ content, numbered = false }) {
  const items = content.split("\n").map((item) => item.replace(/^\s*(?:\d+[.)]\s*|[•*-]\s*)/, "").trim()).filter(Boolean);
  const List = numbered ? "ol" : "ul";
  return <List>{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</List>;
}

export default function Home() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [activeAccountSection, setActiveAccountSection] = useState("orders");
  const [customerSession, setCustomerSession] = useState(null);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const [productDetail, setProductDetail] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutDetails, setCheckoutDetails] = useState({ phone: "", shippingAddress: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const restoreSavedStore = window.setTimeout(() => {
      try { const savedCart = JSON.parse(localStorage.getItem("lumera-cart")); const savedWishlist = JSON.parse(localStorage.getItem("lumera-wishlist")); if (Array.isArray(savedCart)) setCart(savedCart); if (Array.isArray(savedWishlist)) setWishlist(savedWishlist.filter((id) => typeof id === "string")); } catch { /* Browser storage can be unavailable in private contexts. */ }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreSavedStore);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem("lumera-cart", JSON.stringify(cart)); }, [cart, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem("lumera-wishlist", JSON.stringify(wishlist)); }, [wishlist, loaded]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Shared products are unavailable.");
        return body.products;
      })
      .then((savedProducts) => {
        if (cancelled || !Array.isArray(savedProducts)) return;
        setProducts(savedProducts);
        setCart((current) => current.map((item) => {
          const currentProduct = savedProducts.find((product) => product.id === item.id);
          return currentProduct ? { ...item, ...currentProduct, quantity: item.quantity } : item;
        }));
      })
      .catch(() => { if (!cancelled) setToast("Shared catalogue unavailable; showing sample products."); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return undefined;
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) setCustomerSession(data.session); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  const handleSessionChange = useCallback((session) => setCustomerSession(session), []);
  useEffect(() => {
    const validViews = new Set(["home", "shop", "about", "account"]);
    const syncViewFromUrl = () => {
      const nextView = new URLSearchParams(window.location.search).get("view") || "home";
      setActiveView(validViews.has(nextView) ? nextView : "home");
    };
    const timer = window.setTimeout(syncViewFromUrl, 0);
    window.addEventListener("popstate", syncViewFromUrl);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", syncViewFromUrl); };
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => { const matchesCategory = activeCategory === "All" || product.category === activeCategory; const term = search.trim().toLowerCase(); return matchesCategory && (!term || `${product.name} ${product.category}`.toLowerCase().includes(term)); }), [products, activeCategory, search]);
  const featuredProduct = products[0] || initialProducts[0];
  const supportingProduct = products[1] || featuredProduct;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistProducts = products.filter((product) => wishlist.includes(product.id));
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 6;
  const addToCart = (product) => { setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; }); setToast(`${product.name} added to your cart`); };
  const toggleWishlist = (product) => {
    const isWishlisted = wishlist.includes(product.id);
    setWishlist((current) => isWishlisted ? current.filter((id) => id !== product.id) : [...current, product.id]);
    setToast(isWishlisted ? `${product.name} removed from your wishlist` : `${product.name} saved to your wishlist`);
  };
  const removeFromWishlist = (product) => {
    setWishlist((current) => current.filter((id) => id !== product.id));
    setToast(`${product.name} removed from your wishlist`);
  };
  const updateQuantity = (id, delta) => setCart((current) => current.reduce((next, item) => { if (item.id !== id) return [...next, item]; const quantity = item.quantity + delta; return quantity > 0 ? [...next, { ...item, quantity }] : next; }, []));
  const navigateTo = (view) => {
    const url = view === "home" ? "/" : `/?view=${view}`;
    window.history.pushState({}, "", url);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openSearch = () => {
    navigateTo("shop");
    window.setTimeout(() => document.getElementById("catalog-search")?.focus(), 250);
  };
  const openWishlist = () => {
    setActiveAccountSection("wishlist");
    navigateTo("account");
  };
  const selectAccountSection = (sectionId) => {
    if (sectionId === "cart") { setCartOpen(true); return; }
    if (sectionId === "logout") { setToast("Customer sign-in is not configured yet."); return; }
    setActiveAccountSection(sectionId);
  };
  const openCheckout = () => {
    if (!customerSession?.access_token) {
      setCartOpen(false);
      setToast("Sign in or create an account before placing an order.");
      navigateTo("account");
      return;
    }
    setCheckoutError("");
    setShowCheckout(true);
  };
  const completeCheckout = async (event) => {
    event.preventDefault();
    if (!customerSession?.access_token) {
      setShowCheckout(false);
      setCartOpen(false);
      setToast("Sign in or create an account before placing an order.");
      navigateTo("account");
      return;
    }
    setOrderSubmitting(true);
    setCheckoutError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${customerSession.access_token}` },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
          phone: checkoutDetails.phone,
          shippingAddress: checkoutDetails.shippingAddress,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Could not place the order.");
      setCart([]);
      setShowCheckout(false);
      setCartOpen(false);
      setOrdersVersion((version) => version + 1);
      setActiveAccountSection("orders");
      setToast(`Order saved. Send ${money.format(Number(body.order.total))} to MoMo number 0599512072; it will remain pending until verified.`);
      setCheckoutDetails({ phone: "", shippingAddress: "" });
    } catch (error) {
      setCheckoutError(error.message || "Could not place the order.");
    } finally {
      setOrderSubmitting(false);
    }
  };

  return <main className={`page-view page-${activeView}`}>
    <header className="site-header"><div className="brand brand-mark" aria-label="Doresther Tradings"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></div><nav className="main-nav" aria-label="Main navigation"><button className={activeView === "home" ? "active" : ""} onClick={() => navigateTo("home")}>Home</button><button className={activeView === "shop" ? "active" : ""} onClick={() => navigateTo("shop")}>Shop</button><button className={activeView === "about" ? "active" : ""} onClick={() => navigateTo("about")}>About</button></nav><div className="header-actions"><button className="icon-button search-toggle" onClick={openSearch} aria-label="Search"><Icon name="search" /></button><button className="icon-button mobile-wishlist-toggle" onClick={openWishlist} aria-label={`Wishlist, ${wishlistProducts.length} saved items`}><Icon name="heart" /></button><button className="icon-button account-toggle" onClick={() => navigateTo("account")} aria-label="Account"><Icon name="user" /></button><button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><Icon name="bag" /><span>Cart</span><b>{cartCount}</b></button><button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation"><span /><span /></button></div></header>
    <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onNavigate={navigateTo} onOpenCart={() => setCartOpen(true)} cartCount={cartCount} />
    <nav className="mobile-bottom-nav" aria-label="Quick navigation"><button className={activeView === "home" ? "active" : ""} onClick={() => navigateTo("home")} aria-current={activeView === "home" ? "page" : undefined}><Icon name="home" size={20} /><span>Home</span></button><button className={activeView === "shop" ? "active" : ""} onClick={openSearch} aria-current={activeView === "shop" ? "page" : undefined}><Icon name="search" size={20} /><span>Search</span></button><button onClick={() => setCartOpen(true)} aria-label={`Cart, ${cartCount} items`}><span className="mobile-nav-icon"><Icon name="bag" size={20} />{cartCount > 0 && <b>{cartCount}</b>}</span><span>Cart</span></button><button className={activeView === "account" ? "active" : ""} onClick={() => navigateTo("account")} aria-current={activeView === "account" ? "page" : undefined}><Icon name="user" size={20} /><span>Account</span></button></nav>
    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow">Skincare, considered</p><h1>Discover your<br /><em>everyday glow.</em></h1><p className="hero-text">Thoughtful skincare essentials for simple rituals and skin that feels like you.</p><div className="hero-actions"><button onClick={() => navigateTo("shop")} className="primary-button">Shop collection <Icon name="arrow" size={18} /></button></div><div className="hero-benefits"><span>Skin-first essentials</span><span>Simple daily rituals</span><span>Carefully considered</span></div></div><div className="hero-visual" aria-label={`Featured skincare products: ${featuredProduct.name} and ${supportingProduct.name}`}><div className="floating-badge">The daily edit</div><div className="hero-product-showcase"><div className="glow-orb" /><div className="hero-main-image" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={featuredProduct.name} /><div className="hero-support-image" style={{ backgroundImage: `url(${supportingProduct.image})` }} role="img" aria-label={supportingProduct.name} /></div><article className="showcase-card"><p>{featuredProduct.category}</p><h2>{featuredProduct.name}</h2><p className="showcase-description">{featuredProduct.cardDescription || featuredProduct.description}</p><div className="hero-feature-actions"><strong>{money.format(featuredProduct.price)}</strong><button onClick={() => addToCart(featuredProduct)} aria-label={`Add ${featuredProduct.name} to cart`}><Icon name="plus" size={17} /></button></div></article></div></section>
    {activeView !== "home" && <>
      <section className="feature-showcase"><div className="feature-media"><div className="feature-visual feature-product-image" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={featuredProduct.name} /></div><div className="feature-copy"><p className="eyebrow">Featured product</p><h2>{featuredProduct.name}</h2><p>{featuredProduct.cardDescription || featuredProduct.description}</p><div className="feature-actions"><button className="primary-button wide" onClick={() => addToCart(featuredProduct)}>Add to cart <Icon name="plus" size={18} /></button><strong>{money.format(featuredProduct.price)}</strong></div></div></section>
      <section className="shop-section" id="shop"><div className="section-heading"><div><p className="eyebrow">The edit</p><h2>Made for your skin,<br /><em>not a trend.</em></h2></div><p className="section-intro">Small-batch essentials, rooted in skin science and designed to be used to the last drop.</p></div><div className="catalog-controls"><div className="category-tabs" aria-label="Product categories">{categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><label className="search-box"><Icon name="search" size={18} /><input id="catalog-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></label></div>{filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onPreview={setProductDetail} isWishlisted={wishlist.includes(product.id)} onToggleWishlist={toggleWishlist} />)}</div> : <div className="empty-state"><p>No pieces found for that search.</p><button className="text-button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>View all products <Icon name="arrow" size={16} /></button></div>}</section>
      <section className="newsletter"><p className="eyebrow">A note from Doresther Tradings</p><h2>Good things, in your inbox.</h2><form onSubmit={(event) => { event.preventDefault(); setToast("Welcome to the Doresther Tradings list."); event.currentTarget.reset(); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button aria-label="Subscribe"><Icon name="arrow" /></button></form><small>By subscribing, you agree to receive marketing emails. Unsubscribe anytime.</small></section>
      {activeView === "about" && <section className="about-page"><div className="about-intro"><div className="about-intro-copy"><p className="eyebrow">About Doresther Tradings</p><h1>Quality shopping,<br /><em>made simple.</em></h1><p>We believe shopping should be simple, convenient, and enjoyable. Doresther Tradings brings carefully selected beauty and personal-care products from trusted sellers directly to customers.</p></div><div className="about-image" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={`Featured product from Doresther Tradings: ${featuredProduct.name}`} /><p className="about-image-caption">Thoughtful finds for everyday care</p></div><section className="about-mission"><p className="eyebrow">Our mission</p><h2>Make good products easier to find and easier to enjoy.</h2><p>We aim to connect customers with considered products, dependable service, and a shopping experience that feels clear from discovery to delivery.</p></section><section className="about-benefits"><div className="about-section-heading"><p className="eyebrow">Why choose us</p><h2>Good care, without the guesswork.</h2></div><div className="about-benefit-list"><article><span>01</span><div><h3>Fast delivery</h3><p>Convenient delivery options to help your order reach you promptly.</p></div></article><article><span>02</span><div><h3>Secure payments</h3><p>Choose from the payment options available at checkout.</p></div></article><article><span>03</span><div><h3>Quality products</h3><p>A considered selection sourced from trusted sellers.</p></div></article><article><span>04</span><div><h3>Easy returns</h3><p>Contact us about an order and we’ll help with the next steps.</p></div></article><article><span>05</span><div><h3>Customer support</h3><p>Reach our team by phone or WhatsApp for assistance.</p></div></article></div></section><section className="about-values"><div><p className="eyebrow">Our values</p><h2>What guides us</h2></div><ul><li>Quality</li><li>Trust</li><li>Customer satisfaction</li><li>Transparency</li></ul></section><section className="about-contact"><div><p className="eyebrow">Contact & location</p><h2>We’re here to help.</h2></div><address><p><span>Phone</span><a href="tel:+233535082115">0535082115</a><a href="tel:+233502254133">0502254133</a></p><p><span>WhatsApp</span><a href="https://wa.me/233240958153" target="_blank" rel="noreferrer">Chat with us</a></p><p><span>Email</span><span className="about-contact-pending">Email details to be provided</span></p><p><span>Social media</span><span className="about-contact-pending">Social profiles to be provided</span></p><p><span>Location</span><span>LX42 Flora ST<br />Amasaman- Ashialaja<br />GPS: GS 0775-9834</span></p></address></section></section>}
    </>}
    {activeView === "account" && <section className="account-page"><header className="account-heading"><div><p className="eyebrow">Customer account</p><h1>Welcome, Elliot</h1><p>Your orders and account preferences, all in one place.</p></div><button className="account-cart-link" onClick={() => setCartOpen(true)}><Icon name="bag" size={17} /> Cart <span>{cartCount}</span></button></header><div className="account-layout"><nav className="account-sidebar" aria-label="Account sections">{accountSections.map((section) => <button key={section.id} className={activeAccountSection === section.id ? "active" : ""} onClick={() => selectAccountSection(section.id)}><Icon name={section.icon} size={18} /><span>{section.label}</span>{section.id === "cart" && cartCount > 0 && <b>{cartCount}</b>}</button>)}</nav><section className="account-content">{activeAccountSection === "orders" && <><div className="account-section-heading"><div><p className="eyebrow">Your account</p><h2>Order history</h2></div><span>0 orders</span></div><article className="account-order"><div className="account-order-top"><div><p className="eyebrow">Delivery status</p><h3>0 items delivered</h3></div><span className="order-status"><i />No deliveries yet</span></div><div className="account-order-summary"><div><span>Order total</span><strong>GH₵0</strong></div><span>Awaiting orders</span></div><button className="account-text-action" onClick={() => navigateTo("shop")}>Browse products <Icon name="arrow" size={15} /></button></article></>}{activeAccountSection === "profile" && <AccountEmptyState title="My Profile" message="Profile details will appear here once customer accounts are connected." />    }{activeAccountSection === "wishlist" && <><div className="account-section-heading wishlist-heading"><div><p className="eyebrow">Saved for later</p><h2>My Wishlist <span aria-hidden="true">♥</span></h2></div><span>{wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"}</span></div>{wishlistProducts.length ? <div className="wishlist-grid">{wishlistProducts.map((product) => <article className="wishlist-card" key={product.id}><div className="wishlist-card-image" style={{ backgroundImage: `url(${product.image})` }} role="img" aria-label={product.name}><button className="wishlist-remove" onClick={() => removeFromWishlist(product)} aria-label={`Remove ${product.name} from wishlist`}><Icon name="favorite" size={19} /></button>{product.badge && <span className="product-badge">{product.badge}</span>}</div><div className="wishlist-card-info"><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><p className="wishlist-card-price">{money.format(product.price)}{product.originalPrice > product.price && <del>{money.format(product.originalPrice)}</del>}</p><div className="wishlist-product-meta"><span>{product.discountLabel || (product.discountPercent ? `${product.discountPercent}% off` : "No current discount")}</span><span className={product.rating ? "wishlist-rating rated" : "wishlist-rating"}>{product.rating ? <><Icon name="star" size={15} /> {product.rating}</> : "Not rated"}</span></div><button className="add-to-cart-button" onClick={() => addToCart(product)}>Add to cart <Icon name="bag" size={16} /></button></div></article>)}</div> : <div className="wishlist-empty"><div className="wishlist-empty-icon"><Icon name="heart" size={25} /></div><h3>Your wishlist is empty</h3><p>Save products you love and find them here later.</p><button className="primary-button" onClick={() => navigateTo("shop")}>Continue Shopping <Icon name="arrow" size={17} /></button></div>}</>}{activeAccountSection === "addresses" && <AccountEmptyState title="Delivery Addresses" message="No saved delivery addresses yet." />}{activeAccountSection === "payments" && <AccountEmptyState title="Payment Methods" message="No saved payment methods. Payment details are not stored in this demo." />}{activeAccountSection === "returns" && <div className="account-empty"><p className="eyebrow">Order support</p><h2>Returns & Refunds</h2><p>For help with a return or refund, contact our support team with your order number.</p><a className="account-text-action" href="https://wa.me/233240958153" target="_blank" rel="noreferrer">Contact support <Icon name="arrow" size={15} /></a></div>}{activeAccountSection === "notifications" && <AccountEmptyState title="Notifications" message="You’re all caught up. Account notifications will appear here." />}{activeAccountSection === "settings" && <AccountEmptyState title="Settings" message="Account settings will be available when customer sign-in is connected." />}{activeAccountSection === "support" && <div className="account-empty"><p className="eyebrow">We’re here to help</p><h2>Help & Support</h2><p>Call us at <a href="tel:+233535082115">0535082115</a> or message us on WhatsApp.</p><a className="account-text-action" href="https://wa.me/233240958153" target="_blank" rel="noreferrer">Message on WhatsApp <Icon name="arrow" size={15} /></a></div>}</section></div></section>}
    <footer><div className="brand brand-mark" aria-label="Doresther Tradings"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></div><div className="footer-nav"><button onClick={() => navigateTo("shop")}>Shop</button><button onClick={() => navigateTo("about")}>About</button></div><address className="business-contact"><div className="business-contact-identity"><p className="eyebrow">Produced by</p><strong>Doresther Tradings</strong></div><div className="business-address"><span>LX42 Flora ST</span><span>Amasaman- Ashialaja</span><span>GPS Address: GS 0775-9834</span></div><div className="business-phones"><a href="tel:+233535082115">0535082115</a><span>/</span><a href="tel:+233502254133">0502254133</a></div></address><p className="footer-copyright">© 2026 Doresther Tradings. Made with intention. <span className="designer-credit"><span className="designer-credit-label">Designed by</span><strong>Uncle T</strong></span></p></footer>
    {toast && <div className="toast"><span><Icon name="check" size={17} /></span>{toast}</div>}
    {isCartOpen && <><button className="modal-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" /><aside className="cart-drawer" aria-modal="true" role="dialog" aria-label="Your shopping cart"><div className="drawer-header"><h2>Your cart <span>({cartCount})</span></h2><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="close" /></button></div>{cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><span className="cart-image" style={{ backgroundImage: `url(${item.image})` }} /><div><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{money.format(item.price)}</p><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}><Icon name="plus" size={14} /></button></div></div><button className="remove-button" onClick={() => updateQuantity(item.id, -item.quantity)}>Remove</button></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><b>{money.format(subtotal)}</b></p><p><span>Shipping</span><b>{shipping ? money.format(shipping) : "Complimentary"}</b></p><p className="total"><span>Total</span><b>{money.format(subtotal + shipping)}</b></p><button className="primary-button wide" onClick={openCheckout}>Secure checkout <Icon name="arrow" size={18} /></button><small><Icon name="shield" size={14} /> Sign in required · payment will be verified manually</small></div></> : <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={28} /></div><h3>Your cart is waiting.</h3><p>Add an essential to begin your ritual.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Shop collection <Icon name="arrow" size={18} /></button></div>}</aside></>}
    {productDetail && <><button className="modal-backdrop" onClick={() => setProductDetail(null)} aria-label="Close product details" /><div className="product-modal" role="dialog" aria-modal="true" aria-label={productDetail.name}><button className="icon-button close-modal" onClick={() => setProductDetail(null)} aria-label="Close product details"><Icon name="close" /></button><div className="modal-product-image" style={{ backgroundImage: `url(${productDetail.image})` }} /><div className="modal-product-panel"><div className="modal-product-copy"><p className="eyebrow">{productDetail.category}</p><h2>{productDetail.name}</h2><p className="modal-price">{money.format(productDetail.price)} <span>· {productDetail.size}</span></p><button className="account-text-action product-modal-wishlist" onClick={() => toggleWishlist(productDetail)}><Icon name={wishlist.includes(productDetail.id) ? "favorite" : "heart"} size={17} /> {wishlist.includes(productDetail.id) ? "Saved to wishlist" : "Save to wishlist"}</button><section className="product-guide" aria-label="Product guide"><h3>Product Guide</h3><details open><summary>Product Description</summary><p>{productDetail.description || "Product information is not available yet."}</p></details><details><summary>How to Use</summary><ProductGuideList content={productDetail.howToUse || defaultProductUsage} numbered /></details><details><summary>Caution</summary><ProductGuideList content={productDetail.caution || defaultProductCaution} /></details></section></div><div className="modal-product-actions"><button className="primary-button wide" onClick={() => { addToCart(productDetail); setProductDetail(null); setCartOpen(true); }}>Add to cart <Icon name="bag" size={18} /></button><p className="detail-note"><Icon name="shield" size={17} /> Thoughtfully formulated. Always cruelty-free.</p></div></div></div></>}
    {showCheckout && <><button className="modal-backdrop" onClick={() => setShowCheckout(false)} aria-label="Close checkout" /><section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Place your order"><button className="icon-button close-modal" onClick={() => setShowCheckout(false)} aria-label="Close checkout"><Icon name="close" /></button><p className="eyebrow">Order details</p><h2>Almost yours.</h2><p className="checkout-intro">Your order will be saved as awaiting payment. We’ll verify your Mobile Money transfer manually.</p><form onSubmit={completeCheckout}><label>Mobile number<input required autoComplete="tel" type="tel" value={checkoutDetails.phone} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, phone: event.target.value })} placeholder="Your contact number" /></label><label>Delivery address<textarea required autoComplete="street-address" minLength={8} maxLength={500} value={checkoutDetails.shippingAddress} onChange={(event) => setCheckoutDetails({ ...checkoutDetails, shippingAddress: event.target.value })} placeholder="Street, area, city, and delivery directions" /></label><div className="momo-payment"><p className="eyebrow">Manual Mobile Money payment</p><p>After placing the order, send <strong>{money.format(subtotal + shipping)}</strong> to</p><b className="momo-number">0599512072</b><small>Do not share your PIN or MoMo authorization code. Your order remains pending until payment is verified.</small></div><div className="checkout-total"><span>Estimated total</span><b>{money.format(subtotal + shipping)}</b></div>{checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}<button className="primary-button wide" type="submit" disabled={orderSubmitting}>{orderSubmitting ? "Saving order…" : "Place order"} <Icon name="arrow" size={18} /></button><small><Icon name="shield" size={14} /> Prices and total are confirmed by the server when the order is placed.</small></form></section></>}
    {activeView === "account" && <CustomerAccount onSessionChange={handleSessionChange} activeSection={activeAccountSection} onSelectSection={setActiveAccountSection} wishlistProducts={wishlistProducts} onAddToCart={addToCart} onRemoveFromWishlist={removeFromWishlist} onOpenCart={() => setCartOpen(true)} cartCount={cartCount} refreshKey={ordersVersion} />}
    {activeView === "account" && <CustomerAccount onSessionChange={handleSessionChange} activeSection={activeAccountSection} onSelectSection={setActiveAccountSection} wishlistProducts={wishlistProducts} onAddToCart={addToCart} onRemoveFromWishlist={removeFromWishlist} onOpenCart={() => setCartOpen(true)} cartCount={cartCount} refreshKey={ordersVersion} />}
  </main>;
}
