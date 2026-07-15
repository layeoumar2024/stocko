"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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

interface StockContextType {
  products: Product[];
  movements: Movement[];
  categories: string[];
  profile: CompanyProfile;
  user: User | null;
  addProduct: (product: Omit<Product, "id" | "status">) => Promise<void>;
  updateProduct: (id: string, updatedFields: Partial<Omit<Product, "id">>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addMovement: (productId: string, type: "Entrée" | "Sortie", quantity: number, note?: string, date?: string) => Promise<void>;
  updateProfile: (profile: Partial<CompanyProfile>) => Promise<void>;
  importProducts: (newProducts: Omit<Product, "id" | "status">[], clearExisting?: boolean) => Promise<void>;
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

  // Helper to determine product status
  const calculateStatus = (stock: number, threshold: number): "critical" | "low" | "stable" => {
    if (stock <= threshold / 2) return "critical";
    if (stock <= threshold) return "low";
    return "stable";
  };

  // Helper to get active user (with session fallback to avoid React state race conditions)
  const getActiveUser = async (): Promise<User | null> => {
    if (user) return user;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  };

  // Load from Supabase on auth state change
  useEffect(() => {
    let active = true;

    async function loadData(userId: string, userEmail?: string) {
      try {
        // 1. Fetch profile
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (active) {
          if (profData) {
            setProfile({
              name: profData.name,
              sector: profData.sector || "Divers / Autre",
              city: profData.city || "Ouagadougou",
              userName: profData.user_name || "Utilisateur",
              email: profData.email || userEmail || "",
            });
          } else {
            // If profile does not exist in DB yet, create a default one
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
            
            setProfile(fallbackProfile);
          }
        }

        // 2. Fetch products
        const { data: prodsData } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });

        if (active && prodsData) {
          const mappedProds = prodsData.map((p) => ({
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
          setProducts(mappedProds);
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

        if (active && movsData) {
          const mappedMovs = movsData.map((m) => ({
            id: m.id,
            type: m.type as "Entrée" | "Sortie",
            productId: m.product_id,
            productName: (m.products as any)?.name || "Produit inconnu",
            quantity: m.quantity,
            time: m.time,
            note: m.note || undefined,
          }));
          setMovements(mappedMovs);
        }
      } catch (e) {
        console.error("Failed to load data from Supabase:", e);
      } finally {
        if (active) {
          setIsLoaded(true);
        }
      }
    }

    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) {
        if (session?.user) {
          setUser(session.user);
          loadData(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProducts([]);
          setMovements([]);
          setProfile(initialProfile);
          setIsLoaded(true);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        if (session?.user) {
          setUser(session.user);
          loadData(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProducts([]);
          setMovements([]);
          setProfile(initialProfile);
          setIsLoaded(true);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const addProduct = async (prod: Omit<Product, "id" | "status">) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    const { data, error } = await supabase
      .from("products")
      .insert({
        profile_id: activeUser.id,
        name: prod.name,
        stock: prod.stock,
        threshold: prod.threshold,
        unit: prod.unit,
        category: prod.category,
        purchase_price: prod.purchasePrice,
        sell_price: prod.sellPrice,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding product:", error.message);
      throw error;
    }

    if (data) {
      const newProduct: Product = {
        id: data.id,
        name: data.name,
        stock: data.stock,
        threshold: data.threshold,
        unit: data.unit || "pièces",
        category: data.category || "Divers",
        purchasePrice: Number(data.purchase_price),
        sellPrice: Number(data.sell_price),
        status: calculateStatus(data.stock, data.threshold),
      };
      setProducts((prev) => [newProduct, ...prev]);
    }
  };

  const updateProduct = async (id: string, updatedFields: Partial<Omit<Product, "id">>) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    const dbFields: any = {};
    if (updatedFields.name !== undefined) dbFields.name = updatedFields.name;
    if (updatedFields.stock !== undefined) dbFields.stock = updatedFields.stock;
    if (updatedFields.threshold !== undefined) dbFields.threshold = updatedFields.threshold;
    if (updatedFields.unit !== undefined) dbFields.unit = updatedFields.unit;
    if (updatedFields.category !== undefined) dbFields.category = updatedFields.category;
    if (updatedFields.purchasePrice !== undefined) dbFields.purchase_price = updatedFields.purchasePrice;
    if (updatedFields.sellPrice !== undefined) dbFields.sell_price = updatedFields.sellPrice;

    const { error } = await supabase
      .from("products")
      .update(dbFields)
      .eq("id", id);

    if (error) {
      console.error("Error updating product:", error.message);
      throw error;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const merged = { ...p, ...updatedFields };
          merged.status = calculateStatus(merged.stock, merged.threshold);
          return merged;
        }
        return p;
      })
    );
  };

  const deleteProduct = async (id: string) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error.message);
      throw error;
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    setMovements((prev) => prev.filter((m) => m.productId !== id));
  };

  const addMovement = async (productId: string, type: "Entrée" | "Sortie", quantity: number, note?: string, date?: string) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const change = type === "Entrée" ? quantity : -quantity;
    const newStock = Math.max(0, product.stock + change);

    // 1. Update product stock in DB
    const { error: prodError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", productId);

    if (prodError) {
      console.error("Error updating product stock for movement:", prodError.message);
      throw prodError;
    }

    // 2. Insert movement record in DB
    const { data: movData, error: movError } = await supabase
      .from("movements")
      .insert({
        product_id: productId,
        type,
        quantity,
        time: date ? new Date(date).toISOString() : new Date().toISOString(),
        note: note || null,
      })
      .select()
      .single();

    if (movError) {
      console.error("Error adding movement record:", movError.message);
      throw movError;
    }

    if (movData) {
      // Update local product state
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            return {
              ...p,
              stock: newStock,
              status: calculateStatus(newStock, p.threshold),
            };
          }
          return p;
        })
      );

      // Add local movement state
      const newMovement: Movement = {
        id: movData.id,
        type,
        productId,
        productName: product.name,
        quantity,
        time: movData.time,
        note: movData.note || undefined,
      };
      setMovements((prev) => [newMovement, ...prev]);
    }
  };

  const updateProfile = async (newProfile: Partial<CompanyProfile>) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    const dbFields: any = {};
    if (newProfile.name !== undefined) dbFields.name = newProfile.name;
    if (newProfile.sector !== undefined) dbFields.sector = newProfile.sector;
    if (newProfile.city !== undefined) dbFields.city = newProfile.city;
    if (newProfile.userName !== undefined) dbFields.user_name = newProfile.userName;
    if (newProfile.email !== undefined) dbFields.email = newProfile.email;

    const { error } = await supabase
      .from("profiles")
      .update(dbFields)
      .eq("id", activeUser.id);

    if (error) {
      console.error("Error updating profile:", error.message);
      throw error;
    }

    setProfile((prev) => ({ ...prev, ...newProfile }));
  };

  const importProducts = async (newProds: Omit<Product, "id" | "status">[], clearExisting = false) => {
    const activeUser = await getActiveUser();
    if (!activeUser) return;

    if (clearExisting) {
      const { error: delError } = await supabase
        .from("products")
        .delete()
        .eq("profile_id", activeUser.id);

      if (delError) {
        console.error("Error clearing existing products:", delError.message);
        throw delError;
      }
    }

    if (newProds.length === 0) {
      if (clearExisting) {
        setProducts([]);
        setMovements([]);
      }
      return;
    }

    const dbRows = newProds.map((p) => ({
      profile_id: activeUser.id,
      name: p.name,
      stock: p.stock,
      threshold: p.threshold,
      unit: p.unit,
      category: p.category,
      purchase_price: p.purchasePrice,
      sell_price: p.sellPrice,
    }));

    const { data, error } = await supabase
      .from("products")
      .insert(dbRows)
      .select();

    if (error) {
      console.error("Error bulk importing products:", error.message);
      throw error;
    }

    if (data) {
      const mapped = data.map((d) => ({
        id: d.id,
        name: d.name,
        stock: d.stock,
        threshold: d.threshold,
        unit: d.unit || "pièces",
        category: d.category || "Divers",
        purchasePrice: Number(d.purchase_price),
        sellPrice: Number(d.sell_price),
        status: calculateStatus(d.stock, d.threshold),
      }));

      setProducts((prev) => {
        if (clearExisting) return mapped;
        return [...mapped, ...prev];
      });

      if (clearExisting) {
        setMovements([]);
      }
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
        addProduct,
        updateProduct,
        deleteProduct,
        addMovement,
        updateProfile,
        importProducts,
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
