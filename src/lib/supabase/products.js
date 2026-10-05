export function productToDatabaseRow(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    size: product.size,
    image: product.image,
    description: product.description,
    card_description: product.cardDescription || product.description,
    how_to_use: product.howToUse || null,
    caution: product.caution || null,
    badge: product.badge || null,
    original_price: product.originalPrice ?? null,
    discount_percent: product.discountPercent ?? null,
    discount_label: product.discountLabel ?? null,
    rating: product.rating ?? null,
    sort_order: product.sortOrder ?? 0,
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
    cardDescription: row.card_description,
    howToUse: row.how_to_use,
    caution: row.caution,
    badge: row.badge,
    sortOrder: row.sort_order,
    ...(row.original_price == null ? {} : { originalPrice: Number(row.original_price) }),
    ...(row.discount_percent == null ? {} : { discountPercent: Number(row.discount_percent) }),
    ...(row.discount_label == null ? {} : { discountLabel: row.discount_label }),
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
