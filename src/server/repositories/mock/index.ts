// In-memory repositories over the demo data.
//
// - Used when MONGODB_URI isn't set (see ../index.ts), and by unit tests.
// - Changes live in server memory and are lost when the server restarts.
// - Works with `npm run dev` / `npm start` (one server process). On Vercel,
//   requests can land on different serverless instances that don't share
//   memory, so use Atlas there.

import type { Repositories } from "../types";
import { createMockCreatorRepository } from "./creators";
import { createMockDatabase, type MockDatabase } from "./database";
import { createMockOrderRepository } from "./orders";
import { createMockProductRepository } from "./products";

/** Repositories over the given database. Tests pass a fresh one each time. */
export function createMockRepositories(db: MockDatabase = createMockDatabase()): Repositories {
  return {
    creators: createMockCreatorRepository(db),
    products: createMockProductRepository(db),
    orders: createMockOrderRepository(db),
  };
}

const globalForMock = globalThis as typeof globalThis & { kaivannamMockRepositories?: Repositories };

/**
 * The app's shared instance. Created on first use (at request time, so dates
 * are relative to when the server started serving) and kept on `globalThis`
 * so it survives hot reloads in `next dev`.
 */
export function getMockRepositories(): Repositories {
  return (globalForMock.kaivannamMockRepositories ??= createMockRepositories());
}
