# Stocko — Fiche Projet & Instructions IA

Ce fichier sert de point d'ancrage pour comprendre l'architecture, les fonctionnalités et les principes de conception de l'application **Stocko**. Tout modèle d'IA travaillant sur ce projet à l'avenir doit lire ce fichier en priorité.

---

## 1. Description du Projet

**Stocko** est une application web moderne de gestion de stock conçue spécifiquement pour les PME et grossistes d'Afrique francophone (l'exemple type utilisé dans l'application est *Distributions Faso*, un grossiste basé à Ouagadougou).

L'application permet :
- La supervision globale de l'état des stocks via un tableau de bord.
- Le suivi en temps réel des valeurs d'actifs et de vente.
- La gestion d'alertes en cas de stock bas ou de rupture critique.
- La saisie rapide des flux d'entrées et de sorties (comptoir).
- La génération d'analyses d'activité avec des fonctions de partage (WhatsApp) et d'impression optimisées (export PDF).

---

## 2. Fonctionnalités Implémentées

### 🔐 Authentification (Simulée)
- **Fichier de page :** [app/connexion/page.tsx](file:///c:/Users/USER/Documents/stocko/app/connexion/page.tsx)
- **Fonctionnement :** Écran de connexion adapté aux mobiles, utilisant le numéro de téléphone et le mot de passe. Simule un délai de chargement avec animation de réussite avant de rediriger vers le tableau de bord.

### 📊 Tableau de Bord (Dashboard)
- **Fichier de page :** [app/page.tsx](file:///c:/Users/USER/Documents/stocko/app/page.tsx)
- **Indicateurs clés (KPIs) :**
  - Nombre total de produits.
  - Valorisation totale du stock (somme de `stock * purchasePrice`).
  - Nombre d'alertes actives.
  - Mouvements enregistrés aujourd'hui (entrées/sorties).
- **Listes rapides :** Produits à surveiller et flux récents d'activité.
- **Raccourcis :** Modals d'ajout rapide de produits et d'enregistrement de mouvements.

### 📦 Gestion du Catalogue (Produits)
- **Fichiers de page :** 
  - Liste : [app/produits/page.tsx](file:///c:/Users/USER/Documents/stocko/app/produits/page.tsx)
  - Fiche détaillée : [app/produits/[id]/page.tsx](file:///c:/Users/USER/Documents/stocko/app/produits/[id]/page.tsx)
- **Fonctionnalités :**
  - Recherche textuelle par nom de produit.
  - Filtrage par catégorie (Alimentation, Hygiène, Boissons, Matériaux, Divers).
  - Fiche produit complète affichant les prix d'achat, de vente, le taux de marge (markup), les seuils d'alertes et l'historique propre de ses mouvements.
  - Possibilité de modifier ou de supprimer définitivement un produit (avec cascade sur l'historique des mouvements).

### 🔄 Saisie au Comptoir (Mouvements de stock)
- **Fichier de page :** [app/mouvements/page.tsx](file:///c:/Users/USER/Documents/stocko/app/mouvements/page.tsx)
- **Fonctionnalités :**
  - Autocomplete pour sélectionner rapidement un produit.
  - Sélection du type de flux : **Entrée (Réapprovisionnement)** ou **Sortie (Vente / Perte)**.
  - Ajustement rapide des quantités (boutons -/+ et incréments rapides +5, +10, +25, +50 pour usage sur tablette).
  - Enregistrement immédiat dans le state persistant avec message de succès.

### ⚠️ Gestion des Alertes de Stock
- **Fichier de page :** [app/alertes/page.tsx](file:///c:/Users/USER/Documents/stocko/app/alertes/page.tsx)
- **Statuts calculés automatiquement :**
  - **Rupture critique (status = critical) :** Stock actuel $\le$ Seuil d'alerte / 2.
  - **Stock bas (status = low) :** Seuil d'alerte / 2 < Stock actuel $\le$ Seuil d'alerte.
  - **Stable (status = stable) :** Stock actuel > Seuil d'alerte.
- **Notification WhatsApp :** Génère un message formaté avec émojis listant toutes les ruptures et stocks bas actifs, prêt à être copié ou envoyé via l'API WhatsApp pour alerter le gérant.

### 📈 Rapports d'Activité et Analyses
- **Fichier de page :** [app/rapport/page.tsx](file:///c:/Users/USER/Documents/stocko/app/rapport/page.tsx)
- **Fonctionnalités :**
  - Sélection de la période (Hebdomadaire : 7 jours ou Mensuel : 30 jours).
  - Évaluation de la valeur du stock, des ventes estimées et du volume total d'articles écoulés.
  - Classement du Top 3 des ventes.
  - Graphiques de répartition par catégories (progress bars CSS).
  - **Impression PDF optimisée :** Styles `@media print` masquant le menu et les boutons d'action afin d'offrir une édition PDF propre et professionnelle.
  - Partage de rapport résumé par WhatsApp.

---

## 3. Structure des Fichiers

Voici la structure de l'espace de travail :

```
c:\Users\USER\Documents\stocko
├── .agents/                    # Instructions de l'agent et règles locales
│   └── rules/
│       └── design.md           # Charte graphique & Directives UI
├── app/                        # Dossier principal Next.js (App Router)
│   ├── alertes/
│   │   └── page.tsx            # Page des alertes de stock
│   ├── connexion/
│   │   └── page.tsx            # Page de connexion
│   ├── mouvements/
│   │   └── page.tsx            # Page d'enregistrement des mouvements de stock
│   ├── produits/
│   │   ├── [id]/
│   │   │   └── page.tsx        # Fiche produit détaillée (Lecture, Édition, Suppression)
│   │   └── page.tsx            # Page catalogue des produits
│   ├── rapport/
│   │   └── page.tsx            # Page des analyses et rapports
│   ├── favicon.ico
│   ├── globals.css             # Styles globaux, variables Tailwind v4 et animations CSS
│   ├── layout.tsx              # Gabarit global (Sidebar, Providers, structure flex)
│   ├── page.tsx                # Page d'accueil / Tableau de bord
│   └── providers.tsx           # Wrapper des contextes client-side
├── components/                 # Composants d'interface partagés
│   └── Sidebar.tsx             # Barre de navigation latérale et mobile
├── context/                    # Gestion d'état globale
│   └── StockContext.tsx        # Fournisseur d'état (state) persistant avec localStorage
├── public/                     # Fichiers statiques et médias
├── package.json                # Fichier de dépendance de l'application
├── tsconfig.json               # Config TypeScript
├── next.config.ts              # Config Next.js
├── design_system.md            # Copie de la charte graphique
└── gemini.md                   # Ce fichier descriptif et d'instructions
```

---

## 4. Technologies Utilisées

- **Framework Web :** [Next.js 16.2](https://nextjs.org/) (avec structure App Router)
- **Bibliothèque d'Interface :** [React 19](https://react.dev/)
- **Langage :** [TypeScript 5](https://www.typescriptlang.org/)
- **Moteur de Style :** [Tailwind CSS v4](https://tailwindcss.com/)
- **Bibliothèque d'icônes :** [Lucide React](https://lucide.dev/)
- **Gestion de l'État :** Context API React combinée avec `localStorage` pour la persistance locale immédiate.

---

## 5. Décisions de Design & Charte Graphique

L'application utilise un style visuel premium inspiré du design moderne (type iOS), défini en détail dans le fichier [.agents/rules/design.md](file:///c:/Users/USER/Documents/stocko/.agents/rules/design.md).

### Palette de Couleurs (Design Tokens)
- **Fond principal :** `#FAF6EE` (`bg-brand-bg` - Sable très clair, doux pour les yeux).
- **Texte & Éléments primaires :** `#111E35` (`text-brand-blue` / `bg-brand-blue` - Bleu marine très foncé).
- **Couleur d'accentuation active :** `#E5A93C` (`bg-brand-accent` - Or chaleureux).
- **Hover sur l'accent :** `#D6972B`.
- **Indicateurs d'alertes :**
  - *Statut critique / Rupture :* Fond `#FFF0F0` / Texte & Pastilles `#D9381E`.
  - *Statut bas / Alerte :* Fond `#FFF8E6` / Texte & Pastilles `#B25E00`.
  - *Statut stable / Entrant :* Fond `#EDFBF3` / Texte & Pastilles `#0A8543`.
  - *Mouvement sortant (Sortie) :* Fond `#F6F0FF` / Texte & Pastilles `#6E3FF3`.

### Typographie
- Police Google Font **Outfit** appliquée à l'ensemble du projet avec un rendu de lissage de police premium (`antialiased`).

### Layout & Responsivité
- **Mobile (écran < 1024px) :** Barre d'en-tête fixe supérieure de 64px (`h-16`). Menu de navigation latéral masqué par défaut, s'ouvrant par translation latérale avec un fondu d'arrière-plan flouté (`backdrop-blur-xs bg-black/60`).
- **Desktop (écran $\ge$ 1024px) :** Sidebar affichée en permanence sur le côté gauche avec une largeur fixe de `w-72`. Le conteneur principal décale son padding de gauche de 288px (`lg:pl-72`).

### Micro-Animations
- Courbes de transition en bézier de type iOS : `cubic-bezier(0.16, 1, 0.3, 1)`.
- `animate-slide-up` : Pour faire monter en douceur les modales et cartes d'indicateurs lors de leur apparition.
- `animate-pulse-ring` : Crée une aura pulsée autour des pastilles critiques d'alerte pour attirer subtilement l'attention.
- `animate-wiggle` : Pour l'oscillation des émojis d'accueil (`👋`).

---

## 6. Instructions pour les Futures IA (Consignes Importantes)

Si vous êtes amené à modifier ou faire évoluer ce projet, veuillez respecter scrupuleusement les directives suivantes :

1. **Cohérence Visuelle :** N'utilisez pas de couleurs par défaut de Tailwind (comme `bg-red-500` ou `bg-green-600`). Référez-vous systématiquement à la charte et utilisez les classes configurées dans [globals.css](file:///c:/Users/USER/Documents/stocko/app/globals.css) ou utilisez des codes hexadécimaux précis conformes aux statuts définis dans le Design System.
2. **Gestion d'État :** Toute modification de stock ou ajout de produit doit passer par le [StockContext](file:///c:/Users/USER/Documents/stocko/context/StockContext.tsx) afin de garantir la persistance locale et la mise à jour cohérente du statut critique/low/stable à travers les différents écrans.
3. **Calcul des Niveaux de Stock :** Le calcul du statut se fait dans le context via la fonction `calculateStatus(stock, threshold)`. Si le seuil d'alerte ou la quantité change, recalculer immédiatement le statut.
4. **Export et Impression :** Lors de l'édition du rapport d'activité dans [app/rapport/page.tsx](file:///c:/Users/USER/Documents/stocko/app/rapport/page.tsx), conservez la gestion CSS d'impression dans le tag `<style>` local pour garantir que les PDF exportés restent nets et dépourvus des menus de l'application.
5. **Authentification Simulée :** L'authentification est simulée côté client. Ne tentez pas de la lier à un serveur ou une base de données sans demande explicite de l'utilisateur. Elle sert à illustrer le flux utilisateur.
