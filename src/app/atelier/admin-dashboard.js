"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { defaultProductCaution, defaultProductUsage, productCategories } from "../../lib/catalog";

const money = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", minimumFractionDigits: 2 });
const emptyForm = { name: "", category: "Serums", price: "", size: "", image: "", description: "", cardDescription: "", howToUse: defaultProductUsage, caution: defaultProductCaution };

async function readApiResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "The request could not be completed.");
  return body;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [featuredDescription, setFeaturedDescription] = useState("");
  const [message, setMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/products")
      .then(readApiResponse)
      .then(({ products: saved }) => {
        if (cancelled) return;
        setProducts(saved);
        setFeaturedDescription(saved[0]?.cardDescription ?? saved[0]?.description ?? "");
        setDatabaseReady(true);
      })
      .catch((error) => { if (!cancelled) setMessage(error.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!message || !databaseReady) return;
    const timer = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [message, databaseReady]);

  async function addProduct(event) {
    event.preventDefault();
    if (uploadingImage) return;
    if (!databaseReady) return;
    if (!form.image) { setMessage("Upload a product image."); return; }
    const description = form.description.trim() || "A considered beauty essential, made for your daily ritual.";
    const product = { id: `${Date.now()}-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, name: form.name.trim(), category: form.category, price: Number(form.price), size: form.size.trim() || "50 ml", image: form.image, description, cardDescription: form.cardDescription.trim() || description, howToUse: form.howToUse.trim() || defaultProductUsage, caution: form.caution.trim() || defaultProductCaution, badge: "Just added" };
    try {
      const { product: saved } = await readApiResponse(await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product }) }));
      setProducts((current) => [saved, ...current]);
      setForm(emptyForm);
      setMessage(`${saved.name} has been published.`);
    } catch (error) { setMessage(error.message); }
  }

  async function handleImageUpload(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { setMessage("Image file must be smaller than 5 MB."); return; }
    if (!file.type.startsWith("image/")) { setMessage("File must be an image."); return; }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { url } = await readApiResponse(await fetch("/api/admin/upload-image", { method: "POST", body: formData }));
      setForm({ ...form, image: url });
      setMessage(`${file.name} uploaded.`);
    } catch (error) { setMessage(error.message); }
    finally { setUploadingImage(false); }
  }

  async function deleteProduct(product) {
    try {
      await readApiResponse(await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, { method: "DELETE" }));
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage(`${product.name} has been removed.`);
    } catch (error) { setMessage(error.message); }
  }

  async function savePrice(product) {
    const value = priceDrafts[product.id];
    const price = Number(value);
    if (value === undefined || value.trim() === "" || !Number.isFinite(price) || price <= 0) {
      setMessage("Enter a valid price greater than zero.");
      return;
    }
    try {
      const { product: saved } = await readApiResponse(await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: product.id, price }) }));
      setProducts((current) => current.map((item) => item.id === product.id ? saved : item));
      setPriceDrafts((current) => { const next = { ...current }; delete next[product.id]; return next; });
      setMessage(`${product.name} price updated.`);
    } catch (error) { setMessage(error.message); }
  }

  async function saveFeaturedDescription() {
    const featuredId = products[0]?.id;
    if (!featuredId) return;
    try {
      const { product: saved } = await readApiResponse(await fetch("/api/admin/products", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: featuredId, cardDescription: featuredDescription }) }));
      setProducts((current) => current.map((product) => product.id === featuredId ? saved : product));
      setMessage("Featured description updated.");
    } catch (error) { setMessage(error.message); }
  }

  async function signOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/atelier");
    router.refresh();
  }

  return <main className="dashboard-shell">
    <header className="dashboard-header"><div className="atelier-brand brand-mark" aria-label="Doresther Tradings"><span className="brand-word">Doresther</span><span className="brand-tradings">Tradings</span></div><div><span className="secure-status">● Secure admin session</span><button onClick={signOut}>Sign out</button></div></header>
    <section className="dashboard-heading"><p className="atelier-kicker">Store administration</p><h1>Good morning.</h1><p>Keep your collection polished, current, and ready to shop.</p></section>
    {message && !databaseReady && <p className="database-warning" role="alert">{message} Add the Supabase environment values, then run the migration described in the README.</p>}
    <section className="dashboard-grid">
      <form className="catalog-form" onSubmit={addProduct}>
        <div className="panel-heading"><div><p className="atelier-kicker">New listing</p><h2>Add a product</h2></div></div>
        <label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Dew Ritual Essence" /></label>
        <div className="field-row"><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{productCategories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Price (GHS)<input required min="0.01" step="0.01" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="36.00" /></label></div>
        <div className="field-row"><label>Size<input value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} placeholder="50 ml" /></label><label>Product Image<input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />{form.image && <span className="upload-status" style={{ fontSize: "0.85em", color: "#666", marginTop: "0.25em", display: "block" }}>✓ Image ready</span>}</label></div>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short, inviting description." /></label>
        <label>Home card description<textarea value={form.cardDescription} onChange={(event) => setForm({ ...form, cardDescription: event.target.value })} placeholder="Short copy displayed over the featured product." /></label>
        <label>How to use<textarea value={form.howToUse} onChange={(event) => setForm({ ...form, howToUse: event.target.value })} rows={3} /></label>
        <label>Caution<textarea value={form.caution} onChange={(event) => setForm({ ...form, caution: event.target.value })} rows={3} /></label>
        <button className="publish-button" type="submit" disabled={!databaseReady}>Publish product <span>→</span></button>
      </form>
      <section className="catalog-panel">
        <div className="panel-heading"><div><p className="atelier-kicker">Live catalogue</p><h2>Products</h2></div><span className="product-count">{databaseReady ? `${products.length} live` : "Database unavailable"}</span></div>
        {products[0] && <div className="featured-copy-editor"><label htmlFor="featured-description">Home card description for {products[0].name}</label><textarea id="featured-description" value={featuredDescription} onChange={(event) => setFeaturedDescription(event.target.value)} /><button type="button" onClick={saveFeaturedDescription}>Save description</button></div>}
        <div className="catalog-list">{products.map((product) => <article key={product.id} className="catalog-item">
          <span className="catalog-image" style={{ backgroundImage: `url(${product.image})` }} />
          <div className="catalog-item-details"><h3>{product.name}</h3><p>{product.category} <i>·</i> {product.size}</p></div>
          <div className="catalog-price-editor"><label htmlFor={`price-${product.id}`}>Price (GHS)</label><div><input id={`price-${product.id}`} aria-label={`Price for ${product.name} in Ghana cedis`} type="number" min="0.01" step="0.01" required value={priceDrafts[product.id] ?? String(product.price)} onChange={(event) => setPriceDrafts((current) => ({ ...current, [product.id]: event.target.value }))} /><button type="button" onClick={() => savePrice(product)}>Save price</button></div></div>
          <button className="catalog-remove-button" type="button" onClick={() => deleteProduct(product)} aria-label={`Remove ${product.name}`}>Remove</button>
        </article>)}</div>
      </section>
    </section>
    {message && databaseReady && <div className="admin-toast" role="status">✓ {message}</div>}
  </main>;
}
