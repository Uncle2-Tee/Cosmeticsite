"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultProductCaution, defaultProductUsage, initialProducts, productCategories } from "../../lib/catalog";

const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 });
const emptyForm = { name: "", category: "Serums", price: "", size: "", image: "", description: "", cardDescription: "", howToUse: defaultProductUsage, caution: defaultProductCaution };

export default function AdminDashboard() {
  const [products, setProducts] = useState(initialProducts);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const restoreSavedStore = window.setTimeout(() => {
      try { const saved = JSON.parse(localStorage.getItem("lumera-products")); if (Array.isArray(saved) && saved.length) setProducts(saved); } catch { /* Empty browser storage uses the seeded catalogue. */ }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreSavedStore);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem("lumera-products", JSON.stringify(products)); }, [products, loaded]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(""), 2800); return () => window.clearTimeout(timer); }, [message]);

  function addProduct(event) {
    event.preventDefault();
    const description = form.description.trim() || "A considered beauty essential, made for your daily ritual.";
    const product = { id: `${Date.now()}-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name: form.name.trim(), category: form.category, price: Number(form.price), size: form.size.trim() || "50 ml", image: form.image.trim() || "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=900&q=85", description, cardDescription: form.cardDescription.trim() || description, howToUse: form.howToUse.trim() || defaultProductUsage, caution: form.caution.trim() || defaultProductCaution, badge: "Just added" };
    setProducts((current) => [product, ...current]);
    setForm(emptyForm);
    setMessage(`${product.name} has been published.`);
  }

  function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    setProducts((current) => current.filter((item) => item.id !== id));
    setMessage(`${product?.name || "Product"} has been removed.`);
  }

  function updateFeaturedDescription(description) {
    const featuredId = products[0]?.id;
    if (!featuredId) return;
    setProducts((current) => current.map((product) => product.id === featuredId ? { ...product, cardDescription: description } : product));
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/atelier");
    router.refresh();
  }

  return <main className="dashboard-shell"><header className="dashboard-header"><div className="atelier-brand brand-mark" aria-label="Doresther Tradings"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></div><div><span className="secure-status">● Secure admin session</span><button onClick={signOut}>Sign out</button></div></header><section className="dashboard-heading"><p className="atelier-kicker">Store administration</p><h1>Good morning.</h1><p>Keep your collection polished, current, and ready to shop.</p></section><section className="dashboard-grid"><form className="catalog-form" onSubmit={addProduct}><div className="panel-heading"><div><p className="atelier-kicker">New listing</p><h2>Add a product</h2></div></div><label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Dew Ritual Essence" /></label><div className="field-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{productCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Price (GHS)<input required min="1" step="0.01" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="36.00" /></label></div><div className="field-row"><label>Size<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} placeholder="50 ml" /></label><label>Image URL<input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://" /></label></div><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short, inviting description." /></label><label>Home card description<textarea value={form.cardDescription} onChange={(event) => setForm({ ...form, cardDescription: event.target.value })} placeholder="Short copy displayed over the featured product." /></label><label>How to use<textarea value={form.howToUse} onChange={(event) => setForm({ ...form, howToUse: event.target.value })} rows={3} /></label><label>Caution<textarea value={form.caution} onChange={(event) => setForm({ ...form, caution: event.target.value })} rows={3} /></label><button className="publish-button" type="submit">Publish product <span>→</span></button></form><section className="catalog-panel"><div className="panel-heading"><div><p className="atelier-kicker">Live catalogue</p><h2>Products</h2></div><span className="product-count">{products.length} live</span></div>{products[0] && <label className="featured-copy-editor">Home card description for {products[0].name}<textarea value={products[0].cardDescription ?? products[0].description} onChange={(event) => updateFeaturedDescription(event.target.value)} /></label>}<div className="catalog-list">{products.map((product) => <article key={product.id} className="catalog-item"><span className="catalog-image" style={{ backgroundImage: `url(${product.image})` }} /><div><h3>{product.name}</h3><p>{product.category} <i>·</i> {product.size}</p></div><strong>{money.format(product.price)}</strong><button onClick={() => deleteProduct(product.id)} aria-label={`Remove ${product.name}`}>Remove</button></article>)}</div></section></section>{message && <div className="admin-toast">✓ {message}</div>}</main>;
}
