import "server-only";
import { isValidObjectId } from "mongoose";
import { getRepositories, type Repositories } from "@/server/repositories";
import { fail, ok, type Result } from "./result";

/**
 * The dashboard's pause toggle. We set the value explicitly instead of
 * flipping it, so a double-click can't pause and immediately un-pause.
 *
 * DEMO NOTE: no login yet. In the MVP, check the caller is this creator.
 */
export async function setAcceptingOrders(
  creatorId: string,
  accepting: boolean,
  repos: Repositories = getRepositories(),
): Promise<Result> {
  if (!isValidObjectId(creatorId)) return fail("Creator not found.");
  await repos.creators.setAcceptingOrders(creatorId, accepting);
  return ok();
}
