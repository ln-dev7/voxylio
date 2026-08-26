# Pipeline de traduction — architecture, décisions, plan

> Document de référence du moteur de traduction temps réel. Mis à jour
> après la passe d'amélioration d'août 2026 (recherche + revue de code
> complète : 53 constats traités ou planifiés). Les règles produit
> (prix, quotas, wording) vivent dans `docs/PRICING.md`.

## 1. Vue d'ensemble

```
cue brute (textTrack / DOM / fichier VTT-SRT)
  └─ stripTags            balises HTML/VTT, tags ASS {\an8}, entités HTML
  └─ addCue               dédup, fusion roll-up, insertion triée (binaire)
  └─ buildGroups          cleanCaption par cue, reconstruction de phrases
       cleanCaption       SDH [bruits], (sons), ♪paroles♪ → silence,
                          étiquettes JOHN:, marqueurs >>, tirets de dialogue
       endsSentence       ponctuation multi-scripts (。！？؟।), abréviations,
                          continuation par points de suspension
       filtre             une cue sans lettre ne devient jamais un groupe
  └─ pretranslate         fenêtre 45 s, 3 requêtes max en parallèle
       cache mémoire      clé = époque|source->cible::texte (par onglet)
       cache persistant   storage.local, LRU 600, préfixé pro/std — un
                          re-visionnage ne re-consomme pas le quota
       lot Pro            ≥2 lignes → UNE requête métrée (JSON structuré)
  └─ translate            glossaire + termes techniques → placeholders ⟦n⟧
  └─ chaîne de providers  pro → builtin → deepl/googlev2 (BYO) → gtx
       cooldowns          par (provider, paire), survivent aux rebuilds
       ready-miss         2 timeouts de ready() → pause, sans pénalité
       sortie vide        on passe au suivant, sans pénalité
       langue détectée    remontée par gtx/DeepL/Google → stoppe le
                          doublage d'une vidéo déjà dans la langue cible
  └─ speak                voix Aura-2 (Pro) sinon voix locale ; les deux
                          ne se recouvrent jamais (filets par moteur)
```

Invariants non négociables :

1. **Le doublage ne s'arrête jamais sur un échec cloud.** Chaque étage a
   un repli local ; toute erreur Pro/BYO/gtx retombe sur l'étage suivant.
2. **On ne parle que ce qui est parlé.** Annotations SDH, étiquettes de
   locuteur, paroles de chansons, entités HTML : jamais dans la voix,
   jamais chez un provider, jamais dans le quota.
3. **Seule la ligne cible est métrée.** Le contexte (avant/après) et le
   glossaire ne coûtent rien à l'utilisateur.
4. **Une ligne = une voix, une fois.** L'identité d'un groupe est son id
   (start + rang de collision), stable à travers les rebuilds.
5. **Les clés API ne quittent jamais le serveur** (Pro) ou storage.local
   (BYO). Rien dans le code de l'extension, rien dans le repo.

## 2. Livré dans cette passe

### Qualité de traduction
- **Nettoyage SDH complet** : entités HTML décodées (`&#39;` ne sera plus
  jamais lu à voix haute), tags ASS `{\an8}`, crochets scindés sur deux
  cues (`[MUSIC` / `PLAYING]`), parenthèses sonores non refermées,
  étiquettes `JOHN:` / `MAN 1:` / `>>`, cues de paroles `♪ … ♪`
  entièrement muettes (on ne chante pas par-dessus une chanson).
- **Scripts non latins réparés** : les parenthèses japonaises/russes/
  arabes ne sont plus supprimées (l'heuristique « tout majuscules »
  ignore les écritures sans casse) ; fins de phrase CJK/arabe/devanagari
  reconnues (。！？؟۔।) ; débit voix estimé au caractère pour CJK/thaï.
- **Phrases mieux reconstruites** : abréviations de titres (Dr., M.) ne
  coupent plus une phrase ; `…` suivi d'une minuscule = continuation.
- **Contexte pour tous** : le paramètre `context` de DeepL (gratuit, non
  facturé) est maintenant envoyé aussi pour les clés BYO ; le contexte
  Pro exclut les brouillons encore en croissance.
- **Prompt Gemini durci** : délimiteurs `<target_line>`, règles de
  doublage partagées (langage parlé, concision, noms/nombres intacts,
  placeholders préservés), indice de durée (« speakable within ~N s »,
  préférence douce — la recherche isochronie montre qu'une contrainte
  rigide dégrade le naturel), température par défaut (la doc Gemini 3
  déconseille < 1.0), garde anti-hallucination (ratio de longueur).

### Coût & robustesse
- **Lot Pro** : les lignes à venir partent en UNE requête métrée avec
  sortie JSON contrainte par `responseSchema` (ids identiques exigés,
  tout écart = 502 et repli par-ligne). Moins de latence, moins d'appels,
  cohérence de scène (pronoms, registre, terminologie).
- **Cache persistant** : LRU 600 entrées dans storage.local, préfixé
  pro/std — F5 et re-visionnage ne re-consomment plus le quota.
- **Clé de cache honnête** : époque de chaîne incluse — activer Pro ou
  changer de provider re-traduit vraiment (fini le Pro « inerte »).
- **Préchargement calmé** : fenêtre 90 s → 45 s, 3 requêtes max lancées
  par tick (le burst de 8 était le motif type du rate-limit gtx) ;
  l'audio neural n'est pré-généré que pour des lignes non passées.
- **Repli gtx** : sur échec du endpoint principal, l'ancien endpoint
  `clients5` est tenté une fois (limites indépendantes) — résilience
  seulement, le volume reste borné en amont.
- **Cooldowns durcis** : tout statut non-OK du backend Pro déclenche une
  pause locale (2 à 10 min) ; les cooldowns survivent aux changements de
  réglages ; un ready() qui ne répond jamais est mis en pause sans être
  compté comme panne ; le provider Pro s'auto-suspend 20 s après refus.
- **Quota** : la ligne cible seule est métrée (lot = somme des lignes) ;
  un échec d'écriture du compteur est loggé au lieu d'être avalé ;
  timeouts serveur (7-8 s) sur tous les appels provider.

### Corrections de bugs sérieux
- Collision d'ids de groupes à start identique (2e réplique d'un même
  timestamp silencieusement perdue) — ids désambiguïsés, stables.
- Réglages non validés à la lecture (`rate: undefined` → `NaN` →
  `video.volume` jette → doublage mort) — tout passe par
  `validateSettings`, y compris `onChanged`.
- Lignes marquées « dites » avant que l'audio existe (perdues sur pause
  pendant le fetch cloud) — dé-marquées si aucune voix n'a démarré.
- File d'attente : les lignes jetées (débordement, pause, retard)
  libèrent leurs registres — plus de fuite ni de boucle de re-traduction.
- Piste de sous-titres collante : plus de mélange de langues quand une
  meilleure piste apparaît en cours de flux HLS.
- Auto-doublage d'une vidéo déjà dans la langue cible : la langue
  détectée par les providers ferme le trou `auto→auto`.
- Croissance mémoire bornée sur les lives (cues élaguées à 300 s).

### Produit
- **Glossaire utilisateur** (hub → Paramètres) : « terme = traduction »
  impose la forme cible, « terme » seul interdit la traduction. Passe
  par les placeholders ⟦n⟧, donc identique sur TOUS les moteurs, y
  compris Pro — zéro coût serveur, zéro caractère facturé. 50 entrées
  max, validées, synchronisées (storage.sync).

## 3. Prochaines étapes (ordre recommandé)

1. **Écran quota** : jauge « caractères IA restants » dans le hub
   (l'API renvoie déjà `remaining` ; la stocker côté background,
   l'afficher, avertir à 80 %). Petite, forte valeur perçue.
2. **Glossaire par site** : mêmes entrées, portée hostname (le champ
   existe déjà dans le modèle de réglages, l'UI suffirait).
3. **Cache persistant par vidéo** : clé videoId (YouTube `v=`,
   pathname ailleurs) pour un vrai « reprendre où j'en étais » et des
   stats de hit par contenu.
4. **Re-détection périodique de la source** : re-échantillonner à ~60 s
   quand la confiance initiale était moyenne ; adopter la langue de la
   piste quand elle contredit un choix explicite manifestement faux.
5. **Glossaires DeepL natifs (BYO)** : `glossary_id` v3 pour les
   utilisateurs DeepL (création via API, 1000 glossaires/compte) — en
   complément des placeholders, jamais à la place.
6. **Harnais de qualité** : corpus de cues réelles (SDH lourd, CJK,
   lives) rejoué en CI avec assertions de nettoyage et de regroupement —
   le pendant « qualité » des harnais fonctionnels actuels.
7. **Batch adaptatif** : taille de lot pilotée par la latence observée
   (2 → 8) et par `budget restant / rythme de consommation`.
8. **Annulation bout-en-bout** : propager un AbortSignal du chain
   timeout jusqu'au fetch background → serveur, pour ne plus payer les
   réponses abandonnées (le timeout serveur 7 s en couvre déjà le gros).

Non retenu, assumé : traduction spéculative des brouillons (double coût
pour un gain d'avance minime), contrainte de longueur dure côté prompt
(dégrade le naturel — préférence douce seulement), abaissement de la
température Gemini (contre-indiqué par la doc du modèle).

## 4. Gates

Toute modification du pipeline doit passer :

```
pnpm build:chrome            # esbuild → /extension
node --test packages/core/test/*.test.js    # 72 tests
node tests/integration/run-all.js           # 6 harnais Playwright
pnpm lint:firefox            # 0 erreur addons-linter
pnpm build:site && node site/scripts/check-messages.mjs
```

Le skill `.claude/skills/voxylio-translation/SKILL.md` donne la carte
détaillée du code aux agents qui retravaillent ce pipeline.
