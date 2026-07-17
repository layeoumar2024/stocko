"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Store, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Sparkles,
  Building2,
  MapPin,
  UserCheck,
  ArrowRight,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { useStock } from "@/context/StockContext";
import { supabase } from "@/lib/supabase";

// Sector choices for onboarding
const SECTOR_CHOICES = [
  "Alimentation & Supérettes",
  "Quincaillerie & Matériaux",
  "Hygiène & Cosmétiques",
  "Boissons & Brasseries",
  "Boutique de Prêt-à-porter",
  "Électronique & Électroménager",
  "Divers / Autre"
];

// Sample parsed products to simulate Excel import
const MOCK_EXCEL_PRODUCTS = [
  { name: "Sucre Blond SN-SOSUCO 50kg", category: "Alimentation", stock: 25, threshold: 5, unit: "sacs", purchasePrice: 22000, sellPrice: 24500 },
  { name: "Farine de blé Grand Moulin 25kg", category: "Alimentation", stock: 15, threshold: 4, unit: "sacs", purchasePrice: 12500, sellPrice: 14000 },
  { name: "Huile de palme d'or 5L", category: "Alimentation", stock: 40, threshold: 10, unit: "bidons", purchasePrice: 4200, sellPrice: 5000 },
  { name: "Savon de Marseille extra (carton)", category: "Hygiène", stock: 12, threshold: 3, unit: "cartons", purchasePrice: 8000, sellPrice: 9500 },
  { name: "Boisson Youki Tonic 24x33cl", category: "Boissons", stock: 30, threshold: 8, unit: "cartons", purchasePrice: 6500, sellPrice: 8000 }
];

export default function ConnexionPage() {
  const router = useRouter();
  const { updateProfile, importProducts, categories } = useStock();

  // Mode: 'login' (classic), 'onboarding', or 'reset_password'
  const [mode, setMode] = useState<"login" | "onboarding" | "reset_password">("login");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Credentials, 2: Company Setup, 3: Inventory Setup, 4: Success

  // Form States - Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form States - Onboarding Company
  const [storeName, setStoreName] = useState("");
  const [storeSector, setStoreSector] = useState("Alimentation & Supérettes");
  const [storeCity, setStoreCity] = useState("Ouagadougou");
  const [userName, setUserName] = useState("");

  // Form States - Inventory Setup
  const [importMethod, setImportMethod] = useState<"excel" | "manual" | "skip" | null>(null);
  
  // Manual import products list
  const [manualProducts, setManualProducts] = useState<Array<{
    name: string;
    category: string;
    stock: string;
    threshold: string;
    unit: string;
    purchasePrice: string;
    sellPrice: string;
  }>>([
    { name: "", category: "Alimentation", stock: "", threshold: "", unit: "pièces", purchasePrice: "", sellPrice: "" }
  ]);

  // Excel simulated import states
  const [fileName, setFileName] = useState("");
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelStep, setExcelStep] = useState("");
  const [excelProductsPreview, setExcelProductsPreview] = useState<typeof MOCK_EXCEL_PRODUCTS>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Error messaging
  const [errorMsg, setErrorMsg] = useState("");

  // Clean error msg on view change
  useEffect(() => {
    setErrorMsg("");
    setSuccess(false);
  }, [mode, step]);

  // Check if we are in password update mode (from reset link)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
      setIsRecoveryMode(true);
    }
  }, []);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === "Invalid login credentials" ? "Identifiants invalides. Veuillez réessayer." : error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);

      // Redirect after success animation
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  // Handle Password Reset Request
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Veuillez saisir votre adresse email.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/connexion`,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de l'envoi du lien.");
      setLoading(false);
    }
  };

  // Handle New Password submission (Recovery)
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmNewPassword) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        setIsRecoveryMode(false);
        setMode("login");
        setSuccess(false);
        setNewPassword("");
        setConfirmNewPassword("");
        if (typeof window !== "undefined") {
          window.location.hash = "";
        }
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  // Step 1 validation: Credentials for onboarding
  const handleOnboardingStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  // Step 2 validation: Company details
  const handleOnboardingStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !userName || !storeCity) {
      setErrorMsg("Veuillez remplir les informations requises.");
      return;
    }
    setErrorMsg("");
    setStep(3);
  };

  // Simulated Excel Import Process
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerExcelSimulatedImport(file.name);
    }
  };

  const triggerExcelSimulatedImport = (name: string) => {
    setFileName(name);
    setExcelLoading(true);
    setExcelProductsPreview([]);
    
    // Step-by-step parsing simulation
    setExcelStep("Lecture du fichier...");
    setTimeout(() => {
      setExcelStep("Analyse des feuilles & lignes...");
      setTimeout(() => {
        setExcelStep("Détection des colonnes : Désignation, Catégorie, Stock, Seuil, Prix...");
        setTimeout(() => {
          setExcelStep("Validation de 5 produits trouvés...");
          setTimeout(() => {
            setExcelLoading(false);
            setExcelProductsPreview(MOCK_EXCEL_PRODUCTS);
          }, 600);
        }, 800);
      }, 600);
    }, 600);
  };

  // Manual list item management
  const handleAddManualRow = () => {
    setManualProducts([
      ...manualProducts,
      { name: "", category: "Alimentation", stock: "", threshold: "", unit: "pièces", purchasePrice: "", sellPrice: "" }
    ]);
  };

  const handleRemoveManualRow = (index: number) => {
    if (manualProducts.length === 1) return;
    setManualProducts(manualProducts.filter((_, i) => i !== index));
  };

  const handleManualRowChange = (index: number, field: string, value: string) => {
    const updated = [...manualProducts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setManualProducts(updated);
  };

  // Final onboarding submission
  const handleOnboardingFinalize = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Sign up the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            storeName: storeName,
            userName: userName,
            sector: storeSector,
            city: storeCity,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      const sessionUser = data.session?.user || data.user;
      if (sessionUser) {
        // Update the profile fields in the DB
        await updateProfile({
          name: storeName,
          sector: storeSector,
          city: storeCity,
          userName: userName,
          email: email
        });

        // 2. Import Products if selected
        if (importMethod === "excel" && excelProductsPreview.length > 0) {
          await importProducts(excelProductsPreview, true);
        } else if (importMethod === "manual" && manualProducts.length > 0) {
          const validManualProds = manualProducts
            .filter(p => p.name.trim() !== "")
            .map(p => ({
              name: p.name,
              category: p.category,
              stock: parseInt(p.stock) || 0,
              threshold: parseInt(p.threshold) || 0,
              unit: p.unit,
              purchasePrice: parseFloat(p.purchasePrice) || 0,
              sellPrice: parseFloat(p.sellPrice) || 0
            }));
          
          await importProducts(validManualProds, true);
        } else if (importMethod === "skip") {
          await importProducts([], true);
        }
      }

      setLoading(false);
      setSuccess(true);
      setStep(4);

      // Redirect to Dashboard after 1.8s
      setTimeout(() => {
        router.push("/dashboard");
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors de la configuration de votre boutique.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 sm:p-6 font-sans animate-fade-in select-none">
      
      {/* Outer Container with dynamic width based on onboarding step */}
      <div className={`bg-white border border-[#E5E0D5]/70 rounded-2xl shadow-2xl w-full transition-all duration-500 overflow-hidden ${
        mode === "onboarding" && step === 3 && importMethod === "manual"
          ? "max-w-5xl" 
          : "max-w-lg"
      } p-6 sm:p-8 space-y-6`}>
        
        {/* Top App Branding */}
        <div className="text-center space-y-2">
          <div className="w-11 h-11 bg-brand-accent rounded-2xl flex items-center justify-center font-extrabold text-[#111E35] text-xl shadow-md mx-auto animate-wiggle">
            S
          </div>
          <h2 className="text-2xl font-extrabold text-brand-blue tracking-tight">
            {isRecoveryMode 
              ? "Nouveau Mot de Passe" 
              : mode === "reset_password" 
              ? "Réinitialisation" 
              : mode === "login" 
              ? "Connexion Stocko" 
              : "Rejoindre Stocko"}
          </h2>
          <p className="text-xs text-[#8A7F6E] leading-relaxed max-w-sm mx-auto">
            {isRecoveryMode
              ? "Définissez un nouveau mot de passe pour votre compte."
              : mode === "reset_password"
              ? "Récupérez l'accès à votre compte boutique."
              : mode === "login" 
              ? "Gérez votre stock en temps réel avec fluidité." 
              : "Créez votre boutique et préparez votre catalogue en 2 minutes."}
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-[#FFF0F0] border border-red-200 text-[#D9381E] px-4 py-3 rounded-xl text-xs font-bold animate-fade-in">
            {errorMsg}
          </div>
        )}

        {isRecoveryMode ? (
          <div className="space-y-6">
            <div className="bg-[#FAF6EE] border border-[#E5E0D5] p-4 rounded-xl space-y-1 text-center">
              <h4 className="text-sm font-bold text-brand-blue">Nouveau mot de passe</h4>
              <p className="text-xs text-[#8A7F6E]">Saisissez votre nouveau mot de passe sécurisé.</p>
            </div>

            {success ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 animate-fade-in text-center">
                <CheckCircle className="w-16 h-16 text-[#0A8543] animate-bounce" />
                <h3 className="font-extrabold text-brand-blue text-lg">Mot de passe mis à jour !</h3>
                <p className="text-xs text-[#8A7F6E]">Redirection vers la page de connexion...</p>
              </div>
            ) : (
              <form onSubmit={handleUpdatePasswordSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Nouveau mot de passe</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Confirmer le mot de passe</label>
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-brand-blue text-white font-extrabold text-[15px] shadow-sm hover:bg-[#1a2c4e] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:bg-[#E5E0D5] disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Mettre à jour le mot de passe"
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* ============================================================== */}
            {/* MODE: CLASSIC LOGIN                                           */}
            {/* ============================================================== */}
            {mode === "login" && (
          <>
            {success ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 animate-fade-in">
                <CheckCircle className="w-16 h-16 text-[#0A8543] animate-bounce" />
                <h3 className="font-extrabold text-brand-blue text-lg">Connexion réussie !</h3>
                <p className="text-xs text-[#8A7F6E]">Chargement de votre tableau de bord...</p>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Adresse Email</label>
                  <input
                    required
                    type="email"
                    placeholder="Ex: contact@maboutique.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5 relative">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Mot de passe</label>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl pl-4 pr-11 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A7F6E] hover:text-brand-blue transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Keep logged in */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 font-semibold text-brand-blue cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#E5E0D5] text-brand-accent focus:ring-brand-accent w-4 h-4"
                    />
                    Rester connecté
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode("reset_password")}
                    className="font-bold text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer focus:outline-none"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-brand-blue text-white font-extrabold text-[15px] shadow-sm hover:bg-[#1a2c4e] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:bg-[#E5E0D5] disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-brand-accent" />
                      Se connecter
                    </>
                  )}
                </button>

                {/* Toggle mode */}
                <div className="text-center pt-4 border-t border-[#FAF6EE]">
                  <span className="text-xs text-[#8A7F6E] font-medium">Nouveau sur Stocko ? </span>
                  <button
                    type="button"
                    onClick={() => setMode("onboarding")}
                    className="text-xs font-bold text-brand-blue hover:text-brand-accent transition-colors"
                  >
                    Créer un compte boutique
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ============================================================== */}
        {/* MODE: ONBOARDING / SIGN UP WIZARD                              */}
        {/* ============================================================== */}
        {mode === "onboarding" && (
          <div className="space-y-6">
            
            {/* Steps Progress Indicator (if not on success screen) */}
            {step < 4 && (
              <div className="flex items-center justify-center gap-2 pb-2">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= s 
                        ? "bg-brand-blue text-white" 
                        : "bg-[#FAF6EE] text-[#8A7F6E] border border-[#E5E0D5]"
                    }`}>
                      {s}
                    </div>
                    {s < 3 && (
                      <div className={`w-12 h-1 transition-all duration-300 ${
                        step > s ? "bg-brand-blue" : "bg-[#FAF6EE] border-b border-[#E5E0D5]"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* STEP 1: Credentials Signup */}
            {step === 1 && (
              <form onSubmit={handleOnboardingStep1} className="space-y-4 animate-fade-in">
                <div className="bg-[#FAF6EE] border border-[#E5E0D5] p-4 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                    Étape 1 : Vos identifiants de compte
                  </h4>
                  <p className="text-[11px] text-[#8A7F6E]">Créez un compte pour sécuriser l'accès à vos stocks.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase">Adresse Email</label>
                  <input
                    required
                    type="email"
                    placeholder="Ex: contact@maboutique.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Mot de passe</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Confirmer</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-[14px] hover:bg-[#1a2c4e] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-4"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4 text-brand-accent" />
                </button>

                <div className="text-center pt-4 border-t border-[#FAF6EE]">
                  <span className="text-xs text-[#8A7F6E] font-medium">Déjà un compte ? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setStep(1);
                    }}
                    className="text-xs font-bold text-brand-blue hover:text-brand-accent transition-colors"
                  >
                    Se connecter
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Store / Boutique configuration */}
            {step === 2 && (
              <form onSubmit={handleOnboardingStep2} className="space-y-4 animate-fade-in">
                <div className="bg-[#FAF6EE] border border-[#E5E0D5] p-4 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-brand-accent" />
                    Étape 2 : Profil de la Boutique
                  </h4>
                  <p className="text-[11px] text-[#8A7F6E]">Configurez l'identité de votre entreprise.</p>
                </div>

                {/* Store Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-[#8A7F6E]" />
                    Nom de l'entreprise / boutique
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Boutique Oumar & Fils"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>

                {/* City & Sector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#8A7F6E]" />
                      Ville d'implantation
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Ouagadougou"
                      value={storeCity}
                      onChange={(e) => setStoreCity(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Secteur d'activité</label>
                    <select
                      value={storeSector}
                      onChange={(e) => setStoreSector(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    >
                      {SECTOR_CHOICES.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* User Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#8A7F6E] uppercase flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#8A7F6E]" />
                    Votre Prénom / Nom d'utilisateur
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Oumar"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                  />
                  <p className="text-[10px] text-[#8A7F6E]">Ce nom sera affiché pour vous accueillir sur votre tableau de bord.</p>
                </div>

                {/* Nav buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E5E0D5] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-[14px] hover:bg-[#1a2c4e] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Continuer
                    <ChevronRight className="w-4 h-4 text-brand-accent" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Initial Inventory Import */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-[#FAF6EE] border border-[#E5E0D5] p-4 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-brand-accent" />
                    Étape 3 : Importation de Stock
                  </h4>
                  <p className="text-[11px] text-[#8A7F6E]">Initialisez votre catalogue de produits pour commencer directement.</p>
                </div>

                {/* Selection Cards (Only if no method selected) */}
                {importMethod === null && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Excel Card */}
                    <button
                      type="button"
                      onClick={() => setImportMethod("excel")}
                      className="bg-white border-2 border-dashed border-[#E5E0D5] hover:border-brand-accent rounded-2xl p-5 flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 bg-green-50 border border-green-200 text-[#0A8543] rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                        📊
                      </div>
                      <span className="font-extrabold text-sm text-brand-blue">Fichier Excel</span>
                      <p className="text-[10px] text-[#8A7F6E] leading-normal font-medium">Glissez un tableau existant pour tout importer instantanément.</p>
                    </button>

                    {/* Manual Card */}
                    <button
                      type="button"
                      onClick={() => setImportMethod("manual")}
                      className="bg-white border-2 border-dashed border-[#E5E0D5] hover:border-brand-accent rounded-2xl p-5 flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-brand-blue rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                        ✍️
                      </div>
                      <span className="font-extrabold text-sm text-brand-blue">Saisie Manuelle</span>
                      <p className="text-[10px] text-[#8A7F6E] leading-normal font-medium">Saisissez vos premiers articles dans une grille simple.</p>
                    </button>

                    {/* Skip Card */}
                    <button
                      type="button"
                      onClick={() => setImportMethod("skip")}
                      className="bg-white border-2 border-dashed border-[#E5E0D5] hover:border-brand-accent rounded-2xl p-5 flex flex-col items-center text-center space-y-3 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <div className="w-12 h-12 bg-orange-50 border border-orange-200 text-[#B25E00] rounded-xl flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
                        ⚡
                      </div>
                      <span className="font-extrabold text-sm text-brand-blue">Démarrer à vide</span>
                      <p className="text-[10px] text-[#8A7F6E] leading-normal font-medium">Sauter l'importation. Vous créerez vos fiches plus tard.</p>
                    </button>
                  </div>
                )}

                {/* ============================================================== */}
                {/* METHOD: EXCEL UPLOAD SIMULATION                                */}
                {/* ============================================================== */}
                {importMethod === "excel" && (
                  <div className="space-y-5 animate-fade-in">
                    
                    {/* Drag area */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#E5E0D5] hover:border-brand-accent rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#FAF6EE]/30 hover:bg-[#FAF6EE]/50 transition-all group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept=".xlsx,.xls,.csv" 
                        className="hidden" 
                      />
                      <Upload className="w-10 h-10 text-[#8A7F6E] group-hover:text-brand-blue group-hover:scale-110 transition-all mb-3" />
                      <span className="font-extrabold text-sm text-brand-blue">
                        {fileName ? fileName : "Cliquez ou glissez votre fichier ici"}
                      </span>
                      <span className="text-[10px] text-[#8A7F6E] mt-1 font-medium">Prend en charge les formats .xlsx, .xls, .csv</span>
                    </div>

                    {/* Parser loading simulation */}
                    {excelLoading && (
                      <div className="p-5 border border-[#E5E0D5] rounded-2xl bg-white space-y-3 animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-brand-blue">{excelStep}</span>
                        </div>
                        <div className="w-full bg-[#FAF6EE] h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-accent w-2/3 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {/* Extracted preview */}
                    {excelProductsPreview.length > 0 && !excelLoading && (
                      <div className="border border-[#E5E0D5] rounded-xl overflow-hidden animate-slide-up">
                        <div className="bg-[#FAF6EE] px-4 py-2 border-b border-[#E5E0D5] flex justify-between items-center">
                          <span className="text-xs font-bold text-brand-blue">5 Produits extraits avec succès !</span>
                          <span className="text-[9px] bg-[#EDFBF3] text-[#0A8543] px-2 py-0.5 rounded font-extrabold">Fichier Valide</span>
                        </div>
                        <div className="divide-y divide-[#FAF6EE] max-h-48 overflow-y-auto">
                          {excelProductsPreview.map((p, idx) => (
                            <div key={idx} className="px-4 py-2.5 flex justify-between items-center text-xs font-semibold hover:bg-[#FAF6EE]/40">
                              <div className="flex flex-col">
                                <span className="text-brand-blue">{p.name}</span>
                                <span className="text-[9px] text-[#8A7F6E] mt-0.5">{p.category}</span>
                              </div>
                              <span className="text-brand-blue">{p.stock} {p.unit} · {p.sellPrice} F</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bottom controls */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImportMethod(null);
                          setFileName("");
                          setExcelProductsPreview([]);
                        }}
                        className="flex-1 py-3.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E5E0D5] cursor-pointer"
                      >
                        Changer de méthode
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardingFinalize}
                        disabled={excelProductsPreview.length === 0 || loading}
                        className="flex-1 py-3.5 rounded-xl bg-brand-blue disabled:bg-[#E5E0D5] disabled:cursor-not-allowed text-white font-extrabold text-[14px] hover:bg-[#1a2c4e] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Importer et terminer
                            <ArrowRight className="w-4 h-4 text-brand-accent" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* METHOD: MANUAL TABLE GRID ENTRY                                */}
                {/* ============================================================== */}
                {importMethod === "manual" && (
                  <div className="space-y-5 animate-fade-in w-full">
                    
                    {/* Responsive scrolling table grid */}
                    <div className="border border-[#E5E0D5]/70 rounded-2xl overflow-hidden bg-white shadow-xs max-w-full">
                      <div className="overflow-x-auto max-w-full">
                        <table className="w-full text-left border-collapse min-w-[700px] text-xs font-semibold">
                          <thead>
                            <tr className="bg-[#FAF6EE] border-b border-[#E5E0D5] text-[10px] font-bold text-[#8A7F6E] uppercase tracking-wider">
                              <th className="px-4 py-3 min-w-[180px]">Nom du produit</th>
                              <th className="px-4 py-3 w-40">Catégorie</th>
                              <th className="px-4 py-3 w-24">Stock</th>
                              <th className="px-4 py-3 w-24">Seuil</th>
                              <th className="px-4 py-3 w-28">Prix Achat</th>
                              <th className="px-4 py-3 w-28">Prix Vente</th>
                              <th className="px-4 py-3 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#FAF6EE]">
                            {manualProducts.map((p, idx) => (
                              <tr key={idx} className="hover:bg-[#FAF6EE]/20 transition-colors">
                                {/* Name Input */}
                                <td className="px-4 py-2">
                                  <input
                                    required
                                    type="text"
                                    placeholder="Ex: Riz parfumé 25kg"
                                    value={p.name}
                                    onChange={(e) => handleManualRowChange(idx, "name", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-blue focus:outline-none focus:border-brand-accent"
                                  />
                                </td>

                                {/* Category select */}
                                <td className="px-4 py-2">
                                  <select
                                    value={p.category}
                                    onChange={(e) => handleManualRowChange(idx, "category", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-blue focus:outline-none focus:border-brand-accent"
                                  >
                                    {categories.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Stock input */}
                                <td className="px-4 py-2">
                                  <input
                                    required
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={p.stock}
                                    onChange={(e) => handleManualRowChange(idx, "stock", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2 py-1.5 text-xs font-bold text-brand-blue text-center focus:outline-none focus:border-brand-accent"
                                  />
                                </td>

                                {/* Threshold input */}
                                <td className="px-4 py-2">
                                  <input
                                    required
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={p.threshold}
                                    onChange={(e) => handleManualRowChange(idx, "threshold", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2 py-1.5 text-xs font-bold text-[#8A7F6E] text-center focus:outline-none focus:border-brand-accent"
                                  />
                                </td>

                                {/* Purchase Price */}
                                <td className="px-4 py-2">
                                  <input
                                    required
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={p.purchasePrice}
                                    onChange={(e) => handleManualRowChange(idx, "purchasePrice", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2 py-1.5 text-xs font-bold text-brand-blue focus:outline-none focus:border-brand-accent"
                                  />
                                </td>

                                {/* Sale Price */}
                                <td className="px-4 py-2">
                                  <input
                                    required
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={p.sellPrice}
                                    onChange={(e) => handleManualRowChange(idx, "sellPrice", e.target.value)}
                                    className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-lg px-2 py-1.5 text-xs font-bold text-brand-blue focus:outline-none focus:border-brand-accent"
                                  />
                                </td>

                                {/* Delete button */}
                                <td className="px-4 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveManualRow(idx)}
                                    disabled={manualProducts.length === 1}
                                    className="p-1 text-[#8A7F6E]/60 hover:text-[#D9381E] disabled:text-[#8A7F6E]/20 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Add row bottom panel */}
                      <div className="p-3 bg-[#FAF6EE]/30 border-t border-[#E5E0D5]/50 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleAddManualRow}
                          className="flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:text-brand-accent transition-colors bg-white px-3 py-1.5 rounded-lg border border-[#E5E0D5]"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Ajouter une ligne
                        </button>
                        <span className="text-[10px] text-[#8A7F6E] font-medium">
                          {manualProducts.length} ligne(s) dans la grille
                        </span>
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setImportMethod(null);
                          setManualProducts([{ name: "", category: "Alimentation", stock: "", threshold: "", unit: "pièces", purchasePrice: "", sellPrice: "" }]);
                        }}
                        className="flex-1 py-3.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E5E0D5] cursor-pointer"
                      >
                        Changer de méthode
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardingFinalize}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-[14px] hover:bg-[#1a2c4e] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Valider et terminer
                            <ArrowRight className="w-4 h-4 text-brand-accent" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ============================================================== */}
                {/* METHOD: SKIP AND START FRESH                                   */}
                {/* ============================================================== */}
                {importMethod === "skip" && (
                  <div className="space-y-5 animate-fade-in text-center p-4">
                    <div className="w-12 h-12 bg-orange-50 border border-orange-200 text-[#B25E00] rounded-full flex items-center justify-center text-xl mx-auto">
                      ⚡
                    </div>
                    <h5 className="font-extrabold text-brand-blue text-sm">Prêt à démarrer à vide ?</h5>
                    <p className="text-xs text-[#8A7F6E] max-w-xs mx-auto leading-relaxed">
                      Vous commencerez avec un catalogue vide. Vous pourrez ajouter vos produits un par un ou importer un fichier depuis les paramètres à tout moment.
                    </p>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setImportMethod(null)}
                        className="flex-1 py-3.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E5E0D5] cursor-pointer"
                      >
                        Changer de méthode
                      </button>
                      <button
                        type="button"
                        onClick={handleOnboardingFinalize}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-xl bg-brand-blue text-white font-extrabold text-[14px] hover:bg-[#1a2c4e] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            Démarrer maintenant
                            <ArrowRight className="w-4 h-4 text-brand-accent" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Back button to Step 2 (only if no method selected) */}
                {importMethod === null && (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 rounded-xl bg-[#FAF6EE] hover:bg-[#F0EAE0] text-[#8A7F6E] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E5E0D5] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Retour à l'étape précédente
                  </button>
                )}
              </div>
            )}

            {/* STEP 4: Success animation screen */}
            {step === 4 && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fade-in">
                <CheckCircle className="w-20 h-20 text-[#0A8543] animate-bounce" />
                <h3 className="font-extrabold text-brand-blue text-xl">Boutique configurée avec succès !</h3>
                <p className="text-xs text-[#8A7F6E] max-w-xs text-center leading-relaxed">
                  Bienvenue sur votre espace de gestion <strong>{storeName}</strong>. Redirection vers votre tableau de bord...
                </p>
              </div>
            )}
          </div>
        )}

          {/* ============================================================== */}
          {/* MODE: RESET PASSWORD REQUEST                                  */}
          {/* ============================================================== */}
          {mode === "reset_password" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#FAF6EE] border border-[#E5E0D5] p-4 rounded-xl space-y-1 text-center">
                <h4 className="text-sm font-bold text-brand-blue flex items-center justify-center gap-1.5">
                  Mot de passe oublié ?
                </h4>
                <p className="text-[11px] text-[#8A7F6E]">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              </div>

              {success ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-3 animate-fade-in text-center">
                  <CheckCircle className="w-16 h-16 text-[#0A8543] animate-bounce" />
                  <h3 className="font-extrabold text-brand-blue text-lg">Lien envoyé !</h3>
                  <p className="text-xs text-[#8A7F6E] max-w-xs leading-relaxed">
                    Un email contenant un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setSuccess(false);
                    }}
                    className="mt-4 text-xs font-bold text-brand-blue hover:text-brand-accent transition-colors cursor-pointer"
                  >
                    Retourner à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8A7F6E] uppercase">Adresse Email</label>
                    <input
                      required
                      type="email"
                      placeholder="Ex: contact@maboutique.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#FAF6EE]/50 border border-[#E5E0D5] rounded-xl px-4 py-3 text-[14px] font-semibold text-brand-blue focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-brand-blue text-white font-extrabold text-[15px] shadow-sm hover:bg-[#1a2c4e] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:bg-[#E5E0D5] disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Envoyer le lien"
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-[#FAF6EE]">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-xs font-bold text-[#8A7F6E] hover:text-brand-blue transition-colors cursor-pointer"
                    >
                      Retourner à la connexion
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  </div>
  );
}
