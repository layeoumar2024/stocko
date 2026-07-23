export interface SaleInput {
  customer_id: string | null;
  payment_method: "cash" | "mobile_money" | "credit";
  amount_paid: number;
  items: Array<{
    product_id: string;
    qty: number;
    unit_price: number;
    cost_price: number;
  }>;
}

export interface SaleWithItems {
  id: string;
  customer_id: string | null;
  total: number;
  payment_method: "cash" | "mobile_money" | "credit";
  amount_paid: number;
  device_id: string;
  user_id: string | null;
  created_at: string;
  deleted_at: string | null;
  cancels_sale_id: string | null;
  entreprise_id: string | null;
  items: Array<{
    id: string;
    sale_id: string;
    product_id: string;
    qty: number;
    unit_price: number;
    cost_price: number;
  }>;
}
