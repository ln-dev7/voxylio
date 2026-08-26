# Moteur de doublage temps réel — architecture, décisions, plan

> Document de référence du moteur de PAROLE (cadencement, voix, mixage).
> Mis à jour après la passe d'août 2026 (recherche + revue dédiée : ~40
> constats traités ou planifiés). Le pipeline de TRADUCTION a son propre
> document (`docs/TRANSLATION.md`) ; les règles produit, `docs/PRICING.md`.

## 1. Vue d'ensemble

```
groupe traduit (translation pipeline)
  └─ onGroupEnter      déclenché quand la tête de lecture entre dans la
                       phrase (jamais avant — pratique des interprètes :
                       on suit l'original, on ne l'anticipe pas)
  └─ file (≤3)         une ligne en retard attend SON heure (garde de
                       départ) ; débordement → on jette la plus périmée
  └─ speak             caption + journal au moment où la voix démarre
       duckNow         le lit original descend SOUS la voix (attaque
                       250 ms, rampe en dB), tenu 4,5 s entre les lignes
                       d'un même échange, relâché en 700 ms dans les
                       vraies pauses — plus jamais un duck permanent
       Pro (Aura-2)    MP3 par phrase ; preservesPitch ; le débit est
                       calé sur la durée RÉELLE du MP3 (metadata) pour
                       tenir la fenêtre — clampé ≤1,35
       Local           voix système ; débit auto-calibré (wps mesuré par
                       voix), lissé d'une ligne à l'autre (anti-yoyo),
                       jamais sous le réglage utilisateur
  └─ filets            nets par moteur (jamais de chevauchement voix
                       cloud/locale), pompe pause()+resume() anti-bug
                       Chrome 14 s, watchdog 45 s, âge minimal 1,5 s
                       avant de réclamer le créneau (anti-double-voix)
```

Invariants :

1. **Une ligne démarre à son heure, jamais avant.** La garde de départ
   dans la file rembourse la dérive au lieu de l'accumuler.
2. **Deux moteurs, un seul créneau.** `currentUtterance` est le
   verrou ; les filets de récupération sont spécifiques à chaque moteur.
3. **Le duck suit la voix, pas la session.** Attaque rapide, tenue
   pendant l'échange, relâche douce — et la main de l'utilisateur sur le
   volume est respectée définitivement (détection de nos propres écritures).
4. **Une voix par passage.** Un échec cloud bascule en local ET y reste
   60 s (latch) — pas une phrase sur deux dans une autre voix.
5. **Caption et journal suivent la voix.** Une ligne jetée n'a jamais
   été affichée ni comptée ; les stats ne mesurent que l'audio réel.
6. **Un changement de vitesse ne mange jamais la ligne en cours** :
   l'audio cloud s'adapte en place, la ligne locale est re-planifiée.

## 2. Livré dans cette passe

### Synchronisation
- **Garde de départ dans la file** : après une longue ligne, les
  suivantes ne partent plus « en avance » en rafale — chacune attend son
  heure (tick 150 ms + timeupdate en onglet caché, non clampé).
- **Compression des lignes en retard** : une ligne qui a attendu se cale
  sur le temps RESTANT (plancher 1,2 s) — elle rattrape au lieu de
  déborder sur la suivante. Les lignes à l'heure gardent leur fenêtre.
- **Rattrapage des groupes finalisés tard** (flux live) : une phrase qui
  se stabilise après la fin de sa fenêtre est dite dans les 1,5 s au
  lieu de disparaître.
- **Latence de première ligne divisée** : le modèle local en cours de
  téléchargement cède la main en 400 ms (au lieu de bloquer 2,5 s par
  ligne) et se pré-charge dès que la paire est connue (warmup).
- **Préchargement pendant la pause** : reprendre ne repart plus de zéro.
- **Rebuffering** : la voix se met en pause avec l'image, reprend avec.

### Fluidité
- **Ducking dynamique** : le 12 % permanent (musiques et silences
  compris) devient un duck sous la voix uniquement — rampes en dB
  (250 ms/700 ms, pas de « pompage » : tenue 4,5 s dans un échange,
  pas de relâche si une ligne est imminente). Slider actif en direct.
- **Anti-chevauchement renforcé** : âge minimal avant qu'un filet ne
  libère le créneau (les voix distantes mettent 200-500 ms à démarrer et
  passaient pour « finies » — deux voix se superposaient).
- **Anti-coupure Chrome 14 s** : pompe pause()+resume() cyclée à 9 s
  pour les voix réseau, watchdog absolu à 45 s.
- **Tempo cohérent** : débit lissé entre lignes adjacentes (60 % du
  chemin vers la cible), auto-calibré sur la voix réelle (wps mesuré,
  EMA), plus lent que le réglage utilisateur : jamais.
- **Pro : ajustement exact** : le débit du MP3 Aura-2 se cale sur sa
  durée réelle (metadata) plutôt qu'une estimation en mots ; moitié de
  la préférence de vitesse seulement (la voix neurale a déjà sa cadence).

### Cohérence
- **Une voix par passage** (latch 60 s après échec cloud), **bonne voix
  dès la première ligne** (attente brève de getVoices() au lieu de la
  voix par défaut puis d'un changement audible), locale du choix de voix
  respectée (fr-CA choisi = fr-CA parlé).
- **Caption/journal véridiques** : affichés et comptés à la voix, plus
  au traducteur ; une ligne annulée ne compte plus ; stats mesurées de
  onstart à onend.
- **AutoPause honnête** : plus aucun chemin ne laisse la vidéo bloquée
  en pause avec le drapeau effacé.

## 3. Prochaines étapes (ordre recommandé)

1. **Pré-décodage cloud** : créer l'élément Audio (preload) dès la
   pré-génération pour gommer les ~50-150 ms de départ entre lignes.
2. **Micro-fusion** : deux répliques très courtes séparées de <300 ms
   dites en une utterance (moins de latence de démarrage moteur).
3. **Budget de retard type interprète** : au-delà de ~4 s de retard
   soutenu (EVS max des pros), compresser plus agressivement plutôt que
   de laisser la file jeter des lignes.
4. **Débounce du changement de vidéo primaire** (sites à pubs) : éviter
   le pompage duck + la ligne perdue à chaque transition.
5. **Annulation des fetchs cloud abandonnés** (scrub) : AbortController
   jusqu'au background pour ne plus payer les synthèses jetées.
6. **Curseurs O(1)** dans tick/pretranslate (index par id, curseur de
   groupe) pour les très longues vidéos.

Non retenu, assumé : anticiper l'original (les interprètes ne le font
jamais — EVS positif), contrainte de durée rigide (la recherche montre
qu'elle dégrade le naturel), Web Audio API sur la vidéo (interdit par le
CORS des médias cross-origin — le duck via video.volume est LA solution).

## 4. Gates

```
pnpm build:chrome
node --test packages/core/test/*.test.js     # 76 tests
node tests/integration/run-all.js            # 6 harnais (duck dynamique pinné)
pnpm lint:firefox                            # 0 erreur
```

Le harnais `run-progressive.js` pinne désormais la timeline du volume :
duck engagé pendant le dialogue, relâché après — toute régression du
mixage casse le test. Le skill `.claude/skills/voxylio-dubbing/SKILL.md`
donne la carte du code aux agents.
