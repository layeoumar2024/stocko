import { db, OutboxItem } from "./db";
import { supabase } from "@/lib/supabase";

// Helper checking for connection errors
function isNetworkError(error: any): boolean {
  if (typeof window !== "undefined" && !navigator.onLine) return true;
  const msg = error?.message?.toLowerCase() || "";
  return msg.includes("failed to fetch") || 
         msg.includes("network error") || 
         msg.includes("network request failed") ||
         msg.includes("load failed") ||
         error?.status === 0 ||
         error?.code === "PGRST" ||
         error?.status === 502 ||
         error?.status === 503 ||
         error?.status === 504;
}

/**
 * Enregistre une opération dans Dexie et la met en file d'attente dans l'outbox,
 * le tout dans une transaction atomique.
 */
export async function writeOffline(
  tx: any,
  table: "sales" | "sale_items" | "stock_movements",
  action: "INSERT" | "UPDATE" | "DELETE",
  payload: any
): Promise<void> {
  // 1. Écrit localement dans la table IndexedDB correspondante
  if (action === "INSERT") {
    await tx.table(table).add(payload);
  } else if (action === "UPDATE") {
    await tx.table(table).put(payload);
  } else if (action === "DELETE") {
    await tx.table(table).delete(payload.id);
  }

  // 2. Ajoute l'opération à l'outbox
  const outboxItem: OutboxItem = {
    table,
    action,
    payload,
    timestamp: Date.now()
  };
  await tx.outbox.add(outboxItem);
}

/**
 * Traite la file d'attente de l'outbox IndexedDB et envoie les requêtes à Supabase.
 */
export async function triggerSync(): Promise<void> {
  if (typeof window !== "undefined" && !navigator.onLine) {
    console.log("[Sync Worker] Disconnected. Sync skipped.");
    return;
  }

  const item = await db.outbox.orderBy("id").first();
  if (!item) {
    console.log("[Sync Worker] Outbox empty. Synced.");
    return;
  }

  try {
    const { table, action, payload } = item;
    let supabaseTable: string = table;
    if (table === "stock_movements") {
      supabaseTable = "movements";
    }

    if (action === "INSERT") {
      let insertPayload = { ...payload };
      
      // Mapper les colonnes de stock_movements vers la table movements de Supabase
      if (table === "stock_movements") {
        insertPayload = {
          id: payload.id,
          product_id: payload.product_id,
          type: payload.type,
          quantity: payload.quantity,
          time: payload.time,
          note: payload.note || null,
          entreprise_id: payload.entreprise_id || null
        };
      }

      const { error } = await supabase.from(supabaseTable).insert(insertPayload);
      if (error) {
        if (isNetworkError(error)) {
          throw error; // Arrête la synchro pour réessayer plus tard
        }
        console.error(`[Sync Worker] Permanent error on ${table} INSERT. Skipping item:`, error.message);
      }
    } 
    else if (action === "UPDATE") {
      const { error } = await supabase.from(supabaseTable).update(payload).eq("id", payload.id);
      if (error) {
        if (isNetworkError(error)) throw error;
        console.error(`[Sync Worker] Permanent error on ${table} UPDATE. Skipping item:`, error.message);
      }
    } 
    else if (action === "DELETE") {
      const { error } = await supabase.from(supabaseTable).delete().eq("id", payload.id);
      if (error) {
        if (isNetworkError(error)) throw error;
        console.error(`[Sync Worker] Permanent error on ${table} DELETE. Skipping item:`, error.message);
      }
    }

    // Supprime l'élément de l'outbox une fois qu'il a été traité avec succès (ou ignoré suite à une erreur SQL)
    await db.outbox.delete(item.id!);

    // Traite le message suivant de manière récursive
    await triggerSync();
  } catch (error) {
    console.warn("[Sync Worker] Sync paused due to network error:", error);
  }
}
