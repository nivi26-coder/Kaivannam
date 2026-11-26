import "server-only";
import type { Repositories } from "../types";
import { mongoCreatorRepository } from "./creators";
import { mongoOrderRepository } from "./orders";
import { mongoProductRepository } from "./products";

export const mongoRepositories: Repositories = {
  creators: mongoCreatorRepository,
  products: mongoProductRepository,
  orders: mongoOrderRepository,
};
