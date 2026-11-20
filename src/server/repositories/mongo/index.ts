import "server-only";
import type { Repositories } from "../types";
import { mongoArtistRepository } from "./artists";
import { mongoOrderRepository } from "./orders";
import { mongoProductRepository } from "./products";

export const mongoRepositories: Repositories = {
  artists: mongoArtistRepository,
  products: mongoProductRepository,
  orders: mongoOrderRepository,
};
