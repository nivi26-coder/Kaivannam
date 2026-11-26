// Demo data: 6 Tamil Nadu creators, their gifts, and orders in every status.
//
// Used in two places, so both always show the same thing:
// - the in-memory mock repositories (src/server/repositories/mock) when no
//   database is set up;
// - scripts/seed.ts, which writes it into a database.
//
// IDs are fixed (not random) so links like /artists/0a00…01 work in every
// mode and survive restarts. Dates are relative to "now" so deadlines always
// look current. Money is integer paise (see src/domain/money.ts).
//
// Keep this file free of database and Next.js imports: the seed script runs
// it with plain Node.

import { DEFAULT_TRANSIT_DAYS } from "@/domain/delivery";
import { rupees } from "@/domain/money";
import type { OccasionSlug } from "@/domain/occasions";
import type { OrderStatus } from "@/domain/order-status";
import { quoteItem } from "@/domain/pricing";
import { validateOptionGroups, validateSelections, type OptionChoice, type OptionGroup, type Selections } from "@/domain/product-options";
import { slugify } from "@/domain/product-rules";
import type { Creator, Order, PreviewResponse, Product } from "@/domain/types";
import { addDays, toYmdIST, ymdToDate } from "@/lib/dates";
import { unsplash } from "@/lib/images";

// ------------------------------------------------------- option builders

const choice = (value: string, label: string, priceRupees = 0, extraDays = 0): OptionChoice => ({
  value,
  label,
  pricePaise: rupees(priceRupees),
  extraDays,
});
const single = (key: string, label: string, options: OptionChoice[]): OptionGroup => ({
  key,
  label,
  type: "single",
  required: true,
  options,
});
const multi = (key: string, label: string, options: OptionChoice[], max = options.length): OptionGroup => ({
  key,
  label,
  type: "multi",
  min: 0,
  max,
  options,
});
const text = (key: string, label: string, maxLength: number, required = true): OptionGroup => ({
  key,
  label,
  type: "text",
  required,
  maxLength,
});
const photo = (key: string, label: string): OptionGroup => ({ key, label, type: "photo", required: true });

// ------------------------------------------------------------ creators

type CreatorKey = "kavya" | "arjun" | "meenakshi" | "divya" | "nithya" | "karthik";

interface CreatorSeed {
  key: CreatorKey;
  handle: string;
  name: string;
  city: string;
  categories: string[];
  isVerified: boolean;
  isAcceptingOrders: boolean;
  avatarUrl: string;
  bio: string;
}

const CREATORS: CreatorSeed[] = [
  {
    key: "kavya",
    handle: "kavya.resin",
    name: "Kavya Raman",
    city: "Coimbatore",
    categories: ["Resin art", "Flower preservation"],
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1779988197599-490eaba85095"),
    bio: "I started pouring resin in 2021 to save the flowers from my sister's wedding. Now I preserve memories for families across Tamil Nadu — garlands, bouquets, even a baby's first lock of hair. Every piece is cured for 72 hours and polished by hand in my home studio in Saibaba Colony.",
  },
  {
    key: "arjun",
    handle: "arjun.sketches",
    name: "Arjun Selvam",
    city: "Madurai",
    categories: ["Pencil portraits", "Charcoal portraits"],
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1786477949219-dc7511dacd8a"),
    bio: "Fine arts graduate from Government College of Fine Arts, Chennai. I draw realistic portraits from your photos — grandparents, couples, pets — on acid-free paper that won't yellow. Over 400 portraits delivered through Instagram since 2019.",
  },
  {
    key: "meenakshi",
    handle: "meenakshi.stitches",
    name: "Meenakshi Sundaram",
    city: "Chennai",
    categories: ["Embroidery hoops"],
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1771479452306-6dad4a9fbec0"),
    bio: "Hand embroidery is slow on purpose. Each hoop takes 12 to 20 hours of stitching with cotton and silk threads. I love making name hoops for newborns and keepsakes recreated from wedding bouquets.",
  },
  {
    key: "divya",
    handle: "divya.letters",
    name: "Divya Krishnan",
    city: "Tiruchirappalli",
    categories: ["Hand-lettering", "Tamil calligraphy"],
    isVerified: false,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1619010431046-dde29509016e"),
    bio: "Brush lettering in English and Tamil. Thirukkural couplets, wedding vows, letters to someone far away — written slowly, by hand, on paper you'll want to keep.",
  },
  {
    key: "nithya",
    handle: "nithya.hampers",
    name: "Nithya Prabhu",
    city: "Chennai",
    categories: ["Personalised hampers"],
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1632924192284-9163f3d88a16"),
    bio: "Thoughtful hampers packed in cane baskets and wooden crates, with a handwritten card in every box. I source sweets from family-run shops in Mylapore and T. Nagar.",
  },
  {
    key: "karthik",
    handle: "karthik.art",
    name: "Karthik Murugan",
    city: "Salem",
    categories: ["Couple sketches", "Colour pencil portraits"],
    isVerified: false,
    // Shows the "paused" state in the demo.
    isAcceptingOrders: false,
    avatarUrl: unsplash("1758521232750-909a8b065963"),
    bio: "Couple and family sketches in pencil and colour pencil. Taking a short break for Diwali orders — back soon!",
  },
];

// ------------------------------------------------------------ products

interface ProductSeed {
  key: string;
  creator: CreatorKey;
  title: string;
  description: string;
  basePriceRupees: number;
  baseProductionDays: number;
  images: string[];
  occasionTags: OccasionSlug[];
  maxRevisions: number;
  mockupFeeRupees: number | null;
  advancePercent: number;
  weightGrams: number;
  packageCm: { length: number; width: number; height: number };
  optionGroups: OptionGroup[];
}

const sizeA4A3 = (a3Price: number, a3Days = 1) => single("size", "Size", [choice("a4", "A4"), choice("a3", "A3", a3Price, a3Days)]);

const MONTH_FLOWERS = [
  "January – Carnation",
  "February – Violet",
  "March – Daffodil",
  "April – Daisy",
  "May – Lily of the valley",
  "June – Rose",
  "July – Lotus",
  "August – Poppy",
  "September – Aster",
  "October – Marigold",
  "November – Chrysanthemum",
  "December – Narcissus",
];

const PRODUCTS: ProductSeed[] = [
  // Kavya — resin
  {
    key: "keychain",
    creator: "kavya",
    title: "Name Keychain with Real Flowers",
    description:
      "A clear resin keychain with your name in gold-foil letters and real dried flowers set inside. Light, waterproof and made to last — a favourite for Rakhi and return gifts.",
    basePriceRupees: 349,
    baseProductionDays: 5,
    images: [unsplash("1725826474457-d4dc3d6d8abf"), unsplash("1687363714985-990685339050")],
    occasionTags: ["birthday", "rakhi", "valentines"],
    maxRevisions: 2,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 60,
    packageCm: { length: 12, width: 8, height: 4 },
    optionGroups: [
      text("name", "Name on keychain", 20),
      single("flower", "Flowers inside", [
        choice("rose", "Pink rose buds"),
        choice("daisy", "Yellow daisies"),
        choice("forget-me-not", "Blue forget-me-nots", 30),
      ]),
      single("goldFlakes", "Gold flakes", [choice("no", "No"), choice("yes", "Yes, add gold flakes", 40)]),
    ],
  },
  {
    key: "pendant",
    creator: "kavya",
    title: "Preserved Flower Pendant",
    description:
      "Flowers from a special day — a wedding garland, a first bouquet — preserved in a resin pendant you can wear every day. Use my dried flowers, or courier me your own and I'll dry them carefully.",
    basePriceRupees: 649,
    baseProductionDays: 5,
    images: [unsplash("1779988197599-490eaba85095"), unsplash("1783509097964-3a1123132492")],
    occasionTags: ["wedding", "anniversary", "valentines"],
    maxRevisions: 2,
    mockupFeeRupees: 99,
    advancePercent: 50,
    weightGrams: 50,
    packageCm: { length: 10, width: 8, height: 4 },
    optionGroups: [
      single("flowerSource", "Flowers", [
        choice("artist", "Kavya's dried flowers"),
        choice("mine", "My own flowers (I'll courier them)", 150, 3),
      ]),
      single("shape", "Shape", [choice("round", "Round"), choice("heart", "Heart", 50), choice("teardrop", "Teardrop", 50)]),
      single("chain", "Chain", [
        choice("none", "No chain"),
        choice("silver", "Silver-tone chain", 120),
        choice("gold", "Gold-tone chain", 150),
      ]),
      text("initials", "Initials on the back", 6, false),
    ],
  },
  {
    key: "coasters",
    creator: "kavya",
    title: "Resin Geode Coaster Set",
    description:
      "Geode-style resin coasters with hand-applied gold edges. No two sets are the same. Add names or a date in gold for a housewarming or wedding gift.",
    basePriceRupees: 1299,
    baseProductionDays: 5,
    images: [unsplash("1676378411543-b38dd1ae1d24"), unsplash("1664981751739-7abc3a434078")],
    occasionTags: ["wedding", "diwali", "anniversary"],
    maxRevisions: 1,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 900,
    packageCm: { length: 20, width: 20, height: 8 },
    optionGroups: [
      single("colour", "Colours", [
        choice("pink-gold", "Pink & gold"),
        choice("ocean", "Ocean blue"),
        choice("emerald", "Emerald green"),
        choice("black-gold", "Black & gold", 100),
      ]),
      single("setSize", "Set size", [choice("2", "Set of 2"), choice("4", "Set of 4", 1100, 2)]),
      text("names", "Names or date in gold", 40, false),
    ],
  },

  // Arjun — pencil & charcoal portraits
  {
    key: "pencil",
    creator: "arjun",
    title: "Pencil Portrait from Your Photo",
    description:
      "A detailed graphite portrait hand-drawn from your favourite photo, on 300gsm acid-free paper. Clear, well-lit photos where faces are easy to see work best.",
    basePriceRupees: 1199,
    baseProductionDays: 7,
    images: [unsplash("1780037756323-f14d43763351"), unsplash("1593472807861-5bb884af28f6")],
    occasionTags: ["birthday", "anniversary", "wedding"],
    maxRevisions: 2,
    mockupFeeRupees: 149,
    advancePercent: 50,
    weightGrams: 700,
    packageCm: { length: 45, width: 35, height: 5 },
    optionGroups: [
      photo("photo", "Reference photo"),
      single("people", "People in the portrait", [
        choice("1", "1 person"),
        choice("2", "2 people", 600, 1),
        choice("3", "3 people", 1100, 2),
        choice("family", "Family (4–6)", 1900, 4),
      ]),
      sizeA4A3(700),
      single("frame", "Frame", [
        choice("none", "No frame"),
        choice("black", "Black frame", 450),
        choice("teak", "Teak wood frame", 650, 1),
      ]),
    ],
  },
  {
    key: "charcoal",
    creator: "arjun",
    title: "Charcoal Portrait",
    description:
      "Bold, dramatic charcoal on textured paper. Beautiful for portraits of parents and grandparents. Sealed with fixative so it won't smudge.",
    basePriceRupees: 1599,
    baseProductionDays: 7,
    images: [unsplash("1748200099986-5ed2ca9ae4a6"), unsplash("1786477949219-dc7511dacd8a")],
    occasionTags: ["birthday", "anniversary"],
    maxRevisions: 2,
    mockupFeeRupees: 149,
    advancePercent: 40,
    weightGrams: 600,
    packageCm: { length: 45, width: 35, height: 5 },
    optionGroups: [
      photo("photo", "Reference photo"),
      sizeA4A3(800),
      single("background", "Background", [choice("plain", "Plain"), choice("sketched", "Sketched background", 300, 1)]),
      text("message", "Dedication to write below the portrait", 120, false),
    ],
  },

  // Meenakshi — embroidery
  {
    key: "nameHoop",
    creator: "meenakshi",
    title: "Custom Floral Name Hoop",
    description:
      "Hand-embroidered flowers around a name and date, finished in a wooden hoop ready to hang. Lovely for weddings, anniversaries and nursery walls.",
    basePriceRupees: 1450,
    baseProductionDays: 10,
    images: [unsplash("1771555739335-95ea325f29d2"), unsplash("1766418393788-dc829192ab5f")],
    occasionTags: ["wedding", "anniversary", "baby"],
    maxRevisions: 2,
    mockupFeeRupees: 199,
    advancePercent: 50,
    weightGrams: 400,
    packageCm: { length: 30, width: 30, height: 6 },
    optionGroups: [
      text("names", "Name(s) to stitch", 40),
      text("date", "Date to stitch (e.g. 14.02.2026)", 20, false),
      single("size", "Hoop size", [choice("6", "6 inch"), choice("8", "8 inch", 350, 2), choice("10", "10 inch", 700, 3)]),
      single("palette", "Thread colours", [
        choice("pastel", "Pastel"),
        choice("bright", "Bright"),
        choice("ivory-gold", "Ivory & gold", 150),
      ]),
    ],
  },
  {
    key: "birthHoop",
    creator: "meenakshi",
    title: "Birth Flower Hoop for Baby",
    description:
      "Your baby's name stitched with their birth-month flower. Add birth details for a keepsake grandparents will treasure.",
    basePriceRupees: 1250,
    baseProductionDays: 10,
    images: [unsplash("1771479452306-6dad4a9fbec0"), unsplash("1771409046893-3121a32d977e")],
    occasionTags: ["baby", "birthday"],
    maxRevisions: 2,
    mockupFeeRupees: 199,
    advancePercent: 50,
    weightGrams: 350,
    packageCm: { length: 25, width: 25, height: 6 },
    optionGroups: [
      text("babyName", "Baby's name", 30),
      single(
        "month",
        "Birth month flower",
        MONTH_FLOWERS.map((label, i) => choice(String(i + 1), label)),
      ),
      single("size", "Hoop size", [choice("6", "6 inch"), choice("8", "8 inch", 350, 2)]),
      text("birthDetails", "Birth date, time & weight", 80, false),
    ],
  },
  {
    key: "bouquetHoop",
    creator: "meenakshi",
    title: "Wedding Bouquet Keepsake Hoop",
    description:
      "Your wedding bouquet recreated in thread, stitch by stitch, with your names below. A keepsake that lasts long after the flowers fade.",
    basePriceRupees: 2200,
    baseProductionDays: 12,
    images: [unsplash("1766418393788-dc829192ab5f"), unsplash("1771409046893-3121a32d977e")],
    occasionTags: ["wedding", "anniversary"],
    maxRevisions: 3,
    mockupFeeRupees: 199,
    advancePercent: 60,
    weightGrams: 450,
    packageCm: { length: 30, width: 30, height: 6 },
    optionGroups: [
      photo("photo", "Photo of the bouquet"),
      text("names", "Couple's names", 40),
      single("size", "Hoop size", [choice("8", "8 inch"), choice("10", "10 inch", 450, 3)]),
    ],
  },

  // Divya — lettering
  {
    key: "quote",
    creator: "divya",
    title: "Hand-lettered Quote Frame",
    description:
      "Your favourite quote, a Thirukkural couplet or a family motto, brush-lettered in English or Tamil on thick watercolour paper.",
    basePriceRupees: 699,
    baseProductionDays: 4,
    images: [unsplash("1517487550761-9af05b660bde"), unsplash("1561812938-f6e60cbf95e3")],
    occasionTags: ["birthday", "pongal", "diwali"],
    maxRevisions: 2,
    mockupFeeRupees: 99,
    advancePercent: 50,
    weightGrams: 500,
    packageCm: { length: 35, width: 28, height: 4 },
    optionGroups: [
      text("quote", "Quote", 200),
      single("language", "Language", [choice("en", "English"), choice("ta", "Tamil", 100), choice("both", "Tamil & English", 200, 1)]),
      single("size", "Size", [choice("a5", "A5"), choice("a4", "A4", 250)]),
      single("frame", "Frame", [choice("none", "No frame"), choice("white", "White frame", 200), choice("wood", "Wooden frame", 250)]),
    ],
  },
  {
    key: "letter",
    creator: "divya",
    title: "Personalised Calligraphy Letter",
    description:
      "Say it the old-fashioned way. Your words, written in flowing calligraphy and sealed in an envelope — for anniversaries, proposals or someone far from home.",
    basePriceRupees: 899,
    baseProductionDays: 4,
    images: [unsplash("1769522993580-3b797e0d8f8b"), unsplash("1561812938-f6e60cbf95e3")],
    occasionTags: ["valentines", "anniversary", "wedding"],
    maxRevisions: 1,
    mockupFeeRupees: 99,
    advancePercent: 50,
    weightGrams: 150,
    packageCm: { length: 25, width: 18, height: 2 },
    optionGroups: [
      text("recipient", "Who is it for?", 40),
      text("message", "Your message", 200),
      single("paper", "Paper", [choice("ivory", "Ivory card"), choice("cotton", "Handmade cotton paper", 150)]),
      single("seal", "Finish", [choice("plain", "Plain envelope"), choice("wax", "Wax seal & envelope", 120)]),
    ],
  },
  {
    key: "card",
    creator: "divya",
    title: "Custom Birthday Card",
    description: "A bright, hand-lettered birthday card with their name front and centre.",
    basePriceRupees: 249,
    baseProductionDays: 3,
    images: [unsplash("1619010431046-dde29509016e")],
    occasionTags: ["birthday"],
    maxRevisions: 1,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 80,
    packageCm: { length: 20, width: 15, height: 2 },
    optionGroups: [
      text("name", "Name", 30),
      text("age", "Age to feature", 3, false),
      single("colours", "Colours", [choice("pink-gold", "Pink & gold"), choice("blue-silver", "Blue & silver"), choice("rainbow", "Rainbow")]),
    ],
  },

  // Nithya — hampers
  {
    key: "rakhiHamper",
    creator: "nithya",
    title: "Rakhi Hamper for Your Sibling",
    description:
      "A rakhi, chocolates and a handwritten card, packed in a reusable cane basket. Delivered across Tamil Nadu.",
    basePriceRupees: 1199,
    baseProductionDays: 3,
    images: [unsplash("1781263538938-561a5e1acc51"), unsplash("1608755727748-dfa2e44f255b")],
    occasionTags: ["rakhi"],
    maxRevisions: 1,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 1200,
    packageCm: { length: 30, width: 25, height: 15 },
    optionGroups: [
      text("siblingName", "Sibling's name for the card", 30),
      single("rakhi", "Rakhi", [choice("thread", "Thread rakhi"), choice("silver", "Silver-plated rakhi", 350)]),
      single("chocolates", "Chocolates", [choice("milk", "Milk chocolate mix"), choice("dark", "Premium dark chocolate", 250)]),
      text("note", "Message for the card", 200, false),
    ],
  },
  {
    key: "crate",
    creator: "nithya",
    title: "Celebration Gift Crate",
    description:
      "A wooden crate of treats, fresh flowers and a keepsake, themed for your occasion. The crate makes a nice planter afterwards.",
    basePriceRupees: 2499,
    baseProductionDays: 3,
    images: [unsplash("1773450970959-cef81e9b1053"), unsplash("1508899203029-1c9eb493c9bd")],
    occasionTags: ["birthday", "anniversary", "diwali"],
    maxRevisions: 1,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 2500,
    packageCm: { length: 40, width: 30, height: 20 },
    optionGroups: [
      text("recipient", "Recipient's name", 40),
      single("theme", "Theme", [
        choice("birthday", "Birthday"),
        choice("anniversary", "Anniversary"),
        choice("thanks", "Thank you"),
        choice("diwali", "Diwali"),
      ]),
      multi("addOns", "Add-ons", [
        choice("candle", "Scented candle", 299),
        choice("plant", "Mini money plant", 349, 1),
        choice("frame", "Photo frame", 399),
      ]),
      text("note", "Message for the card", 200, false),
    ],
  },
  {
    key: "sweetBox",
    creator: "nithya",
    title: "Festive Sweet & Treat Box",
    description:
      "Handpicked sweets and savouries from family-run shops, in a gift box with a personalised name tag. Sugar-free option available.",
    basePriceRupees: 899,
    baseProductionDays: 2,
    images: [unsplash("1773450269672-8075682144a6"), unsplash("1632924192284-9163f3d88a16")],
    occasionTags: ["diwali", "pongal"],
    maxRevisions: 1,
    mockupFeeRupees: null,
    advancePercent: 50,
    weightGrams: 800,
    packageCm: { length: 25, width: 20, height: 10 },
    optionGroups: [
      single("boxSize", "Box size", [choice("6", "6 pieces"), choice("12", "12 pieces", 600)]),
      single("sugar", "Sweets", [choice("regular", "Regular"), choice("sugar-free", "Sugar-free", 150, 1)]),
      text("nameTag", "Name on the gift tag", 30, false),
    ],
  },

  // Karthik — paused
  {
    key: "coupleSketch",
    creator: "karthik",
    title: "Couple Sketch from Photo",
    description: "A pencil sketch of the two of you, drawn from your favourite photo together.",
    basePriceRupees: 1599,
    baseProductionDays: 6,
    images: [unsplash("1789983140185-e36654e0656b"), unsplash("1786477949219-dc7511dacd8a")],
    occasionTags: ["anniversary", "valentines", "wedding"],
    maxRevisions: 2,
    mockupFeeRupees: 149,
    advancePercent: 50,
    weightGrams: 650,
    packageCm: { length: 45, width: 35, height: 5 },
    optionGroups: [photo("photo", "Reference photo"), text("names", "Names to write", 40, false), sizeA4A3(700)],
  },
  {
    key: "colourPortrait",
    creator: "karthik",
    title: "Colour Pencil Portrait",
    description: "A vivid colour pencil portrait on toned paper, built up in many fine layers.",
    basePriceRupees: 1899,
    baseProductionDays: 8,
    images: [unsplash("1758521232750-909a8b065963"), unsplash("1593472807861-5bb884af28f6")],
    occasionTags: ["birthday"],
    maxRevisions: 2,
    mockupFeeRupees: 149,
    advancePercent: 50,
    weightGrams: 650,
    packageCm: { length: 45, width: 35, height: 5 },
    optionGroups: [photo("photo", "Reference photo"), sizeA4A3(900, 2)],
  },
];

// -------------------------------------------------------------- orders

interface OrderSeed {
  product: string;
  buyerName: string;
  phone: string;
  selections: Selections;
  status: OrderStatus;
  /** Ready-to-ship deadline relative to today (negative = in the past). */
  dispatchInDays: number;
  placedDaysAgo: number;
  previews?: { response: PreviewResponse; comment?: string; daysAgo: number }[];
}

const ORDERS: OrderSeed[] = [
  // Kavya: one order in each active status, so her dashboard shows everything.
  {
    product: "keychain",
    buyerName: "Harini Sivakumar",
    phone: "9000000101",
    selections: { name: "Harini", flower: "rose", goldFlakes: "yes" },
    status: "PLACED",
    dispatchInDays: 9,
    placedDaysAgo: 0,
  },
  {
    product: "keychain",
    buyerName: "Vignesh Kumar",
    phone: "9000000102",
    selections: { name: "Anbu", flower: "forget-me-not", goldFlakes: "no" },
    status: "PAID",
    dispatchInDays: 5,
    placedDaysAgo: 1,
  },
  {
    product: "pendant",
    buyerName: "Swetha Ramesh",
    phone: "9000000103",
    selections: { flowerSource: "mine", shape: "heart", chain: "gold", initials: "S & R" },
    status: "PREVIEW_SENT",
    dispatchInDays: 6,
    placedDaysAgo: 3,
    previews: [{ response: "pending", daysAgo: 0 }],
  },
  {
    product: "coasters",
    buyerName: "Prakash Iyer",
    phone: "9000000104",
    selections: { colour: "black-gold", setSize: "4", names: "Prakash & Divya" },
    status: "REVISION_REQUESTED",
    dispatchInDays: 3,
    placedDaysAgo: 4,
    previews: [
      {
        response: "changes_requested",
        comment: "Can the gold edge be a bit thicker? And please add our wedding date, 12.06.2026.",
        daysAgo: 1,
      },
    ],
  },
  {
    product: "keychain",
    buyerName: "Janani Venkatesh",
    phone: "9000000105",
    selections: { name: "Thambi", flower: "daisy", goldFlakes: "yes" },
    status: "IN_PRODUCTION",
    dispatchInDays: -1,
    placedDaysAgo: 6,
    previews: [{ response: "approved", daysAgo: 4 }],
  },
  {
    product: "coasters",
    buyerName: "Sathish Babu",
    phone: "9000000106",
    selections: { colour: "ocean", setSize: "2" },
    status: "SHIPPED",
    dispatchInDays: -2,
    placedDaysAgo: 8,
    previews: [{ response: "approved", daysAgo: 6 }],
  },
  {
    product: "pendant",
    buyerName: "Aishwarya Mohan",
    phone: "9000000107",
    selections: { flowerSource: "artist", shape: "round", chain: "silver" },
    status: "DELIVERED",
    dispatchInDays: -8,
    placedDaysAgo: 16,
    previews: [{ response: "approved", daysAgo: 13 }],
  },

  // Arjun
  {
    product: "pencil",
    buyerName: "Lakshmi Narayanan",
    phone: "9000000108",
    selections: { photo: "amma-appa-50th.jpg", people: "2", size: "a3", frame: "teak" },
    status: "PREVIEW_SENT",
    dispatchInDays: 7,
    placedDaysAgo: 5,
    previews: [
      { response: "changes_requested", comment: "Appa's moustache is thicker in real life, please.", daysAgo: 2 },
      { response: "pending", daysAgo: 0 },
    ],
  },
  {
    product: "charcoal",
    buyerName: "Karthika Rajan",
    phone: "9000000109",
    selections: { photo: "paati.jpg", size: "a4", background: "plain", message: "For Paati, with love" },
    status: "APPROVED",
    dispatchInDays: 4,
    placedDaysAgo: 4,
    previews: [{ response: "approved", daysAgo: 1 }],
  },
  {
    product: "pencil",
    buyerName: "Dinesh Kannan",
    phone: "9000000110",
    selections: { photo: "wedding.jpg", people: "2", size: "a4", frame: "black" },
    status: "DELIVERED",
    dispatchInDays: -15,
    placedDaysAgo: 25,
    previews: [{ response: "approved", daysAgo: 20 }],
  },
  {
    product: "pencil",
    buyerName: "Revathi Subramanian",
    phone: "9000000111",
    selections: { photo: "family-pongal.jpg", people: "family", size: "a3", frame: "teak" },
    status: "DELIVERED",
    dispatchInDays: -33,
    placedDaysAgo: 45,
    previews: [{ response: "approved", daysAgo: 40 }],
  },

  // Meenakshi
  {
    product: "birthHoop",
    buyerName: "Gayathri Ashok",
    phone: "9000000112",
    selections: { babyName: "Ilakiya", month: "7", size: "8", birthDetails: "3 July 2026 · 6:42 am · 3.1 kg" },
    status: "PAID",
    dispatchInDays: 11,
    placedDaysAgo: 1,
  },
  {
    product: "nameHoop",
    buyerName: "Ramya Balaji",
    phone: "9000000113",
    selections: { names: "Ramya & Balaji", date: "21.08.2026", size: "10", palette: "ivory-gold" },
    status: "DELIVERED",
    dispatchInDays: -11,
    placedDaysAgo: 24,
    previews: [{ response: "approved", daysAgo: 19 }],
  },

  // Divya
  {
    product: "quote",
    buyerName: "Bharath Raj",
    phone: "9000000114",
    selections: { quote: "அன்பின் வழியது உயிர்நிலை", language: "ta", size: "a4", frame: "wood" },
    status: "DELIVERED",
    dispatchInDays: -6,
    placedDaysAgo: 10,
    previews: [{ response: "approved", daysAgo: 8 }],
  },
  {
    product: "letter",
    buyerName: "Nandhini Prasad",
    phone: "9000000115",
    selections: { recipient: "Arun", message: "Five years, two cities, one us. Happy anniversary!", paper: "cotton", seal: "wax" },
    status: "PLACED",
    dispatchInDays: 6,
    placedDaysAgo: 0,
  },

  // Nithya
  {
    product: "crate",
    buyerName: "Suresh Natarajan",
    phone: "9000000116",
    selections: { recipient: "Kala Akka", theme: "thanks", addOns: ["plant", "candle"], note: "Thank you for everything!" },
    status: "IN_PRODUCTION",
    dispatchInDays: 0,
    placedDaysAgo: 4,
    previews: [{ response: "approved", daysAgo: 2 }],
  },
  {
    product: "sweetBox",
    buyerName: "Priya Chandrasekar",
    phone: "9000000117",
    selections: { boxSize: "12", sugar: "sugar-free", nameTag: "Seetha Patti" },
    status: "DELIVERED",
    dispatchInDays: -5,
    placedDaysAgo: 7,
    previews: [{ response: "approved", daysAgo: 5 }],
  },
  {
    product: "rakhiHamper",
    buyerName: "Meera Suresh",
    phone: "9000000118",
    selections: { siblingName: "Karthi", rakhi: "silver", chocolates: "dark" },
    status: "DELIVERED",
    dispatchInDays: -63,
    placedDaysAgo: 66,
    previews: [{ response: "approved", daysAgo: 64 }],
  },

  // Karthik
  {
    product: "coupleSketch",
    buyerName: "Hari Prasath",
    phone: "9000000119",
    selections: { photo: "us-at-marina.jpg", names: "Hari & Keerthana", size: "a3" },
    status: "DELIVERED",
    dispatchInDays: -18,
    placedDaysAgo: 28,
    previews: [{ response: "approved", daysAgo: 22 }],
  },
];

// ---------------------------------------------------------------- build

const DAY_MS = 86_400_000;

/**
 * A fixed, valid 24-hex-character id, e.g. demoId("0a", 1) ->
 * "0a0000000000000000000001". The prefix tells the kinds apart.
 */
function demoId(prefix: "0a" | "0b" | "0c", n: number): string {
  return prefix + n.toString(16).padStart(22, "0");
}

export interface DemoData {
  creators: Creator[];
  products: Product[];
  orders: Order[];
  creatorIds: Record<CreatorKey, string>;
  productIds: Record<string, string>;
}

export function buildDemoData(now: Date = new Date()): DemoData {
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  const today = toYmdIST(now);
  const ymdIso = (offsetDays: number) => ymdToDate(addDays(today, offsetDays)).toISOString();

  const creatorIds = {} as Record<CreatorKey, string>;
  const creators: Creator[] = CREATORS.map(({ key, ...creator }, i) => {
    creatorIds[key] = demoId("0a", i + 1);
    const joined = daysAgo(400 - i * 30);
    return { _id: creatorIds[key], ...creator, state: "Tamil Nadu", createdAt: joined, updatedAt: joined };
  });

  const productIds: Record<string, string> = {};
  const productByKey = new Map<string, Product>();
  const products: Product[] = PRODUCTS.map((seed, i) => {
    // The same check the product builder runs, so demo data can't drift.
    const problems = validateOptionGroups(seed.optionGroups);
    if (problems.length > 0) throw new Error(`Invalid demo options for ${seed.key}: ${problems.join(" ")}`);

    productIds[seed.key] = demoId("0b", i + 1);
    const listed = daysAgo(300 - i);
    const product: Product = {
      _id: productIds[seed.key],
      creatorId: creatorIds[seed.creator],
      slug: slugify(seed.title),
      title: seed.title,
      description: seed.description,
      images: seed.images,
      occasionTags: seed.occasionTags,
      basePricePaise: rupees(seed.basePriceRupees),
      baseProductionDays: seed.baseProductionDays,
      optionGroups: seed.optionGroups,
      maxRevisions: seed.maxRevisions,
      mockupFeePaise: seed.mockupFeeRupees === null ? null : rupees(seed.mockupFeeRupees),
      advancePercent: seed.advancePercent,
      weightGrams: seed.weightGrams,
      packageCm: seed.packageCm,
      isListed: true,
      createdAt: listed,
      updatedAt: listed,
    };
    productByKey.set(seed.key, product);
    return product;
  });

  const orders: Order[] = ORDERS.map((order, i) => {
    const product = productByKey.get(order.product);
    if (!product) throw new Error(`Unknown product "${order.product}" in demo orders`);

    // Use the app's own validation and pricing, so demo data obeys the same rules.
    const errors = validateSelections(product.optionGroups, order.selections);
    if (Object.keys(errors).length > 0) {
      throw new Error(`Invalid demo selections for ${order.buyerName}: ${JSON.stringify(errors)}`);
    }
    const quote = quoteItem(product, order.selections);

    const placedAt = daysAgo(order.placedDaysAgo);
    return {
      _id: demoId("0c", i + 1),
      buyerName: order.buyerName,
      buyerPhone: order.phone,
      creatorId: product.creatorId,
      productId: product._id,
      productSnapshot: {
        title: product.title,
        basePricePaise: product.basePricePaise,
        baseProductionDays: product.baseProductionDays,
        imageUrl: product.images[0] ?? "",
        maxRevisions: product.maxRevisions,
      },
      selections: order.selections,
      priceLines: quote.lines,
      itemTotalPaise: quote.itemTotalPaise,
      productionDays: quote.productionDays,
      dispatchBy: ymdIso(order.dispatchInDays),
      estimatedDelivery: ymdIso(order.dispatchInDays + DEFAULT_TRANSIT_DAYS),
      status: order.status,
      previews: (order.previews ?? []).map((preview, round) => ({
        // Placeholder mockups: the product's own photos.
        imageUrl: product.images[round % product.images.length]!,
        round: round + 1,
        response: preview.response,
        comment: preview.comment ?? "",
        createdAt: daysAgo(preview.daysAgo),
      })),
      createdAt: placedAt,
      updatedAt: placedAt,
    };
  });

  return { creators, products, orders, creatorIds, productIds };
}
