"use client";

import { useEffect, useMemo, useState } from "react";
import { initialProducts, productCategories } from "../lib/catalog";
import MobileMenu from "./components/mobile-menu";

const categories = ["All", ...productCategories];
const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 });
const journalStories = [
  {
    imageClass: "journal-image-one",
    kicker: "Ritual notes",
    readTime: "4 min read",
    title: "How to make space for your evening ritual.",
    lede: "A thoughtful routine does not need a dozen steps. A few well-chosen essentials, used with care, can make the end of the day feel quieter and more consistent.",
    sections: [
      { heading: "Begin with a clean slate", body: "Use a gentle cleanser to lift away sunscreen, makeup, and the day’s buildup. Lukewarm water is usually more comfortable than very hot water. Pat skin dry rather than rubbing, and leave it just slightly damp if that feels comfortable." },
      { heading: "Keep the layers simple", body: "Apply a treatment such as Velvet Glow Serum according to its directions, then follow with Cloud Barrier Cream to help soften and replenish the feel of skin. If you are introducing a new active, add it gradually instead of changing your whole routine at once." },
      { heading: "Let consistency do the work", body: "A routine is useful when it fits real life. Keep the products you reach for together, take a moment to notice how your skin feels, and adjust when the season or your needs change. There is no prize for having the longest shelf." },
    ],
  },
  {
    imageClass: "journal-image-two",
    kicker: "Ingredient diary",
    readTime: "3 min read",
    title: "Why ceramides belong in every skin story.",
    lede: "Ceramides are lipids found naturally in the outer layers of skin. In skincare, they are valued for helping support a comfortable, well-moisturized skin barrier.",
    sections: [
      { heading: "A part of the barrier", body: "Think of the outer skin barrier as a carefully arranged surface. Ceramides are among the lipids that help hold that structure together. When skin feels dry or tight, a moisturizer formulated with barrier-supporting ingredients can be a useful part of a gentle routine." },
      { heading: "Make moisture a habit", body: "Cloud Barrier Cream pairs ceramides with a rich, cushioning texture. Smooth a comfortable layer over clean skin, especially after cleansing, and use it consistently rather than waiting until skin feels uncomfortable." },
      { heading: "Comfort over complexity", body: "No single ingredient is a shortcut, and everyone’s skin is different. Keep the rest of your routine considerate, introduce new products one at a time, and pause use if a product causes persistent irritation." },
    ],
  },
  {
    imageClass: "journal-image-three",
    kicker: "Skin school",
    readTime: "5 min read",
    title: "The gentle art of protecting your barrier.",
    lede: "A comfortable routine is often built around a few steady habits: cleanse without overdoing it, moisturize in a way that suits your skin, and protect it from the sun during the day.",
    sections: [
      { heading: "Cleanse with a light hand", body: "A cleanser should leave skin feeling fresh, not stripped. Clear Day Cleanser is designed as a daily gel step; use a small amount, rinse thoroughly, and avoid scrubbing or repeatedly washing when one cleanse is enough." },
      { heading: "Follow with comfort", body: "Moisturizer helps reduce that dry, tight feeling after cleansing. Choose a texture you will actually use and apply it while your skin is comfortable. A simple routine can be more sustainable than layering several new formulas at once." },
      { heading: "Protect the routine", body: "In the morning, finish with a broad-spectrum sunscreen and reapply as directed on its label. Give new products time, introduce them one at a time, and seek professional advice for ongoing irritation or skin concerns." },
    ],
  },
];

function Icon({ name, size = 20, stroke = 1.8 }) {
  const paths = {
    bag: <><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" /></>, search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4 4" /></>, arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>, close: <><path d="m6 6 12 12M18 6 6 18" /></>, plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />, check: <path d="m5 12 4.4 4.4L19 6.8" />, shield: <><path d="M12 3 19 6v5c0 4.7-3.1 8.1-7 10-3.9-1.9-7-5.3-7-10V6l7-3Z" /><path d="m8.8 12 2.1 2.1 4.3-4.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function ProductCard({ product, onAdd, onPreview }) {
  return <article className="product-card"><button className="product-image" onClick={() => onPreview(product)} aria-label={`View ${product.name}`}><span className="product-photo" style={{ backgroundImage: `url(${product.image})` }} />{product.badge && <span className="product-badge">{product.badge}</span>}<span className="quick-add">Quick view <Icon name="arrow" size={15} /></span></button><div className="product-info"><div><p className="eyebrow">{product.category}</p><h3>{product.name}</h3></div><p className="product-price">{money.format(product.price)}</p></div><button className="add-to-cart-button" onClick={() => onAdd(product)}>Add to cart <Icon name="plus" size={16} /></button></article>;
}

export default function Home() {
  const [products, setProducts] = useState(initialProducts);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isCartOpen, setCartOpen] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const [productDetail, setProductDetail] = useState(null);
  const [activeJournalStory, setActiveJournalStory] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const restoreSavedStore = window.setTimeout(() => {
      try { const savedProducts = JSON.parse(localStorage.getItem("lumera-products")); const savedCart = JSON.parse(localStorage.getItem("lumera-cart")); if (Array.isArray(savedProducts) && savedProducts.length) setProducts(savedProducts); if (Array.isArray(savedCart)) setCart(savedCart); } catch { /* Browser storage can be unavailable in private contexts. */ }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreSavedStore);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem("lumera-products", JSON.stringify(products)); }, [products, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem("lumera-cart", JSON.stringify(cart)); }, [cart, loaded]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => window.clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!activeJournalStory) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => { if (event.key === "Escape") setActiveJournalStory(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", closeOnEscape); };
  }, [activeJournalStory]);
  useEffect(() => {
    const validViews = new Set(["home", "shop", "ritual", "journal"]);
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
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 6;
  const addToCart = (product) => { setCart((current) => { const found = current.find((item) => item.id === product.id); return found ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }]; }); setToast(`${product.name} added to your cart`); };
  const updateQuantity = (id, delta) => setCart((current) => current.reduce((next, item) => { if (item.id !== id) return [...next, item]; const quantity = item.quantity + delta; return quantity > 0 ? [...next, { ...item, quantity }] : next; }, []));
  const navigateTo = (view) => {
    const url = view === "home" ? "/" : `/?view=${view}`;
    window.history.pushState({}, "", url);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const completeCheckout = (event) => {
    event.preventDefault();
    if (paymentMethod === "momo") {
      setToast(`Send ${money.format(subtotal + shipping)} to MoMo number 0599512072. Transfer verification is manual.`);
      return;
    }
    setCart([]);
    setShowCheckout(false);
    setCartOpen(false);
    setToast("Demo payment approved — your order is confirmed.");
  };

  return <main className={`page-view page-${activeView}`}>
    <header className="site-header"><button className="mobile-menu-button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation" aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation"><span /><span /></button><button className="brand brand-button brand-mark" onClick={() => navigateTo("home")} aria-label="Doresther Tradings home"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></button><nav className="main-nav" aria-label="Main navigation"><button className={activeView === "home" ? "active" : ""} onClick={() => navigateTo("home")}>Home</button><button className={activeView === "shop" ? "active" : ""} onClick={() => navigateTo("shop")}>Shop</button><button className={activeView === "ritual" ? "active" : ""} onClick={() => navigateTo("ritual")}>Our ritual</button><button className={activeView === "journal" ? "active" : ""} onClick={() => navigateTo("journal")}>Journal</button></nav><div className="header-actions"><button className="icon-button search-toggle" onClick={() => { navigateTo("shop"); window.setTimeout(() => document.getElementById("catalog-search")?.focus(), 250); }} aria-label="Search"><Icon name="search" /></button><button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open cart, ${cartCount} items`}><Icon name="bag" /><span>Cart</span><b>{cartCount}</b></button></div></header>
    <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onNavigate={navigateTo} onOpenCart={() => setCartOpen(true)} cartCount={cartCount} />
    <section className="hero" id="top"><div className="hero-copy"><span className="hero-tag">New arrival · Glow ritual</span><p className="eyebrow">Skincare, considered</p><h1>Brighten skin.<br /><em>without the noise.</em></h1><p className="hero-text">High-performance formulas that turn the everyday into a beautiful ritual.</p><div className="hero-actions"><button onClick={() => navigateTo("shop")} className="primary-button">Shop the collection <Icon name="arrow" size={18} /></button><button onClick={() => navigateTo("ritual")} className="secondary-button">View routine</button></div><div className="hero-metrics"><div><strong>96%</strong><span>noticed smoother skin</span></div><div><strong>4.9/5</strong><span>from repeat buyers</span></div><div><strong>30 ml</strong><span>daily glow dose</span></div></div><div className="hero-note"><span>01</span><i />Intention in every layer</div></div><div className="hero-visual" aria-label={`Featured product: ${featuredProduct.name}`}><div className="floating-badge">Hot product</div><div className="hero-product-showcase"><div className="glow-orb" /><div className="showcase-bottle showcase-product-image" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={featuredProduct.name} /></div><div className="showcase-card"><p>{featuredProduct.category}</p><h3>{featuredProduct.name}</h3><p className="showcase-description">{featuredProduct.cardDescription || featuredProduct.description}</p></div></div></section>
    {activeView !== "home" && <>
      <section className="feature-showcase"><div className="feature-media"><div className="feature-visual feature-product-image" style={{ backgroundImage: `url(${featuredProduct.image})` }} role="img" aria-label={featuredProduct.name} /></div><div className="feature-copy"><p className="eyebrow">Featured product</p><h2>{featuredProduct.name}</h2><p>{featuredProduct.cardDescription || featuredProduct.description}</p><div className="feature-actions"><button className="primary-button wide" onClick={() => addToCart(featuredProduct)}>Add to cart <Icon name="plus" size={18} /></button><strong>{money.format(featuredProduct.price)}</strong></div></div></section>
      <section className="promise-strip" id="ritual"><div><span className="promise-number">01</span><p>Thoughtful formulas<br />that do more with less.</p></div><div><span className="promise-number">02</span><p>Made for every face,<br />every chapter, every day.</p></div><div><span className="promise-number">03</span><p>Clinically mindful.<br />Never tested on animals.</p></div></section>
      <section className="shop-section" id="shop"><div className="section-heading"><div><p className="eyebrow">The edit</p><h2>Made for your skin,<br /><em>not a trend.</em></h2></div><p className="section-intro">Small-batch essentials, rooted in skin science and designed to be used to the last drop.</p></div><div className="catalog-controls"><div className="category-tabs" aria-label="Product categories">{categories.map((category) => <button key={category} className={activeCategory === category ? "active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><label className="search-box"><Icon name="search" size={18} /><input id="catalog-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" /></label></div>{filteredProducts.length ? <div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onPreview={setProductDetail} />)}</div> : <div className="empty-state"><p>No pieces found for that search.</p><button className="text-button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>View all products <Icon name="arrow" size={16} /></button></div>}</section>
      <section className="journal-section"><div className="journal-heading"><p className="eyebrow">The Doresther Tradings journal</p><h2>Notes for<br /><em>your ritual.</em></h2><p>Small moments of care, considered with intention.</p></div><div className="journal-grid">{journalStories.map((story) => <article key={story.title}><span className={`journal-image ${story.imageClass}`} /><p className="eyebrow">{story.kicker} · {story.readTime}</p><h3>{story.title}</h3><button aria-haspopup="dialog" onClick={() => setActiveJournalStory(story)}>Read story <Icon name="arrow" size={15} /></button></article>)}</div></section>
      <section className="newsletter"><p className="eyebrow">A note from Doresther Tradings</p><h2>Good things, in your inbox.</h2><form onSubmit={(event) => { event.preventDefault(); setToast("Welcome to the Doresther Tradings list."); event.currentTarget.reset(); }}><input type="email" required placeholder="Your email address" aria-label="Your email address" /><button aria-label="Subscribe"><Icon name="arrow" /></button></form><small>By subscribing, you agree to receive marketing emails. Unsubscribe anytime.</small></section>
    </>}
    <footer><button className="brand brand-button brand-mark" onClick={() => navigateTo("home")} aria-label="Doresther Tradings home"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></button><div className="footer-nav"><button onClick={() => navigateTo("shop")}>Shop</button><button onClick={() => navigateTo("ritual")}>Our philosophy</button></div><address className="business-contact"><div className="business-contact-identity"><p className="eyebrow">Produced by</p><strong>Doresther Tradings</strong></div><div className="business-address"><span>LX42 Flora ST</span><span>Amasaman- Ashialaja</span><span>GPS Address: GS 0775-9834</span></div><div className="business-phones"><a href="tel:+233535082115">0535082115</a><span>/</span><a href="tel:+233502254133">0502254133</a></div></address><p className="footer-copyright">© 2026 Doresther Tradings. Made with intention.</p></footer>
    {toast && <div className="toast"><span><Icon name="check" size={17} /></span>{toast}</div>}
    {activeJournalStory && <><button className="modal-backdrop journal-backdrop" onClick={() => setActiveJournalStory(null)} aria-label="Close journal story" /><article className="journal-story-dialog" role="dialog" aria-modal="true" aria-labelledby="journal-story-title"><button className="icon-button close-modal" onClick={() => setActiveJournalStory(null)} aria-label="Close journal story"><Icon name="close" /></button><div className={`journal-story-art ${activeJournalStory.imageClass}`} role="img" aria-label={activeJournalStory.kicker} /><div className="journal-story-content"><p className="eyebrow">{activeJournalStory.kicker} · {activeJournalStory.readTime}</p><h2 id="journal-story-title">{activeJournalStory.title}</h2><p className="journal-story-lede">{activeJournalStory.lede}</p>{activeJournalStory.sections.map((section) => <section key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></section>)}</div></article></>}
    {isCartOpen && <><button className="modal-backdrop" onClick={() => setCartOpen(false)} aria-label="Close cart" /><aside className="cart-drawer" aria-modal="true" role="dialog" aria-label="Your shopping cart"><div className="drawer-header"><h2>Your cart <span>({cartCount})</span></h2><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><Icon name="close" /></button></div>{cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><span className="cart-image" style={{ backgroundImage: `url(${item.image})` }} /><div><p className="eyebrow">{item.category}</p><h3>{item.name}</h3><p>{money.format(item.price)}</p><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}><Icon name="plus" size={14} /></button></div></div><button className="remove-button" onClick={() => updateQuantity(item.id, -item.quantity)}>Remove</button></div>)}</div><div className="cart-summary"><p><span>Subtotal</span><b>{money.format(subtotal)}</b></p><p><span>Shipping</span><b>{shipping ? money.format(shipping) : "Complimentary"}</b></p><p className="total"><span>Total</span><b>{money.format(subtotal + shipping)}</b></p><button className="primary-button wide" onClick={() => setShowCheckout(true)}>Secure checkout <Icon name="arrow" size={18} /></button><small><Icon name="shield" size={14} /> Secure, encrypted checkout</small></div></> : <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={28} /></div><h3>Your cart is waiting.</h3><p>Add an essential to begin your ritual.</p><button className="primary-button" onClick={() => setCartOpen(false)}>Shop collection <Icon name="arrow" size={18} /></button></div>}</aside></>}
    {productDetail && <><button className="modal-backdrop" onClick={() => setProductDetail(null)} aria-label="Close product details" /><div className="product-modal" role="dialog" aria-modal="true" aria-label={productDetail.name}><button className="icon-button close-modal" onClick={() => setProductDetail(null)} aria-label="Close product details"><Icon name="close" /></button><div className="modal-product-image" style={{ backgroundImage: `url(${productDetail.image})` }} /><div className="modal-product-copy"><p className="eyebrow">{productDetail.category}</p><h2>{productDetail.name}</h2><p className="modal-price">{money.format(productDetail.price)} <span>· {productDetail.size}</span></p><p>{productDetail.description}</p><button className="primary-button wide" onClick={() => { addToCart(productDetail); setProductDetail(null); setCartOpen(true); }}>Add to cart <Icon name="bag" size={18} /></button><p className="detail-note"><Icon name="shield" size={17} /> Thoughtfully formulated. Always cruelty-free.</p></div></div></>}
    {showCheckout && <><button className="modal-backdrop" onClick={() => setShowCheckout(false)} aria-label="Close checkout" /><section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Secure checkout"><button className="icon-button close-modal" onClick={() => setShowCheckout(false)} aria-label="Close checkout"><Icon name="close" /></button><p className="eyebrow">Secure checkout</p><h2>Almost yours.</h2><p className="checkout-intro">Complete your details below to reserve your ritual.</p><form onSubmit={completeCheckout}><div className="form-row"><label>First name<input required autoComplete="given-name" /></label><label>Last name<input required autoComplete="family-name" /></label></div><label>Email<input required type="email" autoComplete="email" /></label><div className="payment-methods" role="group" aria-label="Payment method"><button type="button" className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}>Card</button><button type="button" className={paymentMethod === "momo" ? "active" : ""} onClick={() => setPaymentMethod("momo")}>Mobile Money</button></div>{paymentMethod === "card" ? <label>Card details<div className="card-field"><Icon name="shield" size={17} /><input required inputMode="numeric" placeholder="4242 4242 4242 4242" /></div></label> : <div className="momo-payment"><p className="eyebrow">Mobile Money transfer</p><p>Send <strong>{money.format(subtotal + shipping)}</strong> to</p><b className="momo-number">0599512072</b><small>Orders are confirmed after the transfer is manually verified. Do not send a PIN or MoMo authorization code.</small></div>}<div className="checkout-total"><span>Total due</span><b>{money.format(subtotal + shipping)}</b></div><button className="primary-button wide" type="submit">{paymentMethod === "card" ? `Pay ${money.format(subtotal + shipping)}` : "Show MoMo payment details"} <Icon name="arrow" size={18} /></button><small><Icon name="shield" size={14} /> {paymentMethod === "card" ? "Demo card payment — no card data is stored or processed." : "Manual MoMo transfer — payment is not verified automatically."}</small></form></section></>}
  </main>;
}
