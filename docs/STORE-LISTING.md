# Fiche Chrome Web Store — texte de référence

> Copie officielle de la fiche (à coller dans le dashboard à chaque mise
> à jour de version). Règles : honnête sur le compte obligatoire et sur
> ce qui est local vs en ligne ; jamais « sans compte » ni « strictement
> local » (faux depuis la v1.7) ; jamais « le plan gratuit suffit ».
> L'onglet Confidentialité doit déclarer « Informations
> d'authentification » (adresse e-mail) — le doublage requiert la
> connexion Google.

## Résumé court (champ « Description sommaire », ≤132 caractères)

**FR** : Doublez n'importe quelle vidéo sous-titrée en temps réel :
traduction locale gratuite, voix par-dessus la vidéo, 70+ langues.

**EN**: Dub any subtitled video in real time — free on-device
translation, a voice over the video, 70+ languages.

## Description — FR (à jour pour la 1.7.0)

Voxylio fait parler vos vidéos dans votre langue.

Il lit les sous-titres de la vidéo — la piste du lecteur, ou les
sous-titres affichés à l'écran sur YouTube, Netflix, Prime Video,
Disney+ et Twitch — reconstitue des phrases complètes, les traduit, puis
parle par-dessus la vidéo avec une voix synchronisée, pendant que
l'audio original s'efface doucement sous la voix.

★ Doublage par phrases complètes — voix fluide, traductions en contexte
★ 70+ langues cibles — langue source détectée automatiquement
★ Gratuit et illimité : traduction locale sur votre appareil (API de
traduction intégrée de Chrome) + voix système — sans carte bancaire,
sans quota
★ Compte Voxylio gratuit (connexion Google) requis pour activer le
doublage
★ Pro, en option : traduction IA contextuelle — des scènes entières
traduites avec cohérence — et voix neurales naturelles en 7 langues,
avec repli automatique sur la voix locale
★ Glossaire personnel : imposez vos traductions, protégez vos termes
★ Sous-titres bilingues à l'écran (original + traduction)
★ Bouton Lancer — démarre sans recharger la page, et active les
sous-titres du lecteur quand c'est possible
★ Contrôleur flottant : langue, voix, vitesse, mixage de l'audio
original
★ Historique de doublage et statistiques calculés en local, export de
transcription (.srt)

Fonctionne partout où des sous-titres existent : plateformes de cours,
documentation vidéo, lecteurs HTML5 standards — et les sous-titres
affichés de YouTube, Netflix, Prime Video, Disney+ et Twitch.

## Description — EN (pour la fiche localisée anglaise)

Voxylio makes your videos speak your language.

It reads the video's subtitles — the player's track, or the captions
shown on screen on YouTube, Netflix, Prime Video, Disney+ and Twitch —
rebuilds complete sentences, translates them, then speaks over the video
with a synchronized voice while the original audio gently ducks under
it.

★ Full-sentence dubbing — a fluid voice, translations in context
★ 70+ target languages — source language detected automatically
★ Free and unlimited: on-device translation (Chrome's built-in
translation API) + your system voices — no card, no quota
★ A free Voxylio account (Google sign-in) is required to start dubbing
★ Optional Pro: contextual AI translation — whole scenes translated
coherently — and natural neural voices in 7 languages, with automatic
local fallback
★ Personal glossary: force your translations, protect your terms
★ Bilingual on-screen captions (original + translation)
★ Launch button — starts without reloading the page, and switches the
player's captions on for you when possible
★ Floating controller: language, voice, speed, original-audio mix
★ Dubbing history and statistics computed locally, transcript export
(.srt)

Works wherever subtitles exist: course platforms, video documentation,
standard HTML5 players — plus the on-screen captions of YouTube,
Netflix, Prime Video, Disney+ and Twitch.

## Checklist de soumission (rappel)

1. Package → importer `dist-store/voxylio-chrome-<version>.zip`.
2. Fiche → remplacer la description (ci-dessus) ; captures à jour si
   l'UI a changé (popup 400px, hub, bouton Lancer).
3. Confidentialité → « Informations d'authentification » déclarées ;
   justifications : `storage` (réglages + historique local),
   `scripting` (injection à la demande via le bouton Lancer), accès aux
   sites (lecture des sous-titres du lecteur).
4. Vérifier qu'aucune version n'est déjà en attente d'examen.
