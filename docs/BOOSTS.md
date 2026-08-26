# Quota flexible — packs boost & palier Pro+ (plan, pas d'implémentation)

Décision de cadrage issue de la discussion du 2026-08-26. Complète
`docs/PRICING.md` (positionnement Free/Pro) — ne le contredit jamais :
prix fixes, deux compteurs nommés, jamais « des heures pour X $ »,
toujours la promesse du relais local.

## 0. Décision produit

L'idée de départ (slider de quota sur la page pricing, prix continu) est
**écartée** en phase 1 :

- Un prix vraiment continu n'existe pas chez Polar sur un abonnement
  fixe — il faudrait du metered/usage-based, donc une facture variable,
  l'inverse du « Simple, honest pricing ».
- Un slider transforme « 7,99 $/mois, point » en « combien de
  caractères me faut-il ?? » : friction maximale pour un produit à 8 $.
- Le vrai besoin couvert est étroit : les gros consommateurs ponctuels,
  déjà protégés par le relais local (jamais de coupure).

Ce qu'on construit à la place, dans l'ordre :

1. **Phase 1 — Packs boost** (one-time) : un abonné Pro actif achète du
   volume en plus, crédité immédiatement, **valable jusqu'à la fin de la
   période en cours**. C'est exactement le « augmenter son quota
   jusqu'à la fin de son abo » — sans prorata à calculer : prix fixe du
   pack, règle d'expiration annoncée en clair.
2. **Phase 2 — Pro+** (si les données le justifient) : UN palier fixe
   au-dessus de Pro (quota ×4), deuxième carte sur la page pricing —
   jamais un slider. Déclencheur : des users qui achètent des boosts
   ≥ 2 mois de suite (mesure via la table `quota_boost`).

## 1. Côté Polar — ce qu'il faut créer

- 2 produits **one-time** (pas d'abonnement) :
  - `Boost S` — +500 000 caractères de traduction IA **et** +50 000
    caractères de voix neurale — ~3 $.
  - `Boost L` — +1 500 000 / +150 000 — ~7 $.
  - Un seul multiplicateur par pack (traduction ET voix ensemble) : un
    seul chiffre à comprendre. Prix à valider contre la marge par
    caractère de `docs/PRICING.md` (coûts Gemini/Deepgram) — garder la
    marge du pack ≥ celle de l'abo, un boost n'est pas une promo.
  - `metadata` produit : `{ pack: "s" | "l", chars: N, ttsChars: N }` —
    le webhook lit le pack depuis la metadata, jamais depuis le nom.
- Webhook : on écoute déjà `customer.state_changed` ; ajouter
  l'évènement **`order.paid`** dans la config du webhook Polar (même
  endpoint `/api/webhooks/polar`).
- Phase 2 (Pro+) : un produit abonnement de plus ; l'upgrade d'un
  abonné existant passe par `PATCH /v1/subscriptions/{id}` avec
  `proration_behavior: "invoice"` (facturation immédiate de la
  différence, au prorata — c'est Polar qui calcule). Le portail client
  Polar sait aussi le faire sans code.

## 2. Côté nous — schéma & serveur

- **Nouvelle table** `quota_boost` :
  `id, userId, period ("YYYY-MM" UTC), chars, ttsChars, polarOrderId
  (unique — idempotence du webhook), createdAt`.
  Pas de report : un boost appartient à SA période. Simple à comprendre,
  simple à coder, cohérent avec « valable jusqu'au renouvellement ».
  (Cas limite assumé : acheté le 30 du mois → expire vite. L'UI
  affiche TOUJOURS « valable jusqu'au N » avant paiement.)
- **Webhook** (`/api/webhooks/polar`) : sur `order.paid` d'un produit
  pack (metadata présente) → upsert par `polarOrderId` dans
  `quota_boost` pour la période courante. Refus silencieux si le user
  n'est pas Pro actif (ou : autoriser, le boost s'ajoute au plan free ?
  NON — un boost sans abo n'a pas de sens, le checkout n'est proposé
  qu'aux Pro).
- **`/api/entitlements`** : `cloudCharsTotal = PRO_MONTHLY_CHARS +
  Σ boosts.chars (période courante)` ; idem TTS. RIEN d'autre à
  toucher : le popup, le hub et la page compte lisent déjà ces totaux
  (travail du 2026-08-26) — toute l'UI quota suit automatiquement.
- **`/api/checkout`** : accepter `?pack=s|l` en plus de
  `?plan=pro|pro-yearly` → checkout Polar du produit correspondant,
  `metadata.userId` pour rattacher la commande au compte.
- Compteurs de consommation (`pro_usage`) : inchangés. Le plafond
  bouge, pas la mesure.

## 3. UI — où le boost se vend (et nulle part ailleurs)

- **Page compte** (site) : sous les jauges, un bloc discret « Booster
  ce mois-ci » avec les 2 packs, la mention explicite « valable
  jusqu'au {date de renouvellement} », visible en permanence pour les
  Pro (mis en avant quand une jauge passe sous 20 %).
- **Popup extension** : quand une jauge est orange/rouge, une ligne
  discrète sous le bloc quota — « Booster ce mois-ci → » qui ouvre
  `/{lang}/account`. Pas de checkout dans le popup.
- **Page pricing** : PAS de packs sur la page (elle reste deux cartes).
  Une phrase dans la modale « Comprendre les tarifs » : « Un mois
  chargé ? Les abonnés Pro peuvent ajouter un volume ponctuel depuis
  leur compte. »
- **Wording** : « caractères », jamais « tokens » ; « volume », jamais
  « heures » ; toujours rappeler le relais local (règles PRICING.md).

## 4. Règles honnêtes & remboursements

- Avant paiement : afficher la date d'expiration exacte du boost.
- Un boost consommé n'est pas remboursable ; un boost intact peut
  l'être au cas par cas (remboursement partiel/total possible via
  Polar : `POST /v1/refunds`, raisons normalisées, `revoke_benefits`
  pour les one-time). Les frais de transaction Polar ne sont pas
  restitués au vendeur — un remboursement « geste commercial » coûte
  ~la commission. À écrire noir sur blanc dans la page Terms (section
  remboursements à ajouter — elle n'existe pas encore).
- Jamais de boost auto-acheté, jamais d'auto-renouvellement de pack.

## 5. Ordre de build (phase 1)

1. Table `quota_boost` + migration (`pnpm db:push`).
2. Produits Polar (sandbox d'abord) + metadata + évènement webhook.
3. Handler `order.paid` (idempotent par `polarOrderId`) + tests.
4. Totaux dans `/api/entitlements` (+ test : base + boosts).
5. `/api/checkout?pack=` + bloc UI page compte (i18n ×10).
6. Ligne popup sous la jauge (i18n ×10 extension).
7. Modale pricing : la phrase (i18n ×10).
8. Gates habituelles + parity checks ; annonce dans le changelog.

Estimation honnête : petite feature — le gros du travail (totaux servis
par l'API, jauges partout) est déjà en place.
