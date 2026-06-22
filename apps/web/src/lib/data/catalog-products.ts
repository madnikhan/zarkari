import type { Product, ProductVariant } from "./seed";

const PLACEHOLDER_PRICE = "895.00";

function catalogImages(handle: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/catalog/${handle}/${i + 1}.png`);
}

function variant(id: string, price: string, inventoryQty = 5): ProductVariant {
  return {
    id,
    title: "Standard",
    price,
    inventoryQty,
    options: [{ name: "Title", value: "Standard" }],
  };
}

type CatalogEntry = {
  handle: string;
  title: string;
  description: string;
  fabric?: string;
  collectionHandles: string[];
  imageCount: number;
  price?: string;
  inventoryQty?: number;
  comingSoon?: boolean;
};

const entries: CatalogEntry[] = [
  {
    handle: "guldaan",
    title: "Guldaan",
    description:
      "Designer formal wear with intricate navy and gold zardozi embroidery. A statement piece for weddings and special occasions.",
    fabric: "Silk blend with hand embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 3,
  },
  {
    handle: "baadroo",
    title: "Baadroo",
    description:
      "Elegant periwinkle formal with silver thread embroidery. Refined craftsmanship for evening and festive wear.",
    fabric: "Premium embroidered fabric",
    collectionHandles: ["catalogue"],
    imageCount: 3,
  },
  {
    handle: "haryana",
    title: "Haryana",
    description:
      "Vibrant magenta formal with rich gold embellishment. Bold colour and traditional motifs for celebration wear.",
    fabric: "Embroidered formal fabric",
    collectionHandles: ["catalogue"],
    imageCount: 2,
  },
  {
    handle: "baroosha",
    title: "Barosha's",
    description:
      "Regal purple formal gown with ornate gold embroidery. Designed for weddings, mehndi, and formal gatherings.",
    fabric: "Embroidered formal fabric",
    collectionHandles: ["catalogue"],
    imageCount: 2,
  },
  {
    handle: "isabella",
    title: "Isabella",
    description:
      "Deep maroon designer formal with gold pattern work. Timeless elegance for the modern woman.",
    fabric: "Embroidered formal fabric",
    collectionHandles: ["catalogue"],
    imageCount: 2,
  },
  {
    handle: "quantum",
    title: "Quantum",
    description:
      "Navy blue formal with heavy gold zardozi embroidery. Architectural motifs and luxurious finishing throughout.",
    fabric: "Silk with zardozi work",
    collectionHandles: ["catalogue"],
    imageCount: 5,
  },
  {
    handle: "warda",
    title: "Warda",
    description:
      "Mustard gold designer gown with intricate floral embroidery. Floor-length silhouette with hand-finished details.",
    fabric: "Silk/satin with embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 4,
  },
  {
    handle: "minhaaj",
    title: "Minhaaj",
    description:
      "Dark base with vibrant floral hand-embroidery. A contemporary designer piece for formal and festive occasions.",
    fabric: "Embroidered premium fabric",
    collectionHandles: ["catalogue"],
    imageCount: 3,
  },
  {
    handle: "habshah",
    title: "Habsha'H",
    description:
      "Beige and gold floor-length formal gown. Understated luxury with detailed embroidery and a graceful silhouette.",
    fabric: "Silk with gold embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 2,
  },
  {
    handle: "bahaar",
    title: "Bahaar",
    description:
      "Sage and gold sharara set with matching dupatta and potli bag. Heritage craft meets contemporary grace.",
    fabric: "Silk sharara set",
    collectionHandles: ["catalogue"],
    imageCount: 3,
  },
  {
    handle: "raaja-rani",
    title: "Raaja - rani",
    description: "Coming soon — a new designer piece from the ZARKARI collection. Register your interest via WhatsApp.",
    fabric: "Designer formal",
    collectionHandles: ["coming-soon"],
    imageCount: 2,
    inventoryQty: 0,
    comingSoon: true,
  },
  {
    handle: "cham-cham",
    title: "Cham cham",
    description:
      "Gold angrakha-style formal with rich metallic embroidery. A luminous choice for weddings and evening events.",
    fabric: "Metallic embroidered fabric",
    collectionHandles: ["catalogue"],
    imageCount: 1,
  },
  {
    handle: "mahnoorz",
    title: "Mahnoorz",
    description:
      "Fully customisable colour, fabric, and embellishment. A dramatic designer gown with an extended train — made to your specification.",
    fabric: "Customisable — enquire for options",
    collectionHandles: ["catalogue"],
    imageCount: 9,
  },
  {
    handle: "baang-e-darra",
    title: "Baang-e- darra",
    description:
      "Directed by VK designer. Deep blue formal lehenga with gold embroidery — a signature ZARKARI designer piece.",
    fabric: "Silk with hand embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 4,
  },
  {
    handle: "zam-zam",
    title: "Zam zam",
    description:
      "Directed by VK designer. Red and ivory bridal-style ensemble with heavy silver embroidery and traditional craftsmanship.",
    fabric: "Silk with silver embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 5,
  },
  {
    handle: "quartz-angraka",
    title: "Quartz angraka",
    description:
      "Directed by VK designer. Mustard yellow angrakha with colourful floral embroidery — vibrant and celebratory.",
    fabric: "Silk with hand embroidery",
    collectionHandles: ["catalogue"],
    imageCount: 2,
  },
  {
    handle: "bella-luna-gown",
    title: "Bella Luna Gown",
    description:
      "Luxury evening gown. No plastic material, no glued work — hand-finished embellishment throughout. A signature ZARKARI couture piece.",
    fabric: "Premium silk/satin",
    collectionHandles: ["catalogue"],
    imageCount: 9,
    price: "1600.00",
  },
];

export const catalogProducts: Product[] = entries.map((entry) => {
  const images = catalogImages(entry.handle, entry.imageCount);
  const price = entry.price ?? PLACEHOLDER_PRICE;
  const inventoryQty = entry.inventoryQty ?? 5;
  const tags = entry.comingSoon ? ["coming-soon"] : ["catalogue"];

  return {
    id: `prod-${entry.handle}`,
    handle: entry.handle,
    title: entry.title,
    description: entry.description,
    fabric: entry.fabric,
    tags,
    featuredImageUrl: images[0],
    images,
    collectionHandles: entry.collectionHandles,
    variants: [variant(`var-${entry.handle}`, price, inventoryQty)],
  };
});

export const catalogCollectionImages: Record<string, string> = {
  catalogue: "/catalog/mahnoorz/1.png",
  "coming-soon": "/catalog/raaja-rani/1.png",
};
