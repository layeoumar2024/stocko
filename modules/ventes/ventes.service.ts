import { db } from "../sync/db";
import { writeOffline, triggerSync } from "../sync/sync.service";
import { SaleInput } from "./ventes.types";

// Helper client-side UUID generator (RFC4122 v4)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Enregistre une vente, ses lignes de vente et ses mouvements de stock
 * associés en une unique transaction Dexie (IndexedDB), puis lance la synchro.
 */
export async function createSale(
  input: SaleInput,
  user_id: string | null,
  entreprise_id: string | null,
  device_id: string = "browser"
): Promise<string> {
  const saleId = generateUUID();
  const created_at = new Date().toISOString();
  
  const total = input.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);

  // 1. Transaction atomique locale Dexie
  await db.transaction("rw", [db.sales, db.sale_items, db.stock_movements, db.outbox], async (tx) => {
    // a. Créer l'entité de vente
    const salePayload = {
      id: saleId,
      customer_id: input.customer_id,
      total,
      payment_method: input.payment_method,
      amount_paid: input.amount_paid,
      device_id,
      user_id,
      created_at,
      deleted_at: null,
      cancels_sale_id: null,
      entreprise_id
    };
    await writeOffline(tx, "sales", "INSERT", salePayload);

    // b. Créer les lignes de vente et mouvements associés
    for (const item of input.items) {
      const itemId = generateUUID();
      const itemPayload = {
        id: itemId,
        sale_id: saleId,
        product_id: item.product_id,
        qty: item.qty,
        unit_price: item.unit_price,
        cost_price: item.cost_price
      };
      await writeOffline(tx, "sale_items", "INSERT", itemPayload);

      // Générer le mouvement de stock (type Sortie = delta négatif)
      const movementId = generateUUID();
      const movementPayload = {
        id: movementId,
        product_id: item.product_id,
        type: "Sortie" as const,
        quantity: item.qty, // Enregistré en positif, son type Sortie induit le delta négatif
        time: created_at,
        note: `Vente ${saleId.substring(0, 8)}`,
        user_id,
        entreprise_id
      };
      await writeOffline(tx, "stock_movements", "INSERT", movementPayload);
    }
  });

  // 2. Déclencher la synchronisation en arrière-plan sans bloquer
  triggerSync().catch((err) => console.error("[Sync Error] background trigger failed:", err));

  return saleId;
}

/**
 * Annule une vente existante : crée une vente d'annulation liée et restitue
 * le stock en créant des mouvements de stock positifs (Entrée).
 */
export async function cancelSale(
  saleId: string,
  user_id: string | null,
  entreprise_id: string | null
): Promise<string> {
  const originalSale = await db.sales.get(saleId);
  if (!originalSale) {
    throw new Error("Vente originale introuvable en local.");
  }

  const items = await db.sale_items.where("sale_id").equals(saleId).toArray();

  const cancelSaleId = generateUUID();
  const created_at = new Date().toISOString();

  await db.transaction("rw", [db.sales, db.sale_items, db.stock_movements, db.outbox], async (tx) => {
    // a. Créer l'entité d'annulation de vente
    const cancelSalePayload = {
      id: cancelSaleId,
      customer_id: originalSale.customer_id,
      total: -originalSale.total,
      payment_method: originalSale.payment_method,
      amount_paid: -originalSale.amount_paid,
      device_id: originalSale.device_id,
      user_id,
      created_at,
      deleted_at: null,
      cancels_sale_id: saleId,
      entreprise_id
    };
    await writeOffline(tx, "sales", "INSERT", cancelSalePayload);

    // b. Créer des mouvements de restitution (type Entrée = delta positif)
    for (const item of items) {
      const movementId = generateUUID();
      const movementPayload = {
        id: movementId,
        product_id: item.product_id,
        type: "Entrée" as const,
        quantity: item.qty,
        time: created_at,
        note: `Annulation Vente ${saleId.substring(0, 8)}`,
        user_id,
        entreprise_id
      };
      await writeOffline(tx, "stock_movements", "INSERT", movementPayload);
    }
  });

  // Déclencher la synchronisation en arrière-plan
  triggerSync().catch((err) => console.error("[Sync Error] background trigger failed:", err));

  return cancelSaleId;
}

/**
 * Calcule le delta de stock local non encore synchronisé avec le serveur Supabase
 * pour un produit donné afin de maintenir l'exactitude du stock affiché en local.
 */
export async function getLocalStockDelta(productId: string): Promise<number> {
  try {
    const outboxItems = await db.outbox.toArray();
    let delta = 0;
    for (const item of outboxItems) {
      if (
        item.table === "stock_movements" &&
        item.action === "INSERT" &&
        item.payload.product_id === productId
      ) {
        const qty = item.payload.quantity;
        if (item.payload.type === "Entrée") {
          delta += qty;
        } else {
          delta -= qty;
        }
      }
    }
    return delta;
  } catch (err) {
    console.error("Failed to calculate local stock delta:", err);
    return 0;
  }
}
