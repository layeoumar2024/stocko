# Design System Stocko

Ce document définit la charte graphique, les composants réutilisables et les principes de responsivité du projet **Stocko** afin de garantir une cohérence visuelle sur toutes les pages de l'application.

---

## 1. Palette de Couleurs (Design Tokens)

La palette de couleurs est configurée dans le fichier [app/globals.css](file:///c:/Users/USER/Documents/stocko/app/globals.css) et s'articule autour des variables CSS suivantes :

| Variable CSS | Code Hexa | Rôle / Utilisation | Classe Tailwind |
| :--- | :--- | :--- | :--- |
| `--background` | `#FAF6EE` | Fond principal de l'application (Sable très clair) | `bg-brand-bg` |
| `--foreground` | `#111E35` | Texte principal de l'application (Bleu marine foncé) | `text-brand-blue` |
| `--sidebar-bg` | `#111E35` | Fond de la barre latérale et du header mobile | `bg-brand-blue` |
| `--accent` | `#E5A93C` | Couleur secondaire active (Or) | `bg-brand-accent` |
| `--accent-hover`| `#D6972B` | Hover sur les éléments actifs | `hover:bg-brand-accent-hover` |
| (Statut critique) | `#D9381E` | Alertes de rupture de stock, badges rouges | `bg-[#D9381E]`, `text-[#D9381E]` |
| (Statut moyen) | `#B25E00` | Alertes de stock bas, avertissements | `bg-[#FFF8E6]`, `text-[#B25E00]` |
| (Statut stable) | `#0A8543` | Mouvements entrants, stocks stables | `bg-[#EDFBF3]`, `text-[#0A8543]` |
| (Tri/Sortie) | `#6E3FF3` | Mouvements sortants, indicateurs violets | `bg-[#F6F0FF]`, `text-[#6E3FF3]` |

---

## 2. Typographie

*   **Police principale** : `'Outfit', sans-serif` (chargée via Google Fonts).
*   **Propriétés globales** :
    *   `-webkit-font-smoothing: antialiased` pour un rendu de police premium.
    *   `font-sans` par défaut sur le corps.

---

## 3. Mise en Page Réactive (Responsiveness)

### Points de rupture (Breakpoints)
*   **Mobile** : `< 1024px` (géré via `lg:` dans Tailwind).
*   **Desktop** : `>= 1024px` (`lg`).

### Structure Globale
*   **En-tête Mobile** :
    *   Fixé en haut en mode mobile (`lg:hidden fixed top-0 left-0 right-0 h-16 z-30`).
    *   Hauteur fixe : `h-16` (64px).
*   **Barre Latérale (Sidebar)** :
    *   Largeur fixe : `w-72` (288px).
    *   Sur Desktop : visible en permanence à gauche (`lg:translate-x-0`).
    *   Sur Mobile : masquée par défaut (`-translate-x-full`), s'ouvre par glissement (`translate-x-0`) avec un fondu d'arrière-plan (`backdrop-blur-xs bg-black/60`).
*   **Conteneur Principal (`<main>`)** :
    *   Padding gauche : `pl-0 lg:pl-72` (décalé uniquement sur grand écran).
    *   Padding haut : `pt-16 lg:pt-0` (décalé vers le bas sur mobile uniquement pour laisser passer l'en-tête mobile de 64px).
    *   Padding interne de page : `p-4 sm:p-8 lg:p-12`.

---

## 4. Composants Principaux

### Cartes d'Indicateurs (Stats Cards)
*   **Structure** : Bordures légères, coins arrondis généreux, ombre subtile et effet de survol dynamique.
*   **Classes CSS** :
    ```html
    <div className="bg-white border border-[#E5E0D5]/65 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-accent/20 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer">
    ```

### Boutons d'Action
*   **Bouton Principal (Bleu)** :
    ```html
    <button className="bg-brand-blue text-white px-5 py-3.5 rounded-xl font-bold text-[14px] hover:bg-[#1a2c4e] hover:shadow-md transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer">
    ```
*   **Bouton Secondaire (Blanc/Bordure)** :
    ```html
    <button className="bg-white border-2 border-brand-blue text-brand-blue px-5 py-3 rounded-xl font-bold text-[14px] hover:bg-brand-blue/5 hover:shadow-sm transition-all duration-200 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer">
    ```

### Rangées de Liste (List Items / Table Rows)
*   **Structure** : Espacement vertical aéré, effet de survol avec légère translation latérale pour guider l'œil.
*   **Classes CSS** :
    ```html
    <div className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-[#FAF6EE]/50 hover:translate-x-1.5 transition-all duration-300 ease-out cursor-pointer">
    ```

### Boîtes de Dialogue (Modals)
*   **Arrière-plan (Backdrop)** :
    ```html
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
    ```
*   **Panneau de dialogue (Panel)** :
    ```html
    <div className="bg-white border border-[#E5E0D5] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
    ```

---

## 5. Micro-Animations

Toutes les animations de transition utilisent des courbes de bézier personnalisées pour un effet fluide de type "iOS/Premium" (`cubic-bezier(0.16, 1, 0.3, 1)`).

### Définitions dans [globals.css](file:///c:/Users/USER/Documents/stocko/app/globals.css) :

1.  **Entrée Glissée (`animate-slide-up`)** :
    *   *Rôle* : Fait monter un élément (cartes, modales) de bas en haut à l'apparition.
    *   *Décalage temporel (stagger)* : Utiliser les classes de délai de transition pour les cartes successives (`[animation-delay:100ms]`, `[animation-delay:200ms]`, etc.).
2.  **Fondu d'apparition (`animate-fade-in`)** :
    *   *Rôle* : Fait apparaître les superpositions d'arrière-plan en douceur.
3.  **Wiggle (`animate-wiggle`)** :
    *   *Rôle* : Petite animation d'oscillation pour les émojis d'accueil (`👋`).
4.  **Pulsation de badge (`animate-pulse-ring`)** :
    *   *Rôle* : Crée un effet de halo lumineux pulsant autour des pastilles d'alerte pour attirer l'attention sans surcharger visuellement l'interface.
