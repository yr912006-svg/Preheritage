export type OrderTrackingItemInput = {
  title: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
};

export function toOrderTrackingItems(items: OrderTrackingItemInput[]) {
  return items.map((item) => ({
    title: item.title,
    size: item.size,
    color: item.color,
    price: item.price,
    quantity: item.quantity,
    lineTotal: item.price * item.quantity,
  }));
}
