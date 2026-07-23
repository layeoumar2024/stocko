"use client";

import React, { useState } from "react";
import { db } from "@/modules/sync/db";
import { createSale, cancelSale, getLocalStockDelta } from "@/modules/ventes/ventes.service";
import { triggerSync } from "@/modules/sync/sync.service";
import { useStock } from "@/context/StockContext";
import { Play, CheckCircle, XCircle, Info, RefreshCw } from "lucide-react";

interface TestResult {
  name: string;
  status: "idle" | "running" | "success" | "failed";
  message: string;
}

export default function VentesTestPage() {
  const { products } = useStock();
  const [tests, setTests] = useState<TestResult[]>([
    {
      name: "10 Ventes enchaînées en mode avion",
      status: "idle",
      message: "En attente du lancement..."
    },
    {
      name: "Réseau coupé pendant l'enregistrement",
      status: "idle",
      message: "En attente du lancement..."
    },
    {
      name: "Vente puis Annulation (Restitution Stock)",
      status: "idle",
      message: "En attente du lancement..."
    }
  ]);

  const runTest = async (index: number) => {
    // Clone states
    const updatedTests = [...tests];
    updatedTests[index] = { ...updatedTests[index], status: "running", message: "Exécution..." };
    setTests(updatedTests);

    try {
      if (index === 0) {
        // --- TEST 1: 10 VENTES EN MODE AVION ---
        // 1. Vider les tables locales pour le test
        await db.sales.clear();
        await db.sale_items.clear();
        await db.stock_movements.clear();
        await db.outbox.clear();

        // 2. Simuler le mode avion
        const originalOnLine = navigator.onLine;
        Object.defineProperty(navigator, "onLine", {
          value: false,
          writable: true,
          configurable: true
        });

        // 3. Enregistrer 10 ventes
        const prod = products[0] || { id: "test-prod-id", sellPrice: 100, purchasePrice: 50 };
        for (let i = 0; i < 10; i++) {
          await createSale(
            {
              customer_id: null,
              payment_method: "cash",
              amount_paid: prod.sellPrice,
              items: [{ product_id: prod.id, qty: 1, unit_price: prod.sellPrice, cost_price: prod.purchasePrice }]
            },
            null,
            null,
            "test-device"
          );
        }

        // Vérifier qu'elles sont là localement
        const localSalesCount = await db.sales.count();
        const outboxCount = await db.outbox.count();

        if (localSalesCount !== 10) {
          throw new Error(`Attendu 10 ventes locales, trouvé ${localSalesCount}`);
        }

        // Restaurer la connexion réseau
        Object.defineProperty(navigator, "onLine", {
          value: originalOnLine,
          writable: true,
          configurable: true
        });

        // Déclencher la synchro (simulation de reconnexion)
        await triggerSync();

        // L'outbox doit maintenant être vide
        const outboxCountAfter = await db.outbox.count();
        if (outboxCountAfter !== 0) {
          throw new Error(`Attendu outbox vide après synchro, reste ${outboxCountAfter} éléments`);
        }

        setTests(prev => {
          const t = [...prev];
          t[0] = {
            status: "success",
            name: t[0].name,
            message: `Succès : 10 ventes enregistrées localement (Outbox initiale : ${outboxCount} items). Synchro réussie, outbox vidée.`
          };
          return t;
        });

      } else if (index === 1) {
        // --- TEST 2: RÉSEAU COUPÉ PENDANT L'ENREGISTREMENT ---
        await db.sales.clear();
        await db.outbox.clear();

        // Simuler hors-ligne
        const originalOnLine = navigator.onLine;
        Object.defineProperty(navigator, "onLine", {
          value: false,
          writable: true,
          configurable: true
        });

        const prod = products[0] || { id: "test-prod-id", sellPrice: 100, purchasePrice: 50 };
        await createSale(
          {
            customer_id: null,
            payment_method: "mobile_money",
            amount_paid: prod.sellPrice,
            items: [{ product_id: prod.id, qty: 2, unit_price: prod.sellPrice, cost_price: prod.purchasePrice }]
          },
          null,
          null,
          "test-device"
        );

        // Vérifier la présence en base locale
        const localSales = await db.sales.toArray();
        const outboxItems = await db.outbox.toArray();

        // Restaurer réseau
        Object.defineProperty(navigator, "onLine", {
          value: originalOnLine,
          writable: true,
          configurable: true
        });

        if (localSales.length === 1 && outboxItems.length > 0) {
          setTests(prev => {
            const t = [...prev];
            t[1] = {
              status: "success",
              name: t[1].name,
              message: `Succès : Vente conservée localement avec succès dans IndexedDB. Vente ID: ${localSales[0].id}`
            };
            return t;
          });
        } else {
          throw new Error("La vente n'a pas été conservée localement");
        }

      } else if (index === 2) {
        // --- TEST 3: VENTE PUIS ANNULATION (STOCK RESTITUÉ) ---
        if (products.length === 0) {
          throw new Error("Aucun produit disponible dans le catalogue pour tester le stock.");
        }
        
        await db.sales.clear();
        await db.stock_movements.clear();
        await db.outbox.clear();

        const testProduct = products[0];
        
        // 1. Calculer le stock initial disponible
        const initialDelta = await getLocalStockDelta(testProduct.id);
        const initialStock = testProduct.stock + initialDelta;

        // 2. Créer une vente de 5 unités
        const saleId = await createSale(
          {
            customer_id: null,
            payment_method: "cash",
            amount_paid: testProduct.sellPrice * 5,
            items: [{ product_id: testProduct.id, qty: 5, unit_price: testProduct.sellPrice, cost_price: testProduct.purchasePrice }]
          },
          null,
          null,
          "test-device"
        );

        // 3. Calculer le stock après vente
        const afterSaleDelta = await getLocalStockDelta(testProduct.id);
        const afterSaleStock = testProduct.stock + afterSaleDelta;

        if (afterSaleStock !== initialStock - 5) {
          throw new Error(`Attendu stock de ${initialStock - 5}, trouvé ${afterSaleStock}`);
        }

        // 4. Annuler la vente
        await cancelSale(saleId, null, null);

        // 5. Calculer le stock final
        const finalDelta = await getLocalStockDelta(testProduct.id);
        const finalStock = testProduct.stock + finalDelta;

        if (finalStock !== initialStock) {
          throw new Error(`Attendu stock final de ${initialStock}, trouvé ${finalStock}`);
        }

        setTests(prev => {
          const t = [...prev];
          t[2] = {
            status: "success",
            name: t[2].name,
            message: `Succès : Stock initial: ${initialStock} | Après vente (-5): ${afterSaleStock} | Après annulation: ${finalStock}. Stock restitué à 100%.`
          };
          return t;
        });
      }
    } catch (err: any) {
      setTests(prev => {
        const t = [...prev];
        t[index] = {
          status: "failed",
          name: t[index].name,
          message: `Échec : ${err.message}`
        };
        return t;
      });
    }
  };

  const runAllTests = async () => {
    for (let i = 0; i < tests.length; i++) {
      await runTest(i);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg p-6 font-sans select-none animate-fade-in">
      <div className="max-w-3xl mx-auto bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-brand-blue tracking-tight">Tests Unitaires & Logique Offline</h1>
          <p className="text-xs text-[#8A7F6E]">Exécutez les suites de tests pour valider le module de Ventes et de Synchro offline.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={runAllTests}
            className="bg-brand-accent hover:bg-brand-accent-hover text-brand-blue px-5 py-3 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <Play className="w-4 h-4" />
            Lancer tous les tests
          </button>
        </div>

        <div className="space-y-3 pt-2">
          {tests.map((test, idx) => (
            <div key={idx} className="border border-[#E5E0D5]/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-brand-blue flex items-center gap-2">
                  {test.status === "success" && <CheckCircle className="w-4 h-4 text-[#0A8543]" />}
                  {test.status === "failed" && <XCircle className="w-4 h-4 text-[#D9381E]" />}
                  {test.status === "running" && <RefreshCw className="w-4 h-4 text-brand-accent animate-spin" />}
                  {test.status === "idle" && <Info className="w-4 h-4 text-[#8A7F6E]" />}
                  {test.name}
                </h3>
                <p className="text-xs text-[#8A7F6E] leading-relaxed">{test.message}</p>
              </div>

              <button
                onClick={() => runTest(idx)}
                disabled={test.status === "running"}
                className="bg-[#FAF6EE] border border-[#E5E0D5] hover:bg-[#FAF6EE]/50 px-4 py-2 rounded-lg text-xs font-bold text-brand-blue cursor-pointer disabled:opacity-50"
              >
                Lancer
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
