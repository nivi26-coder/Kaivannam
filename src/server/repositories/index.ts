import "server-only";
import { serverEnv } from "@/config/env";
import { getMockRepositories } from "./mock";
import { mongoRepositories } from "./mongo";
import type { Repositories } from "./types";

/**
 * No MONGODB_URI -> run on in-memory demo data, so the app works before
 * Atlas is set up. Add the variable to .env.local and restart to switch.
 */
export function isMockMode(): boolean {
  return !serverEnv().mongodbUri;
}

export function getRepositories(): Repositories {
  return isMockMode() ? getMockRepositories() : mongoRepositories;
}

export type { Repositories } from "./types";
