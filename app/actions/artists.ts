"use server";

import { isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { Artist } from "@/models/Artist";

/**
 * The dashboard's pause toggle. We set the value explicitly instead of
 * flipping it, so a double-click can't pause and immediately un-pause.
 *
 * DEMO NOTE: no login yet. In the MVP, check the caller is this artist.
 */
export async function setAcceptingOrders(artistId: string, accepting: boolean) {
  if (!isValidObjectId(artistId)) return;
  await connectDB();
  await Artist.updateOne({ _id: artistId }, { $set: { isAcceptingOrders: accepting } });
  // The paused state shows on the home, artist, product and dashboard pages.
  revalidatePath("/", "layout");
}
