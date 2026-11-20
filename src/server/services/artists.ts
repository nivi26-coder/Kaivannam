import "server-only";
import { isValidObjectId } from "mongoose";
import { getRepositories, type Repositories } from "@/server/repositories";
import { fail, ok, type Result } from "./result";

/**
 * The dashboard's pause toggle. We set the value explicitly instead of
 * flipping it, so a double-click can't pause and immediately un-pause.
 *
 * DEMO NOTE: no login yet. In the MVP, check the caller is this artist.
 */
export async function setAcceptingOrders(
  artistId: string,
  accepting: boolean,
  repos: Repositories = getRepositories(),
): Promise<Result> {
  if (!isValidObjectId(artistId)) return fail("Artist not found.");
  await repos.artists.setAcceptingOrders(artistId, accepting);
  return ok();
}
