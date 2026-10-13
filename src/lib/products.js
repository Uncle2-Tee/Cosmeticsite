export function productToDatabaseRow(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    size: product.size,
    image: product.image,
    description: product.description,
    cardDescription: product.cardDescription || product.description,
    howToUse: product.howToUse || null,
    caution: product.caution || null,
    badge: product.badge || null,
    originalPrice: product.originalPrice ?? null,
    discountPercent: product.discountPercent ?? null,
    discountLabel: product.discountLabel ?? null,
    rating: product.rating ?? null,
    sortOrder: product.sortOrder ?? 0,
  };
}

export function productFromDatabaseRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    size: row.size,
    image: row.image,
    description: row.description,
    cardDescription: row.cardDescription,
    howToUse: row.howToUse,
    caution: row.caution,
    badge: row.badge,
    sortOrder: row.sortOrder,
    ...(row.originalPrice == null ? {} : { originalPrice: Number(row.originalPrice) }),
    ...(row.discountPercent == null ? {} : { discountPercent: Number(row.discountPercent) }),
    ...(row.discountLabel == null ? {} : { discountLabel: row.discountLabel }),
    ...(row.rating == null ? {} : { rating: Number(row.rating) }),
  };
}

export function validProduct(product) {
  return Boolean(
    product
    && typeof product.id === "string"
    && product.id.trim()
    && typeof product.name === "string"
    && product.name.trim()
    && typeof product.category === "string"
    && product.category.trim()
    && Number.isFinite(Number(product.price))
    && Number(product.price) > 0
    && typeof product.size === "string"
    && typeof product.image === "string"
    && typeof product.description === "string",
  );
}
