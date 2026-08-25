import { PrismaClient, ProductStatus, ProductType, StockMovement, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedProduct = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  type: ProductType;
  basePriceMinor: number;
  collectionSlugs: string[];
  artisanSlug?: string;
  attributes: Record<string, unknown>;
  stock: number;
  certificate?: { details: Record<string, unknown> };
};

const ARTISANS = [
  {
    email: "lakshmi@kalakriti.in",
    displayName: "Lakshmi Naidu",
    slug: "lakshmi-naidu",
    crafts: ["Kanjivaram weaving", "Zari work"],
    city: "Kanchipuram",
    state: "Tamil Nadu",
    yearsOfExperience: 32,
    bio: "Fourth-generation weaver whose looms have dressed brides across three states.",
  },
  {
    email: "ramesh@kalakriti.in",
    slug: "ramesh-chandra",
    displayName: "Ramesh Chandra",
    crafts: ["Dhokra casting", "Bell metal"],
    city: "Bastar",
    state: "Chhattisgarh",
    yearsOfExperience: 24,
    bio: "Master of the lost-wax dhokra tradition, casting stories in brass.",
  },
  {
    email: "meera@kalakriti.in",
    slug: "meera-ansari",
    displayName: "Meera Ansari",
    crafts: ["Banarasi weaving", "Handloom"],
    city: "Varanasi",
    state: "Uttar Pradesh",
    yearsOfExperience: 19,
    bio: "Weaves Banarasi brocades on a pit loom older than her grandmother.",
  },
];

const COLLECTIONS = [
  { slug: "antiques", title: "Antiques", description: "Certified heirlooms with documented provenance." },
  { slug: "crafts", title: "Handmade Crafts", description: "Dhokra brass, blue pottery, woodwork and more." },
  { slug: "looms-textiles", title: "Looms & Textiles", description: "Straight off the loom - throws, yardage and cushions." },
  { slug: "sarees", title: "Traditional Sarees", description: "Kanjivaram, Banarasi, Chanderi heritage weaves." },
];

const PRODUCTS: SeedProduct[] = [
  {
    slug: "antique-bronze-nandi",
    title: "Antique Bronze Nandi",
    subtitle: "South Indian temple bronze, 19th century",
    description:
      "A serene seated Nandi cast in solid bronze using the traditional lost-wax method. Deep chocolate patina developed over more than a century of devotion. Accompanied by a Certificate of Authenticity and provenance letter tracing it to a Chettinad family shrine.",
    type: ProductType.ANTIQUE,
    basePriceMinor: 28500000,
    collectionSlugs: ["antiques"],
    attributes: {
      Era: "circa 1870",
      Material: "Bronze (panchaloha)",
      Origin: "Tamil Nadu, India",
      Height: "24 cm",
      Weight: "3.8 kg",
      Condition: "Excellent age-consistent patina",
      Care: "Dry dusting only; avoid polishing",
    },
    stock: 1,
    certificate: {
      details: {
        verifiedBy: "Kalakriti Heritage Panel",
        appraisal: "Independent valuation on file",
        provenance: "Chettinad private shrine collection",
      },
    },
  },
  {
    slug: "vintage-brass-nandi-bell",
    title: "Vintage Brass Temple Bell",
    subtitle: "Hand-cast bell with Nandi finial",
    description:
      "A resonant hand-cast brass bell topped by a finely modelled Nandi. Warm honey-gold patina, crisp clapper tone. Sourced from a decommissioned family temple in coastal Andhra.",
    type: ProductType.ANTIQUE,
    basePriceMinor: 840000,
    collectionSlugs: ["antiques"],
    attributes: {
      Era: "circa 1930",
      Material: "Cast brass",
      Origin: "Andhra Pradesh, India",
      Height: "18 cm",
      Condition: "Very good; minor dings consistent with ritual use",
    },
    stock: 1,
    certificate: {
      details: { verifiedBy: "Kalakriti Heritage Panel", provenance: "Family temple, Godavari delta" },
    },
  },
  {
    slug: "dhokra-brass-elephant",
    title: "Dhokra Brass Elephant",
    subtitle: "Lost-wax cast by Bastar artisans",
    description:
      "One-of-one dhokra elephant cast entirely by hand using the 4,000-year-old lost-wax technique. The characteristic honeycomb texture is unique to each casting and cannot be repeated.",
    type: ProductType.CRAFT,
    basePriceMinor: 1250000,
    collectionSlugs: ["crafts"],
    artisanSlug: "ramesh-chandra",
    attributes: {
      Craft: "Dhokra (lost-wax casting)",
      Material: "Brass",
      Origin: "Bastar, Chhattisgarh",
      Length: "16 cm",
      Care: "Wipe with dry cloth",
    },
    stock: 3,
  },
  {
    slug: "blue-pottery-vase-jaipur",
    title: "Blue Pottery Vase",
    subtitle: "Hand-painted Jaipur blue pottery",
    description:
      "Low-temperature quartz paste vase painted by hand with cobalt florals in the classic Jaipur palette. Each piece is thrown, painted and glazed by hand in a family workshop practising this Persian-derived craft for generations.",
    type: ProductType.CRAFT,
    basePriceMinor: 385000,
    collectionSlugs: ["crafts"],
    attributes: {
      Craft: "Jaipur blue pottery",
      Material: "Quartz paste, cobalt glaze",
      Origin: "Jaipur, Rajasthan",
      Height: "22 cm",
      Care: "Hand wash gently; not dishwasher safe",
    },
    stock: 6,
  },
  {
    slug: "kanjivaram-silk-saree-ruby",
    title: "Kanjivaram Silk Saree - Ruby Temple Border",
    subtitle: "Pure mulberry silk with gold zari",
    description:
      "A regal Kanjivaram in deep ruby with an antique gold zari temple border, woven on a pit loom over 18 days. Includes unstitched blouse piece from the same weave lot. Silk Mark certified.",
    type: ProductType.TEXTILE,
    basePriceMinor: 2450000,
    collectionSlugs: ["sarees"],
    artisanSlug: "lakshmi-naidu",
    attributes: {
      Weave: "Kanjivaram (pattu)",
      Material: "Pure mulberry silk, half-fine zari",
      Origin: "Kanchipuram, Tamil Nadu",
      Length: "6.3 m + 0.8 m blouse",
      Weight: "820 g",
      BlousePiece: true,
      Care: "Dry clean only; store in muslin",
    },
    stock: 2,
  },
  {
    slug: "banarasi-katan-silk-saree",
    title: "Banarasi Katan Silk Saree - Midnight Jangla",
    subtitle: "Handloom katan with jangla brocade",
    description:
      "Midnight-blue katan silk animated by a silver-zari jangla vine across the field and a classic koniya pallu. Woven on a Varanasi pit loom; GI-tagged Banarasi craft.",
    type: ProductType.TEXTILE,
    basePriceMinor: 1980000,
    collectionSlugs: ["sarees"],
    artisanSlug: "meera-ansari",
    attributes: {
      Weave: "Banarasi katan, jangla",
      Material: "Katan silk, silver-tested zari",
      Origin: "Varanasi, Uttar Pradesh",
      Length: "6.3 m + blouse piece",
      Care: "Dry clean only",
    },
    stock: 2,
  },
  {
    slug: "chanderi-cotton-silk-saree",
    title: "Chanderi Cotton-Silk Saree - Morning Mist",
    subtitle: "Featherlight weave with coin butis",
    description:
      "A gossamer chanderi in ivory with scattered silver coin butis and a whisper-green border. The everyday heirloom - drapes like air, photographs like moonlight.",
    type: ProductType.TEXTILE,
    basePriceMinor: 720000,
    collectionSlugs: ["sarees"],
    attributes: {
      Weave: "Chanderi (cotton-silk)",
      Material: "Chanderi cotton-silk blend",
      Origin: "Chanderi, Madhya Pradesh",
      Length: "5.5 m + blouse piece",
      Care: "Gentle dry clean",
    },
    stock: 4,
  },
  {
    slug: "handloom-cotton-throw-indigo",
    title: "Handloom Cotton Throw - Indigo Ikat",
    subtitle: "Double-bed throw, single-ikat",
    description:
      "Crisp handwoven cotton throw in natural-and-indigo single ikat, finished with hand-knotted tassels. Dyed in small batches with natural indigo by a Telangana weaving cluster.",
    type: ProductType.TEXTILE,
    basePriceMinor: 265000,
    collectionSlugs: ["looms-textiles"],
    attributes: {
      Weave: "Single ikat",
      Material: "100% handloom cotton",
      Origin: "Pochampally, Telangana",
      Size: "228 x 254 cm",
      Care: "Cold separate wash, line dry in shade",
    },
    stock: 8,
  },
];

async function main(): Promise<void> {
  console.log("Seeding Kalakriti...");

  const adminHash = await bcrypt.hash("Admin@Kalakriti1", 10);
  await prisma.user.upsert({
    where: { email: "admin@kalakriti.in" },
    update: {},
    create: {
      email: "admin@kalakriti.in",
      passwordHash: adminHash,
      name: "Kalakriti Admin",
      role: UserRole.ADMIN,
    },
  });

  for (const c of COLLECTIONS) {
    await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { title: c.title, description: c.description },
      create: c,
    });
  }

  const artisanIds = new Map<string, string>();
  for (const a of ARTISANS) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash: adminHash,
        name: a.displayName,
        role: UserRole.ARTISAN,
        artisanProfile: {
          create: {
            displayName: a.displayName,
            slug: a.slug,
            bio: a.bio,
            crafts: a.crafts,
            city: a.city,
            state: a.state,
            yearsOfExperience: a.yearsOfExperience,
            verified: true,
          },
        },
      },
      include: { artisanProfile: true },
    });
    if (user.artisanProfile) artisanIds.set(a.slug, user.artisanProfile.id);
  }

  let seq = 1000;
  for (const p of PRODUCTS) {
    seq += 7;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        basePriceMinor: p.basePriceMinor,
        attributes: p.attributes as never,
        status: ProductStatus.ACTIVE,
        artisanProfileId: p.artisanSlug ? (artisanIds.get(p.artisanSlug) ?? null) : null,
      },
      create: {
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        description: p.description,
        type: p.type,
        status: ProductStatus.ACTIVE,
        basePriceMinor: p.basePriceMinor,
        attributes: p.attributes as never,
        artisanProfileId: p.artisanSlug ? (artisanIds.get(p.artisanSlug) ?? null) : null,
        collections: { connect: p.collectionSlugs.map((s) => ({ slug: s })) },
        variants: {
          create: {
            sku: `KLK-${seq}`,
          },
        },
        ...(p.certificate
          ? {
              certificates: {
                create: {
                  certificateNo: `COA-${p.slug.toUpperCase().replace(/-/g, "")}`,
                  details: p.certificate.details as never,
                },
              },
            }
          : {}),
      },
      include: { variants: true },
    });

    const variant = product.variants[0];
    if (!variant) continue;

    const existingStock = await prisma.inventoryItem.findUnique({
      where: { variantId: variant.id },
    });
    if (!existingStock) {
      const item = await prisma.inventoryItem.create({
        data: {
          variantId: variant.id,
          stock: p.stock,
          lowStockThreshold: Math.min(2, p.stock),
        },
      });
      await prisma.stockLedgerEntry.create({
        data: {
          itemId: item.id,
          delta: p.stock,
          reason: StockMovement.RESTOCK,
          reference: "seed-import",
        },
      });
    }
  }

  const seededReviews = [
    {
      productSlug: "kanjivaram-silk-saree-ruby",
      reviewerEmail: "meera@kalakriti.in",
      rating: 5,
      title: "Heirloom-grade drape",
      body: "Wove a pallu beside Lakshmi at a cluster showcase - the zari catches lamplight like nothing machine-made can.",
    },
    {
      productSlug: "dhokra-brass-elephant",
      reviewerEmail: "lakshmi@kalakriti.in",
      rating: 5,
      title: "Living craft",
      body: "Every honeycomb cell is distinct. Guests ask about it before they ask about anything else in the room.",
    },
  ];
  for (const r of seededReviews) {
    const reviewer = await prisma.user.findUnique({ where: { email: r.reviewerEmail } });
    const product = await prisma.product.findUnique({ where: { slug: r.productSlug } });
    if (!reviewer || !product) continue;
    await prisma.review.upsert({
      where: { userId_productId: { userId: reviewer.id, productId: product.id } },
      update: {},
      create: {
        userId: reviewer.id,
        productId: product.id,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: "APPROVED" as never,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    collections: await prisma.collection.count(),
    inventory: await prisma.inventoryItem.count(),
    reviews: await prisma.review.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
