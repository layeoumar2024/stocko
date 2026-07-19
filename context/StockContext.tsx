"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  stock: number;
  threshold: number;
  unit: string;
  category: string;
  purchasePrice: number;
  sellPrice: number;
  status: "critical" | "low" | "stable";
}

export interface Movement {
  id: string;
  type: "Entrée" | "Sortie";
  productId: string;
  productName: string;
  quantity: number;
  time: string; // ISO string date
  note?: string;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  city: string;
  userName: string;
  email?: string;
}

export type SyncStatus = "synced" | "syncing" | "offline" | "offline-pending";

export interface SyncQueueItem {
  id: string;
  action: "ADD_PRODUCT" | "UPDATE_PRODUCT" | "DELETE_PRODUCT" | "ADD_MOVEMENT" | "UPDATE_PROFILE" | "IMPORT_PRODUCTS";
  payload: any;
  timestamp: number;
}

interface StockContextType {
  products: Product[];
  movements: Movement[];
  categories: string[];
  profile: CompanyProfile;
  user: User | null;
  syncStatus: SyncStatus;
  addProduct: (product: Omit<Product, "id" | "status">) => Promise<void>;
  updateProduct: (id: string, updatedFields: Partial<Omit<Product, "id">>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMovement: (productId: string, type: "Entrée" | "Sortie", quantity: number, note?: string, date?: string) => Promise<void>;
  updateProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  importProducts: (newProducts: Omit<Product, "id" | "status">[], clearExisting?: boolean) => Promise<void>;
  triggerSync: () => Promise<void>;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

const initialCategories = ["Alimentation", "Hygiène", "Boissons", "Matériaux", "Divers"];

const initialProfile: CompanyProfile = {
  name: "Ma Boutique",
  sector: "Divers / Autre",
  city: "Ouagadougou",
  userName: "Utilisateur",
  email: "",
};

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [profile, setProfile] = useState<CompanyProfile>(initialProfile);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  
  const isSyncingRef = useRef(false);

  // Helper to determine product status
  const calculateStatus = (stock: number, threshold: number): "critical" | "low" | "stable" => {
    if (stock <= threshold / 2) return "critical";
    if (stock <= threshold) return "low";
    return "stable";
  };

  // Helper to generate a temporary unique ID for offline objects
  const generateTempId = (prefix: string = "temp") => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  // Helper to check if an error is network related
  const isNetworkError = (error: any): boolean => {
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
  };

  // Helper to save data with localStorage persistence
  const saveProducts = (newProds: Product[]) => {
    setProducts(newProds);
    localStorage.setItem("stocko_products", JSON.stringify(newProds));
  };

  const saveMovements = (newMovs: Movement[]) => {
    setMovements(newMovs);
    localStorage.setItem("stocko_movements", JSON.stringify(newMovs));
  };

  const saveProfile = (newProfile: CompanyProfile) => {
    setProfile(newProfile);
    localStorage.setItem("stocko_profile", JSON.stringify(newProfile));
  };

  const saveQueue = (newQueue: SyncQueueItem[]) => {
    setSyncQueue(newQueue);
    localStorage.setItem("stocko_sync_queue", JSON.stringify(newQueue));
  };

  // Helper to get active user
  const getActiveUser = async (): Promise<User | null> => {
    if (user) return user;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  };

  // Fetch fresh data from Supabase server
  const loadFreshDataFromServer = async (userId: string, userEmail?: string) => {
    try {
      // 1. Fetch profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profData) {
        const updatedProfile = {
          name: profData.name,
          sector: profData.sector || "Divers / Autre",
          city: profData.city || "Ouagadougou",
          userName: profData.user_name || "Utilisateur",
          email: profData.email || userEmail || "",
        };
        saveProfile(updatedProfile);
      } else {
        // Create fallback profile in DB
        const fallbackProfile = {
          name: "Ma Boutique",
          sector: "Divers / Autre",
          city: "Ouagadougou",
          userName: "Utilisateur",
          email: userEmail || "",
        };
        
        await supabase.from("profiles").insert({
          id: userId,
          name: fallbackProfile.name,
          sector: fallbackProfile.sector,
          city: fallbackProfile.city,
          user_name: fallbackProfile.userName,
          email: fallbackProfile.email,
        });
        
        saveProfile(fallbackProfile);
      }

      // 2. Fetch products
      const { data: prodsData } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (prodsData) {
        const mappedProds: Product[] = prodsData.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          threshold: p.threshold,
          unit: p.unit || "pièces",
          category: p.category || "Divers",
          purchasePrice: Number(p.purchase_price),
          sellPrice: Number(p.sell_price),
          status: calculateStatus(p.stock, p.threshold),
        }));
        saveProducts(mappedProds);
      }

      // 3. Fetch movements
      const { data: movsData } = await supabase
        .from("movements")
        .select(`
          id,
          type,
          product_id,
          quantity,
          time,
          note,
          products ( name )
        `)
        .order("time", { ascending: false });

      if (movsData) {
        const mappedMovs: Movement[] = movsData.map((m) => ({
          id: m.id,
          type: m.type as "Entrée" | "Sortie",
          productId: m.product_id,
          productName: (m.products as any)?.name || "Produit inconnu",
          quantity: m.quantity,
          time: m.time,
          note: m.note || undefined,
        }));
        saveMovements(mappedMovs);
      }
    } catch (e) {
      console.error("Failed to load fresh data from server:", e);
      throw e;
    }
  };

  // Sync engine: processes the queue sequentially
  const processSyncQueue = async (userId: string): Promise<boolean> => {
    const queueStr = localStorage.getItem("stocko_sync_queue");
    if (!queueStr) return true;
    let queue: SyncQueueItem[] = JSON.parse(queueStr);
    if (queue.length === 0) return true;

    console.log(`[Sync Engine] Processing ${queue.length} items...`);

    while (queue.length > 0) {
      const item = queue[0];

      if (typeof window !== "undefined" && !navigator.onLine) {
        console.log("[Sync Engine] Offline detected, pausing sync.");
        return false;
      }

      try {
        if (item.action === "ADD_PRODUCT") {
          const { tempId, name, stock, threshold, unit, category, purchasePrice, sellPrice } = item.payload;
          
          const { data, error } = await supabase
            .from("products")
            .insert({
              profile_id: userId,
              name,
              stock,
              threshold,
              unit,
              category,
              purchase_price: purchasePrice,
              sell_price: sellPrice,
            })
            .select()
            .single();

          if (error) {
            if (isNetworkError(error)) throw error;
            console.error("[Sync Engine] DB error adding product, skipping item:", error.message);
          } else if (data) {
            const realId = data.id;

            // Replace tempId with realId in local products
            const currentProdsStr = localStorage.getItem("stocko_products");
            if (currentProdsStr) {
              const prods: Product[] = JSON.parse(currentProdsStr);
              const updated = prods.map((p) =>
                p.id === tempId ? { ...p, id: realId, status: calculateStatus(p.stock, p.threshold) } : p
              );
              saveProducts(updated);
            }

            // Replace tempId with realId in local movements
            const currentMovsStr = localStorage.getItem("stocko_movements");
            if (currentMovsStr) {
              const movs: Movement[] = JSON.parse(currentMovsStr);
              const updated = movs.map((m) =>
                m.productId === tempId ? { ...m, productId: realId } : m
              );
              saveMovements(updated);
            }

            // Update remaining queue payloads containing this tempId
            queue = queue.map((q) => {
              if (q.action === "UPDATE_PRODUCT" && q.payload.id === tempId) {
                return { ...q, payload: { ...q.payload, id: realId } };
              }
              if (q.action === "DELETE_PRODUCT" && q.payload.id === tempId) {
                return { ...q, payload: { ...q.payload, id: realId } };
              }
              if (q.action === "ADD_MOVEMENT" && q.payload.productId === tempId) {
                return { ...q, payload: { ...q.payload, productId: realId } };
              }
              return q;
            });
          }
        } 
        else if (item.action === "UPDATE_PRODUCT") {
          const { id, updatedFields } = item.payload;
          
          if (!id.startsWith("temp-")) {
            const dbFields: any = {};
            if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
            if (updatedFields.stock !== undefined) dbFields.stock = updatedFields.stock;
            if (updatedFields.threshold !== undefined) dbFields.threshold = updatedFields.threshold;
            if (updatedFields.unit !== undefined) dbFields.unit = updatedFields.unit;
            if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
            if (updatedFields.purchasePrice !== undefined) dbFields.purchase_price = updatedFields.purchasePrice;
            if (updatedFields.sellPrice !== undefined) dbFields.sell_price = updatedFields.sellPrice;

            const { error } = await supabase.from("products").update(dbFields).eq("id", id);
            if (error) {
              if (isNetworkError(error)) throw error;
              console.error("[Sync Engine] DB error updating product, skipping:", error.message);
            }
          }
        } 
        else if (item.action === "DELETE_PRODUCT") {
          const { id } = item.payload;
          
          if (!id.startsWith("temp-")) {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (error) {
              if (isNetworkError(error)) throw error;
              console.error("[Sync Engine] DB error deleting product, skipping:", error.message);
            }
          }
        } 
        else if (item.action === "ADD_MOVEMENT") {
          const { tempId, productId, type, quantity, note, time } = item.payload;
          
          if (!productId.startsWith("temp-")) {
            // 1. Fetch current product stock from server to apply relative change
            const { data: serverProd, error: fetchErr } = await supabase
              .from("products")
              .select("stock")
              .eq("id", productId)
              .single();

            if (fetchErr) {
              if (isNetworkError(fetchErr)) throw fetchErr;
              console.error("[Sync Engine] DB error fetching product stock for movement:", fetchErr.message);
            } else if (serverProd) {
              const change = type === "Entrée" ? quantity : -quantity;
              const newStock = Math.max(0, serverProd.stock + change);

              // 2. Update stock on server
              const { error: updateErr } = await supabase
                .from("products")
                .update({ stock: newStock })
                .eq("id", productId);

              if (updateErr) {
                if (isNetworkError(updateErr)) throw updateErr;
                console.error("[Sync Engine] DB error updating product stock for movement:", updateErr.message);
              }
            }

            // 3. Insert movement record
            const { data, error } = await supabase
              .from("movements")
              .insert({
                product_id: productId,
                type,
                quantity,
                time,
                note: note || null,
              })
              .select()
              .single();

            if (error) {
              if (isNetworkError(error)) throw error;
              console.error("[Sync Engine] DB error inserting movement, skipping:", error.message);
            } else if (data) {
              const realMovId = data.id;
              const currentMovsStr = localStorage.getItem("stocko_movements");
              if (currentMovsStr) {
                const movs: Movement[] = JSON.parse(currentMovsStr);
                const updated = movs.map((m) => (m.id === tempId ? { ...m, id: realMovId } : m));
                saveMovements(updated);
              }
            }
          }
        } 
        else if (item.action === "UPDATE_PROFILE") {
          const { name, sector, city, userName, email } = item.payload;
          const dbFields: any = {};
          if (name !== undefined) dbFields.name = name;
          if (sector !== undefined) dbFields.sector = sector;
          if (city !== undefined) dbFields.city = city;
          if (userName !== undefined) dbFields.user_name = userName;
          if (email !== undefined) dbFields.email = email;

          const { error } = await supabase.from("profiles").update(dbFields).eq("id", userId);
          if (error) {
            if (isNetworkError(error)) throw error;
            console.error("[Sync Engine] DB error updating profile, skipping:", error.message);
          }
        } 
        else if (item.action === "IMPORT_PRODUCTS") {
          const { newProducts, clearExisting } = item.payload;

          if (clearExisting) {
            const { error: delError } = await supabase
              .from("products")
              .delete()
              .eq("profile_id", userId);

            if (delError) {
              if (isNetworkError(delError)) throw delError;
              console.error("[Sync Engine] DB error clearing products on import:", delError.message);
            }
          }

          if (newProducts.length > 0) {
            const dbRows = newProducts.map((p: any) => ({
              profile_id: userId,
              name: p.name,
              stock: p.stock,
              threshold: p.threshold,
              unit: p.unit,
              category: p.category,
              purchase_price: p.purchasePrice,
              sell_price: p.sellPrice,
            }));

            const { error } = await supabase.from("products").insert(dbRows);
            if (error) {
              if (isNetworkError(error)) throw error;
              console.error("[Sync Engine] DB error bulk importing products, skipping:", error.message);
            }
          }
        }

        // Remove item from local queue on success
        queue.shift();
        saveQueue([...queue]);
      } catch (err: any) {
        console.error("[Sync Engine] Network error during processing, pausing queue:", err);
        return false;
      }
    }

    console.log("[Sync Engine] Queue successfully cleared!");
    return true;
  };

  // Triggers the synchronization flow
  const triggerSync = async (userId: string, userEmail?: string) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncStatus("syncing");

    try {
      const success = await processSyncQueue(userId);
      if (success) {
        await loadFreshDataFromServer(userId, userEmail);
        setSyncStatus("synced");
      } else {
        setSyncStatus("offline-pending");
      }
    } catch (e) {
      console.error("[Sync Engine] Synchronization run failed:", e);
      setSyncStatus("offline-pending");
    } finally {
      isSyncingRef.current = false;
    }
  };

  // Exposes manualSync button to UI
  const manualSync = async () => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;
    await triggerSync(activeUser.id, activeUser.email || undefined);
  };

  // Core Session & Hydration logic
  useEffect(() => {
    let active = true;

    async function initSessionAndData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!active) return;

        if (session?.user) {
          setUser(session.user);

          // Fast UI Hydration from local storage
          const localProds = localStorage.getItem("stocko_products");
          const localMovs = localStorage.getItem("stocko_movements");
          const localProfile = localStorage.getItem("stocko_profile");
          const localQueue = localStorage.getItem("stocko_sync_queue");

          if (localProds) setProducts(JSON.parse(localProds));
          if (localMovs) setMovements(JSON.parse(localMovs));
          if (localProfile) setProfile(JSON.parse(localProfile));
          
          const parsedQueue: SyncQueueItem[] = localQueue ? JSON.parse(localQueue) : [];
          setSyncQueue(parsedQueue);
          setIsLoaded(true);

          if (typeof window !== "undefined" && navigator.onLine) {
            triggerSync(session.user.id, session.user.email || undefined);
          } else {
            setSyncStatus(parsedQueue.length > 0 ? "offline-pending" : "offline");
          }
        } else {
          setUser(null);
          setProducts([]);
          setMovements([]);
          setProfile(initialProfile);
          setSyncQueue([]);
          setIsLoaded(true);
          setSyncStatus("offline");
          
          // Clear caches on logout
          localStorage.removeItem("stocko_products");
          localStorage.removeItem("stocko_movements");
          localStorage.removeItem("stocko_profile");
          localStorage.removeItem("stocko_sync_queue");
        }
      } catch (e) {
        console.error("Initialization error:", e);
        setIsLoaded(true);
      }
    }

    initSessionAndData();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        if (session?.user) {
          setUser(session.user);
          
          const localProds = localStorage.getItem("stocko_products");
          const localMovs = localStorage.getItem("stocko_movements");
          const localProfile = localStorage.getItem("stocko_profile");
          const localQueue = localStorage.getItem("stocko_sync_queue");

          if (localProds) setProducts(JSON.parse(localProds));
          if (localMovs) setMovements(JSON.parse(localMovs));
          if (localProfile) setProfile(JSON.parse(localProfile));
          
          const parsedQueue: SyncQueueItem[] = localQueue ? JSON.parse(localQueue) : [];
          setSyncQueue(parsedQueue);
          setIsLoaded(true);

          if (typeof window !== "undefined" && navigator.onLine) {
            triggerSync(session.user.id, session.user.email || undefined);
          } else {
            setSyncStatus(parsedQueue.length > 0 ? "offline-pending" : "offline");
          }
        } else {
          setUser(null);
          setProducts([]);
          setMovements([]);
          setProfile(initialProfile);
          setSyncQueue([]);
          setIsLoaded(true);
          setSyncStatus("offline");
          
          localStorage.removeItem("stocko_products");
          localStorage.removeItem("stocko_movements");
          localStorage.removeItem("stocko_profile");
          localStorage.removeItem("stocko_sync_queue");
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const handleOnline = () => {
      console.log("[Connectivity] Device went online. Syncing queue...");
      triggerSync(user.id, user.email || undefined);
    };

    const handleOffline = () => {
      console.log("[Connectivity] Device went offline.");
      const queueStr = localStorage.getItem("stocko_sync_queue");
      const q = queueStr ? JSON.parse(queueStr) : [];
      setSyncStatus(q.length > 0 ? "offline-pending" : "offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  // Periodic queue retry check (every 15 seconds)
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const interval = setInterval(() => {
      const queueStr = localStorage.getItem("stocko_sync_queue");
      const q = queueStr ? JSON.parse(queueStr) : [];
      if (q.length > 0 && navigator.onLine && !isSyncingRef.current) {
        console.log("[Periodic Sync] Pending items found. Resuming sync...");
        triggerSync(user.id, user.email || undefined);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // State mutation wrappers
  const addProduct = async (prod: Omit<Product, "id" | "status">) => {
    const activeUser = await getActiveUser();

    const tempId = generateTempId("prod");
    const newProduct: Product = {
      id: tempId,
      name: prod.name,
      stock: prod.stock,
      threshold: prod.threshold,
      unit: prod.unit || "pièces",
      category: prod.category || "Divers",
      purchasePrice: Number(prod.purchasePrice),
      sellPrice: Number(prod.sellPrice),
      status: calculateStatus(prod.stock, prod.threshold),
    };

    const currentProds = [newProduct, ...products];
    saveProducts(currentProds);

    const queueItem: SyncQueueItem = {
      id: generateTempId("sync"),
      action: "ADD_PRODUCT",
      payload: {
        tempId,
        name: prod.name,
        stock: prod.stock,
        threshold: prod.threshold,
        unit: prod.unit,
        category: prod.category,
        purchasePrice: Number(prod.purchasePrice),
        sellPrice: Number(prod.sellPrice),
      },
      timestamp: Date.now(),
    };

    const newQueue = [...syncQueue, queueItem];
    saveQueue(newQueue);

    if (activeUser && navigator.onLine) {
      triggerSync(activeUser.id, activeUser.email || undefined);
    } else {
      setSyncStatus("offline-pending");
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Omit<Product, "id">>) => {
    const activeUser = await getActiveUser();

    const updatedProds = products.map((p) => {
      if (p.id === id) {
        const merged = { ...p, ...updatedFields };
        merged.status = calculateStatus(merged.stock, merged.threshold);
        return merged;
      }
      return p;
    });
    saveProducts(updatedProds);

    const queueItem: SyncQueueItem = {
      id: generateTempId("sync"),
      action: "UPDATE_PRODUCT",
      payload: {
        id,
        updatedFields,
      },
      timestamp: Date.now(),
    };

    const newQueue = [...syncQueue, queueItem];
    saveQueue(newQueue);

    if (activeUser && navigator.onLine) {
      triggerSync(activeUser.id, activeUser.email || undefined);
    } else {
      setSyncStatus("offline-pending");
    }
  };

  const deleteProduct = async (id: string) => {
    const activeUser = await getActiveUser();

    const filteredProds = products.filter((p) => p.id !== id);
    const filteredMovs = movements.filter((m) => m.productId !== id);
    saveProducts(filteredProds);
    saveMovements(filteredMovs);

    if (id.startsWith("temp-")) {
      // Remove temp product additions/updates from queue
      const newQueue = syncQueue.filter((q) => {
        if (q.action === "ADD_PRODUCT" && q.payload.tempId === id) return false;
        if (q.action === "UPDATE_PRODUCT" && q.payload.id === id) return false;
        if (q.action === "ADD_MOVEMENT" && q.payload.productId === id) return false;
        return true;
      });
      saveQueue(newQueue);
      setSyncStatus(newQueue.length > 0 ? "offline-pending" : "offline");
    } else {
      const queueItem: SyncQueueItem = {
        id: generateTempId("sync"),
        action: "DELETE_PRODUCT",
        payload: { id },
        timestamp: Date.now(),
      };

      const newQueue = [...syncQueue, queueItem];
      saveQueue(newQueue);

      if (activeUser && navigator.onLine) {
        triggerSync(activeUser.id, activeUser.email || undefined);
      } else {
        setSyncStatus("offline-pending");
      }
    }
  };

  const addMovement = async (productId: string, type: "Entrée" | "Sortie", quantity: number, note?: string, date?: string) => {
    const activeUser = await getActiveUser();

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const change = type === "Entrée" ? quantity : -quantity;
    const newStock = Math.max(0, product.stock + change);

    // Update product stock locally
    const updatedProds = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stock: newStock,
          status: calculateStatus(newStock, p.threshold),
        };
      }
      return p;
    });
    saveProducts(updatedProds);

    // Prepend movement locally
    const tempId = generateTempId("mov");
    const newMovement: Movement = {
      id: tempId,
      type,
      productId,
      productName: product.name,
      quantity,
      time: date ? new Date(date).toISOString() : new Date().toISOString(),
      note: note || undefined,
    };
    const updatedMovs = [newMovement, ...movements];
    saveMovements(updatedMovs);

    const queueItem: SyncQueueItem = {
      id: generateTempId("sync"),
      action: "ADD_MOVEMENT",
      payload: {
        tempId,
        productId,
        type,
        quantity,
        note,
        time: newMovement.time,
      },
      timestamp: Date.now(),
    };

    const newQueue = [...syncQueue, queueItem];
    saveQueue(newQueue);

    if (activeUser && navigator.onLine) {
      triggerSync(activeUser.id, activeUser.email || undefined);
    } else {
      setSyncStatus("offline-pending");
    }
  };

  const updateProfile = async (newProfile: Partial<CompanyProfile>) => {
    const activeUser = await getActiveUser();

    const updatedProfile = { ...profile, ...newProfile };
    saveProfile(updatedProfile);

    const queueItem: SyncQueueItem = {
      id: generateTempId("sync"),
      action: "UPDATE_PROFILE",
      payload: newProfile,
      timestamp: Date.now(),
    };

    const newQueue = [...syncQueue, queueItem];
    saveQueue(newQueue);

    if (activeUser && navigator.onLine) {
      triggerSync(activeUser.id, activeUser.email || undefined);
    } else {
      setSyncStatus("offline-pending");
    }
  };

  const importProducts = async (newProds: Omit<Product, "id" | "status">[], clearExisting = false) => {
    const activeUser = await getActiveUser();

    const mapped = newProds.map((p) => ({
      id: generateTempId("prod"),
      name: p.name,
      stock: p.stock,
      threshold: p.threshold,
      unit: p.unit || "pièces",
      category: p.category || "Divers",
      purchasePrice: Number(p.purchasePrice),
      sellPrice: Number(p.sellPrice),
      status: calculateStatus(p.stock, p.threshold),
    }));

    if (clearExisting) {
      saveProducts(mapped);
      saveMovements([]);
    } else {
      saveProducts([...mapped, ...products]);
    }

    const queueItem: SyncQueueItem = {
      id: generateTempId("sync"),
      action: "IMPORT_PRODUCTS",
      payload: {
        newProducts: newProds,
        clearExisting,
      },
      timestamp: Date.now(),
    };

    const newQueue = [...syncQueue, queueItem];
    saveQueue(newQueue);

    if (activeUser && navigator.onLine) {
      triggerSync(activeUser.id, activeUser.email || undefined);
    } else {
      setSyncStatus("offline-pending");
    }
  };

  return (
    <StockContext.Provider
      value={{
        products,
        movements,
        categories: initialCategories,
        profile,
        user,
        syncStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        addMovement,
        updateProfile,
        importProducts,
        triggerSync: manualSync,
      }}
    >
      {isLoaded ? (
        children
      ) : (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center font-sans">
          <span className="text-[#8A7F6E] font-semibold">Chargement...</span>
        </div>
      )}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error("useStock must be used within a StockProvider");
  }
  return context;
}
