// Writes the demo data (lib/demoData.ts) into MongoDB Atlas.
//
// Run with:  npm run seed
//   (same as: npx tsx --env-file=.env.local scripts/seed.ts)
//
// WARNING: this deletes all artists, products and orders in the database
// that MONGODB_URI points to, then inserts fresh demo data.
//
// Without a database the app already shows this same data from memory, and
// the ids are fixed, so links keep working after you switch to Atlas.
//
// Relative imports (not "@/...") keep this runnable outside Next.js.

import mongoose from "mongoose";
import { connectDB } from "../lib/db";
import { buildDemoData } from "../lib/demoData";
import { Artist } from "../models/Artist";
import { Order } from "../models/Order";
import { Product } from "../models/Product";

async function main() {
  const { connection } = await connectDB();
  console.log(`Connected to ${connection.host} / ${connection.name}`);

  await Promise.all([Artist.deleteMany({}), Product.deleteMany({}), Order.deleteMany({})]);
  console.log("Cleared artists, products and orders.");

  const data = buildDemoData();
  // timestamps: false keeps the demo's back-dated createdAt/updatedAt
  // instead of stamping everything with "now". Mongoose still validates
  // every document against the schemas and turns id/date strings into
  // ObjectIds and Dates.
  await Artist.insertMany(data.artists, { timestamps: false });
  await Product.insertMany(data.products, { timestamps: false });
  await Order.insertMany(data.orders, { timestamps: false });

  console.log(
    `Inserted ${data.artists.length} artists, ${data.products.length} products, ${data.orders.length} orders.\n`,
  );

  const base = "http://localhost:3000";
  const awaitingApproval = data.orders.find((o) => o.status === "PREVIEW_SENT");
  console.log("Try these:");
  console.log(`  Home:                      ${base}/`);
  console.log(`  Product with photo field:  ${base}/products/${data.productIds.pencil}`);
  console.log(`  Artist profile:            ${base}/artists/${data.artistIds.kavya}`);
  console.log(`  Order awaiting approval:   ${base}/orders/${awaitingApproval?._id}`);
  console.log(`  Artist dashboard:          ${base}/dashboard?artist=${data.artistIds.kavya}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
