// Writes the demo data (src/server/demo-data.ts) into MongoDB Atlas.
//
// Run with:  npm run seed
//   (same as: npx tsx --env-file=.env.local scripts/seed.ts)
//
// WARNING: this deletes all creators, products and orders in the database
// that MONGODB_URI points to, then inserts fresh demo data.
//
// Without a database the app already shows this same data from memory, and
// the ids are fixed, so links keep working after you switch to Atlas.
//
// tsx understands the "@/..." paths from tsconfig.json, so this script uses
// the same modules as the app. None of them may import "server-only".

import mongoose from "mongoose";
import { connectDB } from "@/server/db/connect";
import { CreatorModel } from "@/server/db/models/creator.model";
import { OrderModel } from "@/server/db/models/order.model";
import { ProductModel } from "@/server/db/models/product.model";
import { buildDemoData } from "@/server/demo-data";

async function main() {
  const { connection } = await connectDB();
  console.log(`Connected to ${connection.host} / ${connection.name}`);

  await Promise.all([CreatorModel.deleteMany({}), ProductModel.deleteMany({}), OrderModel.deleteMany({})]);
  console.log("Cleared creators, products and orders.");

  const data = buildDemoData();
  // timestamps: false keeps the demo's back-dated createdAt/updatedAt
  // instead of stamping everything with "now". Mongoose still validates
  // every document against the schemas and turns id/date strings into
  // ObjectIds and Dates.
  await CreatorModel.insertMany(data.creators, { timestamps: false });
  await ProductModel.insertMany(data.products, { timestamps: false });
  await OrderModel.insertMany(data.orders, { timestamps: false });

  console.log(
    `Inserted ${data.creators.length} creators, ${data.products.length} products, ${data.orders.length} orders.\n`,
  );

  const base = "http://localhost:3000";
  const awaitingApproval = data.orders.find((o) => o.status === "PREVIEW_SENT");
  console.log("Try these:");
  console.log(`  Home:                      ${base}/`);
  console.log(`  Product with photo field:  ${base}/products/${data.productIds.pencil}`);
  console.log(`  Artist profile:            ${base}/artists/${data.creatorIds.kavya}`);
  console.log(`  Order awaiting approval:   ${base}/orders/${awaitingApproval?._id}`);
  console.log(`  Artist dashboard:          ${base}/dashboard?artist=${data.creatorIds.kavya}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
