---
trigger: always_on
---

Implémente une règle métier de validation du stock dans Stocko.

Objectif :

Empêcher toute sortie de stock (vente, déstockage, transfert ou autre mouvement sortant) lorsque la quantité demandée est supérieure au stock disponible.

Règles à respecter :

1. Avant d'enregistrer une opération, vérifier le stock disponible.

2. Si la quantité demandée est supérieure au stock disponible :

   * ne pas enregistrer la transaction ;
   * ne pas modifier le stock ;
   * ne créer aucun mouvement de stock ;
   * ne synchroniser aucune donnée avec Supabase ;
   * ne rien enregistrer dans IndexedDB (mode hors ligne).

3. Afficher un message clair à l'utilisateur :

"Opération impossible : le stock disponible est insuffisant."

4. Le message doit également afficher :

* Produit concerné
* Stock disponible
* Quantité demandée
* Quantité manquante

Exemple :

Produit : Riz 25 kg

Stock disponible : 12

Quantité demandée : 20

Quantité manquante : 8

Opération annulée.

5. Cette règle doit fonctionner :

* en ligne ;
* hors ligne ;
* avant toute écriture dans la base de données.

6. Si plusieurs utilisateurs travaillent simultanément, effectuer une dernière vérification du stock au moment de l'enregistrement afin d'éviter un stock négatif.

7. Le stock ne doit jamais devenir négatif.

8. Cette validation doit être centralisée dans la logique métier afin qu'elle soit automatiquement appliquée à toutes les opérations de sortie de stock.

IMPORTANT :

Ne modifie aucune autre fonctionnalité de Stocko.

Implémente cette validation sans casser les fonctionnalités existantes.
