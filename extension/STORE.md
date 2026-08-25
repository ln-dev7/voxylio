# Chrome Web Store submission kit

Everything needed to fill the store listing. Update as the product evolves.

## Package

Zip the CONTENTS of this folder (manifest.json at the zip root), excluding
`README.md` and `STORE.md`:

```bash
cd extension && zip -r ../voxylio-extension.zip . -x "README.md" -x "STORE.md"
```

## Listing — short description (max 132 chars)

- **EN**: Dub any subtitled video in real time — French, Spanish, Italian,
  German, Portuguese. Local translation, no account, no quota.
- **FR** : Doublez toute vidéo sous-titrée en temps réel — français,
  espagnol, italien, allemand, portugais. Local, sans compte, sans quota.

## Listing — detailed description (EN)

Voxylio speaks your videos in your language.

It reads the video's subtitle track, rebuilds full sentences, translates
them on your device with Chrome's built-in translation API, and speaks
over the video with a synthesized voice — in sync with playback, while the
original audio is automatically lowered.

★ Full-sentence dubbing — fluid voice, translations that keep their context
★ Any language pair — source auto-detected, dub into FR / ES / IT / DE / PT
★ 100% local by default — no account, no API key, no hour quotas
★ Strict local mode — nothing ever leaves your device
★ On-screen bilingual subtitles (original + translation)
★ Floating on-page controller — language, speed, original audio volume
★ Follows the player: pause, seek, ×1.5 speed, volume changes
★ Free and open source

Works on any site whose player exposes a subtitle track — most online
course platforms, documentation videos and standard HTML5 players.

## Listing — detailed description (FR)

Voxylio fait parler vos vidéos dans votre langue.

Il lit la piste de sous-titres de la vidéo, reconstitue des phrases
complètes, les traduit sur votre appareil avec l'API de traduction intégrée
de Chrome, et parle par-dessus la vidéo avec une voix de synthèse —
synchronisée avec la lecture, pendant que l'audio original est
automatiquement baissé.

★ Doublage par phrases complètes — voix fluide, traductions en contexte
★ Plus de 65 langues de doublage — source auto-détectée, toutes les paires
★ 100 % local par défaut — sans compte, sans clé API, sans quota d'heures
★ Mode strictement local — rien ne quitte votre appareil
★ Sous-titres bilingues à l'écran (original + traduction)
★ Contrôleur flottant sur la page — langue, vitesse, volume de l'original
★ Suit le lecteur : pause, avance, vitesse ×1,5, volume
★ Gratuit et open source

Fonctionne sur tout site dont le lecteur expose une piste de sous-titres —
la plupart des plateformes de cours, vidéos de documentation et lecteurs
HTML5 standards.

## Category & language

- Category: **Accessibility** (alternative: Productivity → Tools)
- Default language: French, with an English localized listing

## Single purpose statement

Voxylio has a single purpose: dubbing the video the user is watching into
their language, by translating the video's subtitle track and speaking it
aloud in sync with playback.

## Permission justifications

- **Host permission (`<all_urls>`)**: the extension must locate the video
  player and its subtitle track on whatever page the user is watching.
  Content scripts only observe `<video>` elements and their text tracks;
  they read nothing else on the page.
- **`storage`**: saves the user's settings (languages, voice, speed,
  volume, toggles) in `chrome.storage.sync`.

## Data usage disclosures (Privacy tab)

- Does NOT collect or transmit: personally identifiable information,
  health, financial, authentication, communications, location, web
  history, user activity, or website content — with one narrow exception:
  when the optional online translation fallback is active, individual
  subtitle sentences (public video captions) are sent to a translation
  service. Declare under "Website content", scoped to app functionality,
  not sold, not shared for ads.
- Privacy policy URL: **https://voxylio.lndev.me/en/privacy**

## Assets checklist

- [x] Icon 128×128 (`icons/icon128.png`)
- [ ] At least 1 screenshot 1280×800 or 640×400 (popup over a video page,
      floating bar, on-screen subtitles)
- [ ] Optional: small promo tile 440×280
- [x] Privacy policy page (live on the website)

## Review notes

Broad host permissions usually add a few days of review. If asked, point
reviewers to the open-source repository and the single purpose statement
above.
