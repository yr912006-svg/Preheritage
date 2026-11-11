import type { ProductItem } from "@/lib/sample-data";
import { getSellableStock } from "@/lib/inventory";

export type AvailabilityFilter = "ALL" | "IN_STOCK" | "OUT_OF_STOCK";
export const DEFAULT_AVAILABILITY_FILTER: AvailabilityFilter = "ALL";

export function parseAvailabilityFilter(value: string): AvailabilityFilter {
  return value === "IN_STOCK" || value === "OUT_OF_STOCK" ? value : DEFAULT_AVAILABILITY_FILTER;
}

export function isCatalogProductAvailable(product: Pick<ProductItem, "stock" | "status" | "variants">): boolean {
  return getSellableStock(product) > 0;
}

export function matchesAvailabilityFilter(product: Pick<ProductItem, "stock" | "status" | "variants">, filter: AvailabilityFilter): boolean {
  if (filter === "ALL") return true;
  const available = isCatalogProductAvailable(product);
  return filter === "IN_STOCK" ? available : !available;
}

export function filterCatalogByAvailability<T extends Pick<ProductItem, "stock" | "status" | "variants">>(products: T[], filter: AvailabilityFilter): T[] {
  return products.filter((product) => matchesAvailabilityFilter(product, filter));
}
