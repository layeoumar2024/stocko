import Dexie, { Table } from "dexie";

export interface LocalSale {
  id: string; // UUID client
  customer_id: string | null;
  total: number; // numeric
  payment_method: "cash" | "mobile_money" | "credit";
  amount_paid: number; // numeric
  device_id: string;
  user_id: string | null;
  created_at: string;
  deleted_at: string | null;
  cancels_sale_id: string | null;
  entreprise_id: string | null; // pour la RLS
}

export interface LocalSaleItem {
  id: string; // UUID client
  sale_id: string;
  product_id: string;
  qty: number; // numeric
  unit_price: number; // numeric
  cost_price: number; // numeric
}

export interface LocalStockMovement {
  id: string; // UUID client
  product_id: string;
  type: "Entrée" | "Sortie";
  quantity: number;
  time: string; // ISO String
  note?: string;
  user_id?: string | null;
  entreprise_id?: string | null;
}

export interface OutboxItem {
  id?: number; // PK auto-increment
  table: "sales" | "sale_items" | "stock_movements";
  action: "INSERT" | "UPDATE" | "DELETE";
  payload: any;
  timestamp: number;
}

class DenkaDatabase extends Dexie {
  sales!: Table<LocalSale>;
  sale_items!: Table<LocalSaleItem>;
  stock_movements!: Table<LocalStockMovement>;
  outbox!: Table<OutboxItem>;

  constructor() {
    super("DenkaDatabase");
    this.version(1).stores({
      sales: "id, customer_id, cancels_sale_id, created_at",
      sale_items: "id, sale_id, product_id",
      stock_movements: "id, product_id, time",
      outbox: "++id, table, timestamp"
    });
  }
}

export const db = new DenkaDatabase();
