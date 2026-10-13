import { PrismaClient } from "@prisma/client";
import {
  defaultProductCaution,
  defaultProductUsage,
  initialProducts,
} from "../src/lib/catalog.js";
import { productToDatabaseRow } from "../src/lib/products.js";

const prisma = new PrismaClient();

try {
  const result = await prisma.product.createMany({
    data: initialProducts.map((product, sortOrder) => productToDatabaseRow({
      ...product,
      cardDescription: product.description,
      howToUse: defaultProductUsage,
      caution: defaultProductCaution,
      sortOrder,
    })),
    skipDuplicates: true,
  });
  console.log(`Added ${result.count} starter products; existing products were left unchanged.`);
} finally {
  await prisma.$disconnect();
}
