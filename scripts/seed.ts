// Demo data: 6 Tamil Nadu artists, their gifts, and orders in every status.
//
// Run with:  npm run seed
//   (same as: npx tsx --env-file=.env.local scripts/seed.ts)
//
// WARNING: this deletes all artists, products and orders in the database
// that MONGODB_URI points to, then inserts fresh demo data.
//
// Relative imports (not "@/...") keep this runnable outside Next.js.

import mongoose from "mongoose";
import { validateInputs } from "../lib/customFields";
import { connectDB } from "../lib/db";
import { addDays, todayIST, ymdToDate } from "../lib/dates";
import { unsplash } from "../lib/images";
import type { OccasionSlug } from "../lib/occasions";
import type { OrderStatus } from "../lib/orderStatus";
import { calculatePrice } from "../lib/pricing";
import type { CustomField, CustomFieldOption, CustomInputs, PreviewResponse } from "../lib/types";
import { Artist } from "../models/Artist";
import { Order } from "../models/Order";
import { Product } from "../models/Product";

// ------------------------------------------------------- field builders

const opt = (value: string, label: string, priceModifier = 0): CustomFieldOption => ({
  value,
  label,
  priceModifier,
});
const text = (key: string, label: string, required = true): CustomField => ({
  key,
  label,
  type: "text",
  required,
  options: [],
});
const photo = (key: string, label: string): CustomField => ({
  key,
  label,
  type: "image",
  required: true,
  options: [],
});
const select = (key: string, label: string, options: CustomFieldOption[]): CustomField => ({
  key,
  label,
  type: "select",
  required: true,
  options,
});

// ------------------------------------------------------------- artists

const artists = [
  {
    key: "kavya",
    name: "Kavya Raman",
    city: "Coimbatore",
    categories: ["Resin art", "Flower preservation"],
    makingTimeDays: 5,
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1779988197599-490eaba85095"),
    bio: "I started pouring resin in 2021 to save the flowers from my sister's wedding. Now I preserve memories for families across Tamil Nadu — garlands, bouquets, even a baby's first lock of hair. Every piece is cured for 72 hours and polished by hand in my home studio in Saibaba Colony.",
  },
  {
    key: "arjun",
    name: "Arjun Selvam",
    city: "Madurai",
    categories: ["Pencil portraits", "Charcoal portraits"],
    makingTimeDays: 7,
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1786477949219-dc7511dacd8a"),
    bio: "Fine arts graduate from Government College of Fine Arts, Chennai. I draw realistic portraits from your photos — grandparents, couples, pets — on acid-free paper that won't yellow. Over 400 portraits delivered through Instagram since 2019.",
  },
  {
    key: "meenakshi",
    name: "Meenakshi Sundaram",
    city: "Chennai",
    categories: ["Embroidery hoops"],
    makingTimeDays: 10,
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1771479452306-6dad4a9fbec0"),
    bio: "Hand embroidery is slow on purpose. Each hoop takes 12 to 20 hours of stitching with cotton and silk threads. I love making name hoops for newborns and keepsakes recreated from wedding bouquets.",
  },
  {
    key: "divya",
    name: "Divya Krishnan",
    city: "Tiruchirappalli",
    categories: ["Hand-lettering", "Tamil calligraphy"],
    makingTimeDays: 4,
    isVerified: false,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1619010431046-dde29509016e"),
    bio: "Brush lettering in English and Tamil. Thirukkural couplets, wedding vows, letters to someone far away — written slowly, by hand, on paper you'll want to keep.",
  },
  {
    key: "nithya",
    name: "Nithya Prabhu",
    city: "Chennai",
    categories: ["Personalised hampers"],
    makingTimeDays: 3,
    isVerified: true,
    isAcceptingOrders: true,
    avatarUrl: unsplash("1632924192284-9163f3d88a16"),
    bio: "Thoughtful hampers packed in cane baskets and wooden crates, with a handwritten card in every box. I source sweets from family-run shops in Mylapore and T. Nagar.",
  },
  {
    key: "karthik",
    name: "Karthik Murugan",
    city: "Salem",
    categories: ["Couple sketches", "Colour pencil portraits"],
    makingTimeDays: 6,
    isVerified: false,
    // Shows the "paused" state in the demo.
    isAcceptingOrders: false,
    avatarUrl: unsplash("1758521232750-909a8b065963"),
    bio: "Couple and family sketches in pencil and colour pencil. Taking a short break for Diwali orders — back soon!",
  },
] as const;

type ArtistKey = (typeof artists)[number]["key"];

// ------------------------------------------------------------ products

interface ProductSeed {
  key: string;
  artist: ArtistKey;
  title: string;
  description: string;
  basePrice: number;
  images: string[];
  occasionTags: OccasionSlug[];
  maxRevisions: number;
  customFields: CustomField[];
}

const sizeA4A3 = (a3Price: number) => select("size", "Size", [opt("a4", "A4"), opt("a3", "A3", a3Price)]);

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

const products: ProductSeed[] = [
  // Kavya — resin
  {
    key: "keychain",
    artist: "kavya",
    title: "Name Keychain with Real Flowers",
    description:
      "A clear resin keychain with your name in gold-foil letters and real dried flowers set inside. Light, waterproof and made to last — a favourite for Rakhi and return gifts.",
    basePrice: 349,
    images: [unsplash("1725826474457-d4dc3d6d8abf"), unsplash("1687363714985-990685339050")],
    occasionTags: ["birthday", "rakhi", "valentines"],
    maxRevisions: 2,
    customFields: [
      text("name", "Name on keychain"),
      select("flower", "Flowers inside", [
        opt("rose", "Pink rose buds"),
        opt("daisy", "Yellow daisies"),
        opt("forget-me-not", "Blue forget-me-nots", 30),
      ]),
      select("goldFlakes", "Gold flakes", [opt("no", "No"), opt("yes", "Yes, add gold flakes", 40)]),
    ],
  },
  {
    key: "pendant",
    artist: "kavya",
    title: "Preserved Flower Pendant",
    description:
      "Flowers from a special day — a wedding garland, a first bouquet — preserved in a resin pendant you can wear every day. Use my dried flowers, or courier me your own and I'll dry them carefully.",
    basePrice: 649,
    images: [unsplash("1779988197599-490eaba85095"), unsplash("1783509097964-3a1123132492")],
    occasionTags: ["wedding", "anniversary", "valentines"],
    maxRevisions: 2,
    customFields: [
      select("flowerSource", "Flowers", [
        opt("artist", "Kavya's dried flowers"),
        opt("mine", "My own flowers (I'll courier them)", 150),
      ]),
      select("shape", "Shape", [opt("round", "Round"), opt("heart", "Heart", 50), opt("teardrop", "Teardrop", 50)]),
      select("chain", "Chain", [
        opt("none", "No chain"),
        opt("silver", "Silver-tone chain", 120),
        opt("gold", "Gold-tone chain", 150),
      ]),
      text("initials", "Initials on the back", false),
    ],
  },
  {
    key: "coasters",
    artist: "kavya",
    title: "Resin Geode Coaster Set",
    description:
      "Geode-style resin coasters with hand-applied gold edges. No two sets are the same. Add names or a date in gold for a housewarming or wedding gift.",
    basePrice: 1299,
    images: [unsplash("1676378411543-b38dd1ae1d24"), unsplash("1664981751739-7abc3a434078")],
    occasionTags: ["wedding", "diwali", "anniversary"],
    maxRevisions: 1,
    customFields: [
      select("colour", "Colours", [
        opt("pink-gold", "Pink & gold"),
        opt("ocean", "Ocean blue"),
        opt("emerald", "Emerald green"),
        opt("black-gold", "Black & gold", 100),
      ]),
      select("setSize", "Set size", [opt("2", "Set of 2"), opt("4", "Set of 4", 1100)]),
      text("names", "Names or date in gold", false),
    ],
  },

  // Arjun — pencil & charcoal portraits
  {
    key: "pencil",
    artist: "arjun",
    title: "Pencil Portrait from Your Photo",
    description:
      "A detailed graphite portrait hand-drawn from your favourite photo, on 300gsm acid-free paper. Clear, well-lit photos where faces are easy to see work best.",
    basePrice: 1199,
    images: [unsplash("1780037756323-f14d43763351"), unsplash("1593472807861-5bb884af28f6")],
    occasionTags: ["birthday", "anniversary", "wedding"],
    maxRevisions: 2,
    customFields: [
      photo("photo", "Reference photo"),
      select("people", "People in the portrait", [
        opt("1", "1 person"),
        opt("2", "2 people", 600),
        opt("3", "3 people", 1100),
        opt("family", "Family (4–6)", 1900),
      ]),
      sizeA4A3(700),
      select("frame", "Frame", [
        opt("none", "No frame"),
        opt("black", "Black frame", 450),
        opt("teak", "Teak wood frame", 650),
      ]),
    ],
  },
  {
    key: "charcoal",
    artist: "arjun",
    title: "Charcoal Portrait",
    description:
      "Bold, dramatic charcoal on textured paper. Beautiful for portraits of parents and grandparents. Sealed with fixative so it won't smudge.",
    basePrice: 1599,
    images: [unsplash("1748200099986-5ed2ca9ae4a6"), unsplash("1786477949219-dc7511dacd8a")],
    occasionTags: ["birthday", "anniversary"],
    maxRevisions: 2,
    customFields: [
      photo("photo", "Reference photo"),
      sizeA4A3(800),
      select("background", "Background", [opt("plain", "Plain"), opt("sketched", "Sketched background", 300)]),
      text("message", "Dedication to write below the portrait", false),
    ],
  },

  // Meenakshi — embroidery
  {
    key: "nameHoop",
    artist: "meenakshi",
    title: "Custom Floral Name Hoop",
    description:
      "Hand-embroidered flowers around a name and date, finished in a wooden hoop ready to hang. Lovely for weddings, anniversaries and nursery walls.",
    basePrice: 1450,
    images: [unsplash("1771555739335-95ea325f29d2"), unsplash("1766418393788-dc829192ab5f")],
    occasionTags: ["wedding", "anniversary", "baby"],
    maxRevisions: 2,
    customFields: [
      text("names", "Name(s) to stitch"),
      text("date", "Date to stitch (e.g. 14.02.2026)", false),
      select("size", "Hoop size", [opt("6", "6 inch"), opt("8", "8 inch", 350), opt("10", "10 inch", 700)]),
      select("palette", "Thread colours", [
        opt("pastel", "Pastel"),
        opt("bright", "Bright"),
        opt("ivory-gold", "Ivory & gold", 150),
      ]),
    ],
  },
  {
    key: "birthHoop",
    artist: "meenakshi",
    title: "Birth Flower Hoop for Baby",
    description:
      "Your baby's name stitched with their birth-month flower. Add birth details for a keepsake grandparents will treasure.",
    basePrice: 1250,
    images: [unsplash("1771479452306-6dad4a9fbec0"), unsplash("1771409046893-3121a32d977e")],
    occasionTags: ["baby", "birthday"],
    maxRevisions: 2,
    customFields: [
      text("babyName", "Baby's name"),
      select(
        "month",
        "Birth month flower",
        MONTH_FLOWERS.map((label, i) => opt(String(i + 1), label)),
      ),
      select("size", "Hoop size", [opt("6", "6 inch"), opt("8", "8 inch", 350)]),
      text("birthDetails", "Birth date, time & weight", false),
    ],
  },
  {
    key: "bouquetHoop",
    artist: "meenakshi",
    title: "Wedding Bouquet Keepsake Hoop",
    description:
      "Your wedding bouquet recreated in thread, stitch by stitch, with your names below. A keepsake that lasts long after the flowers fade.",
    basePrice: 2200,
    images: [unsplash("1766418393788-dc829192ab5f"), unsplash("1771409046893-3121a32d977e")],
    occasionTags: ["wedding", "anniversary"],
    maxRevisions: 3,
    customFields: [
      photo("photo", "Photo of the bouquet"),
      text("names", "Couple's names"),
      select("size", "Hoop size", [opt("8", "8 inch"), opt("10", "10 inch", 450)]),
    ],
  },

  // Divya — lettering
  {
    key: "quote",
    artist: "divya",
    title: "Hand-lettered Quote Frame",
    description:
      "Your favourite quote, a Thirukkural couplet or a family motto, brush-lettered in English or Tamil on thick watercolour paper.",
    basePrice: 699,
    images: [unsplash("1517487550761-9af05b660bde"), unsplash("1561812938-f6e60cbf95e3")],
    occasionTags: ["birthday", "pongal", "diwali"],
    maxRevisions: 2,
    customFields: [
      text("quote", "Quote"),
      select("language", "Language", [
        opt("en", "English"),
        opt("ta", "Tamil", 100),
        opt("both", "Tamil & English", 200),
      ]),
      select("size", "Size", [opt("a5", "A5"), opt("a4", "A4", 250)]),
      select("frame", "Frame", [opt("none", "No frame"), opt("white", "White frame", 200), opt("wood", "Wooden frame", 250)]),
    ],
  },
  {
    key: "letter",
    artist: "divya",
    title: "Personalised Calligraphy Letter",
    description:
      "Say it the old-fashioned way. Your words, written in flowing calligraphy and sealed in an envelope — for anniversaries, proposals or someone far from home.",
    basePrice: 899,
    images: [unsplash("1769522993580-3b797e0d8f8b"), unsplash("1561812938-f6e60cbf95e3")],
    occasionTags: ["valentines", "anniversary", "wedding"],
    maxRevisions: 1,
    customFields: [
      text("recipient", "Who is it for?"),
      text("message", "Your message"),
      select("paper", "Paper", [opt("ivory", "Ivory card"), opt("cotton", "Handmade cotton paper", 150)]),
      select("seal", "Finish", [opt("plain", "Plain envelope"), opt("wax", "Wax seal & envelope", 120)]),
    ],
  },
  {
    key: "card",
    artist: "divya",
    title: "Custom Birthday Card",
    description: "A bright, hand-lettered birthday card with their name front and centre.",
    basePrice: 249,
    images: [unsplash("1619010431046-dde29509016e")],
    occasionTags: ["birthday"],
    maxRevisions: 1,
    customFields: [
      text("name", "Name"),
      text("age", "Age to feature", false),
      select("colours", "Colours", [opt("pink-gold", "Pink & gold"), opt("blue-silver", "Blue & silver"), opt("rainbow", "Rainbow")]),
    ],
  },

  // Nithya — hampers
  {
    key: "rakhiHamper",
    artist: "nithya",
    title: "Rakhi Hamper for Your Sibling",
    description:
      "A rakhi, chocolates and a handwritten card, packed in a reusable cane basket. Delivered across Tamil Nadu.",
    basePrice: 1199,
    images: [unsplash("1781263538938-561a5e1acc51"), unsplash("1608755727748-dfa2e44f255b")],
    occasionTags: ["rakhi"],
    maxRevisions: 1,
    customFields: [
      text("siblingName", "Sibling's name for the card"),
      select("rakhi", "Rakhi", [opt("thread", "Thread rakhi"), opt("silver", "Silver-plated rakhi", 350)]),
      select("chocolates", "Chocolates", [opt("milk", "Milk chocolate mix"), opt("dark", "Premium dark chocolate", 250)]),
      text("note", "Message for the card", false),
    ],
  },
  {
    key: "crate",
    artist: "nithya",
    title: "Celebration Gift Crate",
    description:
      "A wooden crate of treats, fresh flowers and a keepsake, themed for your occasion. The crate makes a nice planter afterwards.",
    basePrice: 2499,
    images: [unsplash("1773450970959-cef81e9b1053"), unsplash("1508899203029-1c9eb493c9bd")],
    occasionTags: ["birthday", "anniversary", "diwali"],
    maxRevisions: 1,
    customFields: [
      text("recipient", "Recipient's name"),
      select("theme", "Theme", [
        opt("birthday", "Birthday"),
        opt("anniversary", "Anniversary"),
        opt("thanks", "Thank you"),
        opt("diwali", "Diwali"),
      ]),
      select("addOn", "Add-on", [
        opt("none", "None"),
        opt("candle", "Scented candle", 299),
        opt("plant", "Mini money plant", 349),
        opt("frame", "Photo frame", 399),
      ]),
      text("note", "Message for the card", false),
    ],
  },
  {
    key: "sweetBox",
    artist: "nithya",
    title: "Festive Sweet & Treat Box",
    description:
      "Handpicked sweets and savouries from family-run shops, in a gift box with a personalised name tag. Sugar-free option available.",
    basePrice: 899,
    images: [unsplash("1773450269672-8075682144a6"), unsplash("1632924192284-9163f3d88a16")],
    occasionTags: ["diwali", "pongal"],
    maxRevisions: 1,
    customFields: [
      select("boxSize", "Box size", [opt("6", "6 pieces"), opt("12", "12 pieces", 600)]),
      select("sugar", "Sweets", [opt("regular", "Regular"), opt("sugar-free", "Sugar-free", 150)]),
      text("nameTag", "Name on the gift tag", false),
    ],
  },

  // Karthik — paused
  {
    key: "coupleSketch",
    artist: "karthik",
    title: "Couple Sketch from Photo",
    description: "A pencil sketch of the two of you, drawn from your favourite photo together.",
    basePrice: 1599,
    images: [unsplash("1789983140185-e36654e0656b"), unsplash("1786477949219-dc7511dacd8a")],
    occasionTags: ["anniversary", "valentines", "wedding"],
    maxRevisions: 2,
    customFields: [photo("photo", "Reference photo"), text("names", "Names to write", false), sizeA4A3(700)],
  },
  {
    key: "colourPortrait",
    artist: "karthik",
    title: "Colour Pencil Portrait",
    description: "A vivid colour pencil portrait on toned paper, built up in many fine layers.",
    basePrice: 1899,
    images: [unsplash("1758521232750-909a8b065963"), unsplash("1593472807861-5bb884af28f6")],
    occasionTags: ["birthday"],
    maxRevisions: 2,
    customFields: [photo("photo", "Reference photo"), sizeA4A3(900)],
  },
];

// -------------------------------------------------------------- orders

interface OrderSeed {
  product: string;
  buyerName: string;
  phone: string;
  inputs: CustomInputs;
  status: OrderStatus;
  /** Delivery date relative to today (negative = in the past). */
  deliverInDays: number;
  placedDaysAgo: number;
  previews?: { response: PreviewResponse; comment?: string; daysAgo: number }[];
}

const orders: OrderSeed[] = [
  // Kavya: one order in each active status, so her dashboard shows everything.
  {
    product: "keychain",
    buyerName: "Harini Sivakumar",
    phone: "9000000101",
    inputs: { name: "Harini", flower: "rose", goldFlakes: "yes" },
    status: "PLACED",
    deliverInDays: 12,
    placedDaysAgo: 0,
  },
  {
    product: "keychain",
    buyerName: "Vignesh Kumar",
    phone: "9000000102",
    inputs: { name: "Anbu", flower: "forget-me-not", goldFlakes: "no" },
    status: "PAID",
    deliverInDays: 8,
    placedDaysAgo: 1,
  },
  {
    product: "pendant",
    buyerName: "Swetha Ramesh",
    phone: "9000000103",
    inputs: { flowerSource: "mine", shape: "heart", chain: "gold", initials: "S & R" },
    status: "PREVIEW_SENT",
    deliverInDays: 9,
    placedDaysAgo: 3,
    previews: [{ response: "pending", daysAgo: 0 }],
  },
  {
    product: "coasters",
    buyerName: "Prakash Iyer",
    phone: "9000000104",
    inputs: { colour: "black-gold", setSize: "4", names: "Prakash & Divya" },
    status: "REVISION_REQUESTED",
    deliverInDays: 6,
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
    inputs: { name: "Thambi", flower: "daisy", goldFlakes: "yes" },
    status: "IN_PRODUCTION",
    deliverInDays: 2,
    placedDaysAgo: 6,
    previews: [{ response: "approved", daysAgo: 4 }],
  },
  {
    product: "coasters",
    buyerName: "Sathish Babu",
    phone: "9000000106",
    inputs: { colour: "ocean", setSize: "2" },
    status: "SHIPPED",
    deliverInDays: 1,
    placedDaysAgo: 8,
    previews: [{ response: "approved", daysAgo: 6 }],
  },
  {
    product: "pendant",
    buyerName: "Aishwarya Mohan",
    phone: "9000000107",
    inputs: { flowerSource: "artist", shape: "round", chain: "silver" },
    status: "DELIVERED",
    deliverInDays: -5,
    placedDaysAgo: 16,
    previews: [{ response: "approved", daysAgo: 13 }],
  },

  // Arjun
  {
    product: "pencil",
    buyerName: "Lakshmi Narayanan",
    phone: "9000000108",
    inputs: { photo: "amma-appa-50th.jpg", people: "2", size: "a3", frame: "teak" },
    status: "PREVIEW_SENT",
    deliverInDays: 10,
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
    inputs: { photo: "paati.jpg", size: "a4", background: "plain", message: "For Paati, with love" },
    status: "APPROVED",
    deliverInDays: 7,
    placedDaysAgo: 4,
    previews: [{ response: "approved", daysAgo: 1 }],
  },
  {
    product: "pencil",
    buyerName: "Dinesh Kannan",
    phone: "9000000110",
    inputs: { photo: "wedding.jpg", people: "2", size: "a4", frame: "black" },
    status: "DELIVERED",
    deliverInDays: -12,
    placedDaysAgo: 25,
    previews: [{ response: "approved", daysAgo: 20 }],
  },
  {
    product: "pencil",
    buyerName: "Revathi Subramanian",
    phone: "9000000111",
    inputs: { photo: "family-pongal.jpg", people: "family", size: "a3", frame: "teak" },
    status: "DELIVERED",
    deliverInDays: -30,
    placedDaysAgo: 45,
    previews: [{ response: "approved", daysAgo: 40 }],
  },

  // Meenakshi
  {
    product: "birthHoop",
    buyerName: "Gayathri Ashok",
    phone: "9000000112",
    inputs: { babyName: "Ilakiya", month: "7", size: "8", birthDetails: "3 July 2026 · 6:42 am · 3.1 kg" },
    status: "PAID",
    deliverInDays: 14,
    placedDaysAgo: 1,
  },
  {
    product: "nameHoop",
    buyerName: "Ramya Balaji",
    phone: "9000000113",
    inputs: { names: "Ramya & Balaji", date: "21.08.2026", size: "10", palette: "ivory-gold" },
    status: "DELIVERED",
    deliverInDays: -8,
    placedDaysAgo: 24,
    previews: [{ response: "approved", daysAgo: 19 }],
  },

  // Divya
  {
    product: "quote",
    buyerName: "Bharath Raj",
    phone: "9000000114",
    inputs: { quote: "அன்பின் வழியது உயிர்நிலை", language: "ta", size: "a4", frame: "wood" },
    status: "DELIVERED",
    deliverInDays: -3,
    placedDaysAgo: 10,
    previews: [{ response: "approved", daysAgo: 8 }],
  },
  {
    product: "letter",
    buyerName: "Nandhini Prasad",
    phone: "9000000115",
    inputs: { recipient: "Arun", message: "Five years, two cities, one us. Happy anniversary!", paper: "cotton", seal: "wax" },
    status: "PLACED",
    deliverInDays: 9,
    placedDaysAgo: 0,
  },

  // Nithya
  {
    product: "crate",
    buyerName: "Suresh Natarajan",
    phone: "9000000116",
    inputs: { recipient: "Kala Akka", theme: "thanks", addOn: "plant", note: "Thank you for everything!" },
    status: "IN_PRODUCTION",
    deliverInDays: 0,
    placedDaysAgo: 4,
    previews: [{ response: "approved", daysAgo: 2 }],
  },
  {
    product: "sweetBox",
    buyerName: "Priya Chandrasekar",
    phone: "9000000117",
    inputs: { boxSize: "12", sugar: "sugar-free", nameTag: "Seetha Patti" },
    status: "DELIVERED",
    deliverInDays: -2,
    placedDaysAgo: 7,
    previews: [{ response: "approved", daysAgo: 5 }],
  },
  {
    product: "rakhiHamper",
    buyerName: "Meera Suresh",
    phone: "9000000118",
    inputs: { siblingName: "Karthi", rakhi: "silver", chocolates: "dark" },
    status: "DELIVERED",
    deliverInDays: -60,
    placedDaysAgo: 66,
    previews: [{ response: "approved", daysAgo: 64 }],
  },

  // Karthik
  {
    product: "coupleSketch",
    buyerName: "Hari Prasath",
    phone: "9000000119",
    inputs: { photo: "us-at-marina.jpg", names: "Hari & Keerthana", size: "a3" },
    status: "DELIVERED",
    deliverInDays: -15,
    placedDaysAgo: 28,
    previews: [{ response: "approved", daysAgo: 22 }],
  },
];

// ---------------------------------------------------------------- main

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

/** Drops the seed-only `key` used to link records in this file. */
function omitKey<T extends { key: string }>(item: T): Omit<T, "key"> {
  const copy: Partial<T> = { ...item };
  delete copy.key;
  return copy as Omit<T, "key">;
}

async function main() {
  const { connection } = await connectDB();
  console.log(`Connected to ${connection.host} / ${connection.name}`);

  await Promise.all([Artist.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
  console.log("Cleared artists, products and orders.");

  const createdArtists = await Artist.insertMany(
    artists.map((artist) => ({ ...omitKey(artist), state: "Tamil Nadu" })),
  );
  const artistIdByKey = new Map(artists.map((a, i) => [a.key, createdArtists[i]!._id]));
  const artistByKey = new Map(artists.map((a) => [a.key, a]));

  const createdProducts = await Product.insertMany(
    products.map((product) => {
      const { artist, ...rest } = omitKey(product);
      return { ...rest, artistId: artistIdByKey.get(artist) };
    }),
  );
  const productByKey = new Map(products.map((p, i) => [p.key, { seed: p, doc: createdProducts[i]! }]));

  const today = todayIST();
  const orderDocs = orders.map((order) => {
    const entry = productByKey.get(order.product);
    if (!entry) throw new Error(`Unknown product "${order.product}" in seed orders`);
    const { seed, doc } = entry;

    // Use the app's own validation and pricing, so seed data obeys the same rules.
    const errors = validateInputs(seed.customFields, order.inputs);
    if (Object.keys(errors).length > 0) {
      throw new Error(`Invalid seed inputs for ${order.buyerName}: ${JSON.stringify(errors)}`);
    }

    const placedAt = daysAgo(order.placedDaysAgo);
    return {
      buyerName: order.buyerName,
      buyerPhone: order.phone,
      artistId: artistIdByKey.get(seed.artist),
      productId: doc._id,
      productSnapshot: {
        title: seed.title,
        basePrice: seed.basePrice,
        imageUrl: seed.images[0],
        maxRevisions: seed.maxRevisions,
      },
      inputs: order.inputs,
      totalPrice: calculatePrice(seed, order.inputs),
      deliverBy: ymdToDate(addDays(today, order.deliverInDays)),
      status: order.status,
      previews: (order.previews ?? []).map((preview, i) => ({
        // Placeholder mockups: the product's own photos.
        imageUrl: seed.images[i % seed.images.length],
        round: i + 1,
        response: preview.response,
        comment: preview.comment ?? "",
        createdAt: daysAgo(preview.daysAgo),
      })),
      createdAt: placedAt,
      updatedAt: placedAt,
    };
  });
  // timestamps: false keeps our back-dated createdAt instead of "now".
  const createdOrders = await Order.insertMany(orderDocs, { timestamps: false });

  console.log(
    `Inserted ${createdArtists.length} artists, ${createdProducts.length} products, ${createdOrders.length} orders.\n`,
  );

  const base = "http://localhost:3000";
  const kavyaId = artistIdByKey.get("kavya");
  const awaitingApproval = createdOrders.find((o) => o.status === "PREVIEW_SENT");
  console.log("Try these:");
  console.log(`  Home:                      ${base}/`);
  console.log(`  Product with photo field:  ${base}/products/${productByKey.get("pencil")!.doc._id}`);
  console.log(`  Artist profile:            ${base}/artists/${kavyaId}`);
  console.log(`  Order awaiting approval:   ${base}/orders/${awaitingApproval?._id}`);
  console.log(`  ${artistByKey.get("kavya")!.name}'s dashboard:  ${base}/dashboard?artist=${kavyaId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
