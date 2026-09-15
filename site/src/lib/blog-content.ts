export const BLOG_LOCALES = [
  "en",
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "it",
  "pt-BR",
] as const;

export type BlogLocale = (typeof BLOG_LOCALES)[number];

type Item = { title: string; body: string };
type Section = {
  id: string;
  title: string;
  paragraphs: string[];
  items?: Item[];
  ordered?: boolean;
};

export type BlogContent = {
  locale: BlogLocale;
  metaTitle: string;
  metaDescription: string;
  blogName: string;
  indexTitle: string;
  indexIntro: string;
  latest: string;
  category: string;
  readTime: string;
  readGuide: string;
  backToBlog: string;
  inThisGuide: string;
  authorRole: string;
  articleTitle: string;
  articleDescription: string;
  articleExcerpt: string;
  imageAlt: string;
  intro: string[];
  sections: Section[];
  faqTitle: string;
  faq: Item[];
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
  ctaInstall: string;
  ctaSites: string;
};

const en: BlogContent = {
  locale: "en",
  metaTitle: "Voxylio Blog — Video translation and real-time dubbing",
  metaDescription: "Practical guides about translating online videos, real-time AI dubbing, subtitles, speech recognition and natural voices.",
  blogName: "Voxylio Blog",
  indexTitle: "Understand every video, not just every word.",
  indexIntro: "Practical guides on video translation, real-time dubbing, speech recognition and natural AI voices.",
  latest: "Latest articles",
  category: "Guide",
  readTime: "{minutes} min read",
  readGuide: "Read the guide",
  backToBlog: "Back to the blog",
  inThisGuide: "In this guide",
  authorRole: "Founder of Voxylio",
  articleTitle: "How to Translate and Dub Online Videos in Real Time",
  articleDescription: "A practical guide to translating online video audio while it plays, from subtitles and local voices to contextual AI translation and live transcription.",
  articleExcerpt: "Learn the fastest ways to understand a video in another language, what real-time dubbing requires, and when a browser extension is the right tool.",
  imageAlt: "An online video being translated and dubbed in real time",
  intro: [
    "Watching a video in a language you only partly understand is tiring. Subtitles help, but they split your attention between reading and watching. Real-time dubbing lets you hear a translated voice while the original video keeps playing.",
    "The best method depends on the website, whether captions exist, the languages involved and the level of privacy or voice quality you need. This guide explains the practical options and the fastest way to start.",
  ],
  sections: [
    {
      id: "what-real-time-dubbing-means",
      title: "What real-time video dubbing actually means",
      paragraphs: ["Real-time dubbing usually does not modify the video file. A tool follows the video clock, translates speech or captions, and plays a synthesized voice over lowered original audio so music and effects remain audible."],
      items: [
        { title: "Capture", body: "Read a subtitle track, on-screen captions or the audio itself." },
        { title: "Understand", body: "Rebuild complete sentences and preserve names, terminology and context." },
        { title: "Translate", body: "Convert each sentence into the viewer’s chosen language." },
        { title: "Speak", body: "Generate a voice and stay aligned when the viewer pauses, seeks or changes speed." },
      ],
      ordered: true,
    },
    {
      id: "choose-a-method",
      title: "Choose the right translation method",
      paragraphs: ["Start with the simplest option that works for the video. Each method solves a different use case."],
      items: [
        { title: "Platform dubbing", body: "Check the player’s audio tracks first. It is usually best synchronized, but only works when the publisher supplied your language." },
        { title: "Translated subtitles", body: "Free and widely available, but less comfortable for tutorials and long videos where the visuals matter." },
        { title: "File-based dubbing", body: "Useful for creators producing a polished new version, but it requires a file and time to process it." },
        { title: "Browser extension", body: "The most direct choice for viewers who want to understand videos across different websites without downloading them." },
      ],
    },
    {
      id: "use-voxylio",
      title: "How to dub an online video with Voxylio",
      paragraphs: ["Voxylio reads captions available in the player, rebuilds them into sentences, translates ahead of playback and speaks them in your language."],
      items: [
        { title: "Install", body: "Add Voxylio from your browser’s extension store." },
        { title: "Open", body: "Play a supported video and enable its captions when available." },
        { title: "Choose", body: "Select your target language and preferred voice." },
        { title: "Start", body: "Launch dubbing, then pause or seek normally; Voxylio follows the player." },
      ],
      ordered: true,
    },
    {
      id: "how-it-works",
      title: "Why complete sentences matter",
      paragraphs: [
        "Live captions often arrive as fragments and repeatedly revise the same line. Translating every fragment produces broken grammar, duplicated speech and unnatural pauses.",
        "A reliable engine waits for a stable sentence, assigns it a persistent identity, translates it with nearby context, queues it once and cancels stale work after a seek. A small look-ahead buffer helps the voice stay synchronized.",
      ],
    },
    {
      id: "local-vs-cloud",
      title: "Local processing versus cloud AI",
      paragraphs: ["Local processing is private and inexpensive; cloud services add quality and support videos without captions. A sensible product keeps local mode available and uses cloud processing only when it adds clear value."],
      items: [
        { title: "On-device translation and voice", body: "Best for everyday viewing, privacy and unlimited use; quality depends on the device." },
        { title: "Contextual cloud translation", body: "Better for technical content, names and consistent terminology; requires Internet and metered processing." },
        { title: "Cloud neural voice", body: "Provides more natural rhythm and pronunciation, with a usage cost and sometimes fewer languages." },
        { title: "Live transcription", body: "Unlocks videos without usable subtitles, but audio must be processed and latency is higher." },
      ],
    },
    {
      id: "common-problems",
      title: "Common real-time dubbing problems",
      paragraphs: [],
      items: [
        { title: "The same phrase repeats", body: "The engine must distinguish a live-caption revision from a new sentence." },
        { title: "The voice falls behind", body: "Use shorter phrasing, gentle speed adjustment or a small look-ahead buffer." },
        { title: "No captions are detected", body: "Enable captions. Some players need a dedicated adapter or live audio transcription." },
        { title: "The voice sounds robotic", body: "Choose another voice and preserve punctuation, which controls pauses and emphasis." },
        { title: "The dub speaks after seeking", body: "Cancel all pending translation and speech jobs whenever the position changes." },
      ],
    },
  ],
  faqTitle: "Frequently asked questions",
  faq: [
    { title: "Can I translate a video while it is playing?", body: "Yes. Real-time dubbing can translate upcoming captions and speak them while the video continues to play." },
    { title: "Can I dub a video that has no subtitles?", body: "Yes, with an extra speech-to-text step before translation and voice generation." },
    { title: "Does real-time dubbing replace the original voice?", body: "It normally overlays a translated voice and lowers the original audio, preserving music and background sound." },
    { title: "Is local video translation private?", body: "On-device features stay local. Cloud translation, transcription or neural voices send the data required for that feature to a provider." },
  ],
  ctaEyebrow: "Try it on your next video",
  ctaTitle: "Hear the video in your language.",
  ctaBody: "Install Voxylio, choose a language and start dubbing directly in your browser. No video download required.",
  ctaInstall: "Add to Chrome",
  ctaSites: "See supported sites",
};

const fr: BlogContent = {
  ...en,
  locale: "fr",
  metaTitle: "Blog Voxylio — Traduction vidéo et doublage en temps réel",
  metaDescription: "Des guides pratiques sur la traduction de vidéos en ligne, le doublage IA en temps réel, les sous-titres, la transcription et les voix naturelles.",
  blogName: "Blog Voxylio",
  indexTitle: "Comprenez chaque vidéo, pas seulement chaque mot.",
  indexIntro: "Des guides pratiques sur la traduction vidéo, le doublage en temps réel, la reconnaissance vocale et les voix IA naturelles.",
  latest: "Derniers articles",
  category: "Guide",
  readTime: "{minutes} min de lecture",
  readGuide: "Lire le guide",
  backToBlog: "Retour au blog",
  inThisGuide: "Dans ce guide",
  authorRole: "Fondateur de Voxylio",
  articleTitle: "Comment traduire et doubler des vidéos en ligne en temps réel",
  articleDescription: "Un guide pratique pour traduire l’audio d’une vidéo pendant sa lecture, des sous-titres et voix locales à la traduction IA contextuelle et à la transcription en direct.",
  articleExcerpt: "Découvrez les moyens les plus rapides de comprendre une vidéo dans une autre langue, les exigences du doublage en temps réel et l’intérêt d’une extension de navigateur.",
  imageAlt: "Une vidéo en ligne traduite et doublée en temps réel",
  intro: [
    "Regarder une vidéo dans une langue que l’on maîtrise mal est fatigant. Les sous-titres aident, mais obligent à partager son attention entre la lecture et l’image. Le doublage en temps réel permet d’entendre une voix traduite pendant que la vidéo continue.",
    "La meilleure méthode dépend du site, de la présence de sous-titres, des langues et du niveau de confidentialité ou de qualité vocale recherché. Voici les options concrètes et la façon la plus rapide de commencer.",
  ],
  sections: [
    { id: "what-real-time-dubbing-means", title: "Ce que signifie vraiment le doublage vidéo en temps réel", paragraphs: ["Le doublage en temps réel ne modifie généralement pas le fichier vidéo. Un outil suit la lecture, traduit la parole ou les sous-titres et superpose une voix synthétique tout en baissant le son original pour conserver la musique et les effets."], items: [
      { title: "Capturer", body: "Lire une piste de sous-titres, le texte affiché ou directement l’audio." },
      { title: "Comprendre", body: "Reconstruire des phrases complètes et conserver les noms, le vocabulaire et le contexte." },
      { title: "Traduire", body: "Transformer chaque phrase dans la langue choisie par l’utilisateur." },
      { title: "Prononcer", body: "Générer la voix et rester synchronisé après une pause, une avance ou un changement de vitesse." },
    ], ordered: true },
    { id: "choose-a-method", title: "Choisir la bonne méthode de traduction", paragraphs: ["Commencez par l’option la plus simple qui fonctionne avec la vidéo. Chaque méthode répond à un besoin différent."], items: [
      { title: "Doublage de la plateforme", body: "Vérifiez d’abord les pistes audio du lecteur. La synchronisation est excellente, mais votre langue doit avoir été fournie par l’éditeur." },
      { title: "Sous-titres traduits", body: "Gratuits et répandus, mais moins confortables pour les tutoriels et les longues vidéos où l’image compte." },
      { title: "Doublage d’un fichier", body: "Adapté aux créateurs qui produisent une nouvelle version soignée, mais il faut posséder le fichier et attendre son traitement." },
      { title: "Extension de navigateur", body: "Le choix le plus direct pour comprendre des vidéos sur différents sites sans les télécharger." },
    ] },
    { id: "use-voxylio", title: "Comment doubler une vidéo en ligne avec Voxylio", paragraphs: ["Voxylio lit les sous-titres du lecteur, les reconstruit en phrases, anticipe leur traduction et les prononce dans votre langue."], items: [
      { title: "Installer", body: "Ajoutez Voxylio depuis la boutique d’extensions de votre navigateur." },
      { title: "Ouvrir", body: "Lancez une vidéo compatible et activez ses sous-titres lorsqu’ils existent." },
      { title: "Choisir", body: "Sélectionnez la langue cible et la voix souhaitée." },
      { title: "Démarrer", body: "Lancez le doublage, puis utilisez pause et avance normalement : Voxylio suit le lecteur." },
    ], ordered: true },
    { id: "how-it-works", title: "Pourquoi les phrases complètes sont essentielles", paragraphs: ["Les sous-titres en direct arrivent souvent par fragments et réécrivent plusieurs fois la même ligne. Traduire chaque fragment crée une grammaire cassée, des répétitions et des pauses artificielles.", "Un moteur fiable attend une phrase stable, lui attribue un identifiant persistant, la traduit avec son contexte, ne la place qu’une fois dans la file et annule les tâches obsolètes après un déplacement dans la vidéo." ] },
    { id: "local-vs-cloud", title: "Traitement local ou IA dans le cloud", paragraphs: ["Le traitement local est privé et économique ; le cloud améliore la qualité et prend en charge les vidéos sans sous-titres. Une bonne solution conserve le mode local et n’utilise le cloud que lorsqu’il apporte une vraie valeur."], items: [
      { title: "Traduction et voix sur l’appareil", body: "Idéales au quotidien, pour la confidentialité et l’usage illimité ; la qualité dépend de l’appareil." },
      { title: "Traduction contextuelle cloud", body: "Plus précise pour le contenu technique, les noms et la cohérence terminologique ; Internet est requis et l’usage est mesuré." },
      { title: "Voix neuronale cloud", body: "Offre un rythme et une prononciation plus naturels, avec un coût d’utilisation et parfois moins de langues." },
      { title: "Transcription en direct", body: "Débloque les vidéos sans bons sous-titres, au prix d’un traitement audio et d’une latence supérieure." },
    ] },
    { id: "common-problems", title: "Problèmes fréquents du doublage en temps réel", paragraphs: [], items: [
      { title: "La même phrase se répète", body: "Le moteur doit distinguer la révision d’un sous-titre en direct d’une nouvelle phrase." },
      { title: "La voix prend du retard", body: "Utilisez des formulations plus courtes, un léger ajustement de vitesse ou un petit tampon d’anticipation." },
      { title: "Aucun sous-titre n’est détecté", body: "Activez-les dans le lecteur. Certains sites exigent un adaptateur dédié ou la transcription audio." },
      { title: "La voix semble robotique", body: "Choisissez une autre voix et conservez la ponctuation, qui contrôle les pauses et l’accentuation." },
      { title: "Le doublage parle après une avance", body: "Annulez toutes les traductions et voix en attente dès que la position change." },
    ] },
  ],
  faqTitle: "Questions fréquentes",
  faq: [
    { title: "Peut-on traduire une vidéo pendant sa lecture ?", body: "Oui. Le doublage en temps réel traduit les prochains sous-titres et les prononce sans arrêter la vidéo." },
    { title: "Peut-on doubler une vidéo sans sous-titres ?", body: "Oui, en ajoutant une étape de transcription de la parole avant la traduction et la génération de la voix." },
    { title: "Le doublage remplace-t-il la voix originale ?", body: "Il superpose généralement la voix traduite et baisse le son original pour conserver la musique et l’ambiance." },
    { title: "La traduction locale est-elle privée ?", body: "Les fonctions sur l’appareil restent locales. Les fonctions cloud transmettent au fournisseur uniquement les données nécessaires à leur exécution." },
  ],
  ctaEyebrow: "Essayez sur votre prochaine vidéo",
  ctaTitle: "Écoutez la vidéo dans votre langue.",
  ctaBody: "Installez Voxylio, choisissez une langue et lancez le doublage directement dans votre navigateur, sans télécharger la vidéo.",
  ctaInstall: "Ajouter à Chrome",
  ctaSites: "Voir les sites compatibles",
};

const de: BlogContent = {
  ...en,
  locale: "de",
  metaTitle: "Voxylio Blog — Videoübersetzung und Echtzeit-Synchronisation",
  metaDescription: "Praxisnahe Anleitungen zu Online-Videoübersetzung, KI-Synchronisation, Untertiteln, Spracherkennung und natürlichen Stimmen.",
  blogName: "Voxylio Blog", indexTitle: "Verstehe jedes Video, nicht nur jedes Wort.", indexIntro: "Praxisnahe Anleitungen zu Videoübersetzung, Echtzeit-Synchronisation, Spracherkennung und natürlichen KI-Stimmen.", latest: "Neueste Artikel", category: "Ratgeber", readTime: "{minutes} Min. Lesezeit", readGuide: "Ratgeber lesen", backToBlog: "Zurück zum Blog", inThisGuide: "In diesem Ratgeber", authorRole: "Gründer von Voxylio",
  articleTitle: "Online-Videos in Echtzeit übersetzen und synchronisieren",
  articleDescription: "Ein praktischer Leitfaden zur Übersetzung von Videoaudio während der Wiedergabe – von Untertiteln und lokalen Stimmen bis zu kontextbezogener KI und Live-Transkription.",
  articleExcerpt: "Erfahre, wie du Videos in anderen Sprachen schnell verstehst, was Echtzeit-Synchronisation benötigt und wann eine Browser-Erweiterung sinnvoll ist.", imageAlt: "Ein Online-Video wird in Echtzeit übersetzt und synchronisiert",
  intro: ["Videos in einer nur teilweise verstandenen Sprache anzusehen ist anstrengend. Untertitel helfen, teilen aber die Aufmerksamkeit zwischen Lesen und Bild. Echtzeit-Synchronisation lässt dich die Übersetzung hören, während das Video weiterläuft.", "Die beste Methode hängt von Website, Untertiteln, Sprachen sowie gewünschtem Datenschutz und Sprachqualität ab."],
  sections: [
    { id: "what-real-time-dubbing-means", title: "Was Echtzeit-Synchronisation wirklich bedeutet", paragraphs: ["Dabei wird die Videodatei normalerweise nicht verändert. Ein Werkzeug folgt der Wiedergabe, übersetzt Sprache oder Untertitel und legt eine synthetische Stimme über den leiser gestellten Originalton."], items: [{title:"Erfassen",body:"Untertitel, eingeblendeten Text oder das Audio lesen."},{title:"Verstehen",body:"Vollständige Sätze bilden und Namen, Fachbegriffe und Kontext bewahren."},{title:"Übersetzen",body:"Jeden Satz in die gewählte Sprache übertragen."},{title:"Sprechen",body:"Eine Stimme erzeugen und bei Pause, Sprung oder Tempoänderung synchron bleiben."}], ordered:true },
    { id:"choose-a-method", title:"Die richtige Übersetzungsmethode wählen", paragraphs:["Nutze zuerst die einfachste Option, die für das Video funktioniert."], items:[{title:"Plattform-Synchronisation",body:"Prüfe vorhandene Audiospuren; sehr synchron, aber nur in angebotenen Sprachen."},{title:"Übersetzte Untertitel",body:"Kostenlos und verbreitet, bei langen Tutorials jedoch anstrengender."},{title:"Dateibasierte Synchronisation",body:"Gut für veröffentlichungsfertige Creator-Versionen, benötigt aber Datei und Verarbeitungszeit."},{title:"Browser-Erweiterung",body:"Direkt für Zuschauer auf verschiedenen Websites, ohne Download."}] },
    { id:"use-voxylio", title:"Ein Online-Video mit Voxylio synchronisieren", paragraphs:["Voxylio liest verfügbare Untertitel, baut Sätze, übersetzt voraus und spricht sie in deiner Sprache."], items:[{title:"Installieren",body:"Voxylio aus dem Erweiterungs-Store hinzufügen."},{title:"Öffnen",body:"Ein unterstütztes Video starten und Untertitel aktivieren."},{title:"Auswählen",body:"Zielsprache und Stimme festlegen."},{title:"Starten",body:"Synchronisation starten; Voxylio folgt Pause und Sprüngen."}], ordered:true },
    { id:"how-it-works", title:"Warum vollständige Sätze wichtig sind", paragraphs:["Live-Untertitel kommen in Fragmenten und ändern dieselbe Zeile mehrfach. Jede Änderung einzeln zu übersetzen führt zu Wiederholungen und unnatürlichen Pausen.","Ein zuverlässiger Motor wartet auf stabile Sätze, vergibt dauerhafte IDs, übersetzt mit Kontext und verwirft veraltete Aufgaben nach einem Sprung."] },
    { id:"local-vs-cloud", title:"Lokal oder Cloud-KI", paragraphs:["Lokale Verarbeitung ist privat und günstig; Cloud-Dienste verbessern Qualität und ermöglichen Videos ohne Untertitel."], items:[{title:"Lokal",body:"Für Alltag, Datenschutz und unbegrenzte Nutzung; Qualität hängt vom Gerät ab."},{title:"Kontextübersetzung",body:"Besser für Technik, Namen und konsistente Begriffe; Internet und gemessene Nutzung erforderlich."},{title:"Neuronale Stimme",body:"Natürlichere Aussprache und Rhythmik gegen nutzungsabhängige Kosten."},{title:"Live-Transkription",body:"Für Videos ohne Untertitel, jedoch mit höherer Latenz."}] },
    { id:"common-problems", title:"Häufige Probleme", paragraphs:[], items:[{title:"Ein Satz wiederholt sich",body:"Untertitel-Revisionen müssen von neuen Sätzen unterschieden werden."},{title:"Die Stimme hängt zurück",body:"Kürzere Formulierungen, leichte Tempoanpassung oder Vorlaufpuffer helfen."},{title:"Keine Untertitel",body:"Untertitel einschalten oder einen Website-Adapter beziehungsweise Transkription nutzen."},{title:"Robotische Stimme",body:"Andere Stimme wählen und Satzzeichen erhalten."},{title:"Sprung erzeugt alte Sprache",body:"Ausstehende Übersetzungen und Audioaufträge bei jeder Positionsänderung abbrechen."}] },
  ],
  faqTitle:"Häufig gestellte Fragen", faq:[{title:"Kann ein Video während der Wiedergabe übersetzt werden?",body:"Ja. Kommende Untertitel können übersetzt und gesprochen werden, während das Video läuft."},{title:"Geht es ohne Untertitel?",body:"Ja, mit zusätzlicher Sprache-zu-Text-Transkription."},{title:"Ersetzt der Dub den Originalton?",body:"Meist wird die Übersetzung darübergelegt und der Originalton abgesenkt."},{title:"Ist lokale Übersetzung privat?",body:"Lokale Funktionen bleiben auf dem Gerät; Cloud-Funktionen senden die dafür nötigen Daten an den Anbieter."}],
  ctaEyebrow:"Probiere es beim nächsten Video", ctaTitle:"Höre das Video in deiner Sprache.", ctaBody:"Installiere Voxylio, wähle eine Sprache und starte direkt im Browser – ohne Video-Download.", ctaInstall:"Zu Chrome hinzufügen", ctaSites:"Unterstützte Websites",
};

const es: BlogContent = {
  ...en, locale:"es", metaTitle:"Blog de Voxylio — Traducción de vídeo y doblaje en tiempo real", metaDescription:"Guías prácticas sobre traducción de vídeos, doblaje con IA, subtítulos, reconocimiento de voz y voces naturales.", blogName:"Blog de Voxylio", indexTitle:"Entiende cada vídeo, no solo cada palabra.", indexIntro:"Guías prácticas sobre traducción de vídeo, doblaje en tiempo real, reconocimiento de voz y voces naturales de IA.", latest:"Últimos artículos", category:"Guía", readTime:"{minutes} min de lectura", readGuide:"Leer la guía", backToBlog:"Volver al blog", inThisGuide:"En esta guía", authorRole:"Fundador de Voxylio", articleTitle:"Cómo traducir y doblar vídeos online en tiempo real", articleDescription:"Una guía práctica para traducir el audio de un vídeo mientras se reproduce, desde subtítulos y voces locales hasta IA contextual y transcripción en directo.", articleExcerpt:"Descubre las formas más rápidas de entender un vídeo en otro idioma, qué necesita el doblaje en tiempo real y cuándo conviene una extensión.", imageAlt:"Un vídeo online traducido y doblado en tiempo real",
  intro:["Ver un vídeo en un idioma que solo entiendes en parte cansa. Los subtítulos ayudan, pero dividen tu atención entre leer y mirar. El doblaje en tiempo real te permite oír la traducción mientras el vídeo continúa.","La mejor opción depende del sitio, los subtítulos, los idiomas y el nivel de privacidad o calidad de voz que necesitas."],
  sections:[
    {id:"what-real-time-dubbing-means",title:"Qué significa realmente el doblaje en tiempo real",paragraphs:["Normalmente no modifica el archivo. Una herramienta sigue la reproducción, traduce el habla o los subtítulos y superpone una voz sintética bajando el audio original."],items:[{title:"Capturar",body:"Leer subtítulos, texto en pantalla o el propio audio."},{title:"Comprender",body:"Reconstruir frases y conservar nombres, términos y contexto."},{title:"Traducir",body:"Convertir cada frase al idioma elegido."},{title:"Hablar",body:"Generar voz y mantener la sincronización tras pausas, saltos o cambios de velocidad."}],ordered:true},
    {id:"choose-a-method",title:"Elige el método adecuado",paragraphs:["Empieza por la opción más sencilla que funcione."],items:[{title:"Doblaje de la plataforma",body:"Revisa las pistas de audio; sincroniza muy bien, pero depende del editor."},{title:"Subtítulos traducidos",body:"Son gratuitos, aunque menos cómodos en tutoriales largos."},{title:"Doblaje de archivos",body:"Ideal para creadores, pero requiere el archivo y tiempo de procesamiento."},{title:"Extensión del navegador",body:"La opción directa para espectadores en distintos sitios, sin descargas."}]},
    {id:"use-voxylio",title:"Cómo doblar un vídeo con Voxylio",paragraphs:["Voxylio lee los subtítulos disponibles, reconstruye frases, traduce por adelantado y las pronuncia en tu idioma."],items:[{title:"Instala",body:"Añade Voxylio desde la tienda de extensiones."},{title:"Abre",body:"Reproduce un vídeo compatible y activa los subtítulos."},{title:"Elige",body:"Selecciona idioma y voz."},{title:"Inicia",body:"Activa el doblaje; Voxylio sigue pausas y saltos."}],ordered:true},
    {id:"how-it-works",title:"Por qué importan las frases completas",paragraphs:["Los subtítulos en directo llegan por fragmentos y revisan una línea varias veces. Traducir cada cambio causa repeticiones y pausas extrañas.","Un motor fiable espera una frase estable, le asigna una identidad, traduce con contexto y cancela trabajos antiguos después de un salto."]},
    {id:"local-vs-cloud",title:"Procesamiento local o IA en la nube",paragraphs:["El modo local es privado y económico; la nube mejora la calidad y permite trabajar sin subtítulos."],items:[{title:"Local",body:"Para uso diario, privacidad y uso ilimitado; la calidad depende del dispositivo."},{title:"Traducción contextual",body:"Mejor para contenido técnico y terminología coherente; requiere Internet y consumo medido."},{title:"Voz neuronal",body:"Ritmo y pronunciación más naturales con coste por uso."},{title:"Transcripción en directo",body:"Para vídeos sin subtítulos, con mayor latencia."}]},
    {id:"common-problems",title:"Problemas frecuentes",paragraphs:[],items:[{title:"La frase se repite",body:"Hay que distinguir una revisión del subtítulo de una frase nueva."},{title:"La voz se retrasa",body:"Ayudan frases más cortas, velocidad suave o un búfer de anticipación."},{title:"No hay subtítulos",body:"Actívalos o usa un adaptador o transcripción de audio."},{title:"Voz robótica",body:"Cambia de voz y conserva la puntuación."},{title:"Habla después de saltar",body:"Cancela tareas pendientes cada vez que cambia la posición."}]},
  ],
  faqTitle:"Preguntas frecuentes",faq:[{title:"¿Puedo traducir un vídeo mientras se reproduce?",body:"Sí. El sistema traduce los próximos subtítulos y los pronuncia mientras continúa el vídeo."},{title:"¿Puedo doblar un vídeo sin subtítulos?",body:"Sí, añadiendo transcripción de voz a texto."},{title:"¿Sustituye la voz original?",body:"Suele superponer la traducción y bajar el audio original."},{title:"¿La traducción local es privada?",body:"Las funciones locales se quedan en el dispositivo; las de nube envían al proveedor los datos necesarios."}], ctaEyebrow:"Pruébalo en tu próximo vídeo",ctaTitle:"Escucha el vídeo en tu idioma.",ctaBody:"Instala Voxylio, elige un idioma y empieza a doblar en el navegador sin descargar el vídeo.",ctaInstall:"Añadir a Chrome",ctaSites:"Ver sitios compatibles",
};

const it: BlogContent = {
  ...en, locale:"it", metaTitle:"Blog Voxylio — Traduzione video e doppiaggio in tempo reale", metaDescription:"Guide pratiche su traduzione video, doppiaggio IA, sottotitoli, riconoscimento vocale e voci naturali.", blogName:"Blog Voxylio", indexTitle:"Comprendi ogni video, non solo ogni parola.", indexIntro:"Guide pratiche su traduzione video, doppiaggio in tempo reale, riconoscimento vocale e voci IA naturali.", latest:"Ultimi articoli", category:"Guida", readTime:"{minutes} min di lettura", readGuide:"Leggi la guida", backToBlog:"Torna al blog", inThisGuide:"In questa guida", authorRole:"Fondatore di Voxylio", articleTitle:"Come tradurre e doppiare video online in tempo reale", articleDescription:"Una guida pratica per tradurre l’audio di un video durante la riproduzione, dai sottotitoli e voci locali all’IA contestuale e alla trascrizione live.", articleExcerpt:"Scopri i modi più rapidi per capire un video in un’altra lingua, cosa richiede il doppiaggio in tempo reale e quando usare un’estensione.",imageAlt:"Un video online tradotto e doppiato in tempo reale",
  intro:["Guardare un video in una lingua che capisci solo in parte è faticoso. I sottotitoli aiutano, ma dividono l’attenzione. Il doppiaggio in tempo reale ti fa ascoltare la traduzione mentre il video continua.","La scelta migliore dipende dal sito, dai sottotitoli, dalle lingue e dalla privacy o qualità vocale desiderata."],
  sections:[
    {id:"what-real-time-dubbing-means",title:"Cosa significa davvero doppiaggio in tempo reale",paragraphs:["Di solito il file non viene modificato. Uno strumento segue la riproduzione, traduce parlato o sottotitoli e sovrappone una voce sintetica abbassando l’audio originale."],items:[{title:"Acquisire",body:"Leggere sottotitoli, testo a schermo o audio."},{title:"Comprendere",body:"Ricostruire frasi e preservare nomi, termini e contesto."},{title:"Tradurre",body:"Convertire ogni frase nella lingua scelta."},{title:"Parlare",body:"Generare la voce e restare sincronizzati dopo pause, salti o variazioni di velocità."}],ordered:true},
    {id:"choose-a-method",title:"Scegli il metodo giusto",paragraphs:["Parti dall’opzione più semplice che funziona."],items:[{title:"Doppiaggio della piattaforma",body:"Controlla le tracce audio: ottima sincronia, ma solo nelle lingue fornite."},{title:"Sottotitoli tradotti",body:"Gratuiti e diffusi, meno comodi nei tutorial lunghi."},{title:"Doppiaggio di file",body:"Per creator e risultati rifiniti, ma richiede file e tempo."},{title:"Estensione browser",body:"La via più diretta per gli spettatori su siti diversi, senza download."}]},
    {id:"use-voxylio",title:"Come doppiare un video con Voxylio",paragraphs:["Voxylio legge i sottotitoli disponibili, ricostruisce le frasi, traduce in anticipo e le pronuncia nella tua lingua."],items:[{title:"Installa",body:"Aggiungi Voxylio dallo store del browser."},{title:"Apri",body:"Riproduci un video supportato e attiva i sottotitoli."},{title:"Scegli",body:"Seleziona lingua e voce."},{title:"Avvia",body:"Avvia il doppiaggio; Voxylio segue pause e salti."}],ordered:true},
    {id:"how-it-works",title:"Perché servono frasi complete",paragraphs:["I sottotitoli live arrivano a frammenti e riscrivono la stessa riga. Tradurre ogni modifica crea ripetizioni e pause innaturali.","Un motore affidabile aspetta una frase stabile, le assegna un’identità, traduce col contesto e annulla i lavori vecchi dopo un salto."]},
    {id:"local-vs-cloud",title:"Elaborazione locale o IA cloud",paragraphs:["Il locale è privato ed economico; il cloud migliora qualità e video senza sottotitoli."],items:[{title:"Locale",body:"Per uso quotidiano, privacy e uso illimitato; dipende dal dispositivo."},{title:"Traduzione contestuale",body:"Meglio per contenuti tecnici e termini coerenti; richiede Internet e consumo misurato."},{title:"Voce neurale",body:"Ritmo e pronuncia più naturali con costo d’uso."},{title:"Trascrizione live",body:"Per video senza sottotitoli, con maggiore latenza."}]},
    {id:"common-problems",title:"Problemi comuni",paragraphs:[],items:[{title:"La frase si ripete",body:"Distinguere una revisione del sottotitolo da una nuova frase."},{title:"La voce resta indietro",body:"Usare frasi brevi, lieve accelerazione o buffer anticipato."},{title:"Nessun sottotitolo",body:"Attivarli o usare un adattatore o la trascrizione."},{title:"Voce robotica",body:"Cambiare voce e conservare la punteggiatura."},{title:"Parla dopo un salto",body:"Annullare tutte le attività in attesa quando cambia la posizione."}]},
  ],
  faqTitle:"Domande frequenti",faq:[{title:"Posso tradurre durante la riproduzione?",body:"Sì. I prossimi sottotitoli vengono tradotti e pronunciati mentre il video continua."},{title:"Posso doppiare senza sottotitoli?",body:"Sì, aggiungendo la trascrizione da voce a testo."},{title:"Sostituisce la voce originale?",body:"Di solito sovrappone la traduzione e abbassa l’audio originale."},{title:"La traduzione locale è privata?",body:"Le funzioni locali restano sul dispositivo; quelle cloud inviano solo i dati necessari."}],ctaEyebrow:"Provalo sul prossimo video",ctaTitle:"Ascolta il video nella tua lingua.",ctaBody:"Installa Voxylio, scegli una lingua e avvia il doppiaggio nel browser senza scaricare il video.",ctaInstall:"Aggiungi a Chrome",ctaSites:"Vedi siti supportati",
};

const ptBR: BlogContent = {
  ...en, locale:"pt-BR", metaTitle:"Blog Voxylio — Tradução de vídeos e dublagem em tempo real", metaDescription:"Guias práticos sobre tradução de vídeos, dublagem com IA, legendas, reconhecimento de fala e vozes naturais.", blogName:"Blog Voxylio", indexTitle:"Entenda cada vídeo, não apenas cada palavra.", indexIntro:"Guias práticos sobre tradução de vídeo, dublagem em tempo real, reconhecimento de fala e vozes naturais de IA.", latest:"Artigos mais recentes",category:"Guia",readTime:"{minutes} min de leitura",readGuide:"Ler o guia",backToBlog:"Voltar ao blog",inThisGuide:"Neste guia",authorRole:"Fundador da Voxylio",articleTitle:"Como traduzir e dublar vídeos online em tempo real",articleDescription:"Um guia prático para traduzir o áudio de um vídeo durante a reprodução, de legendas e vozes locais à IA contextual e transcrição ao vivo.",articleExcerpt:"Conheça as formas mais rápidas de entender um vídeo em outro idioma, o que a dublagem em tempo real exige e quando usar uma extensão.",imageAlt:"Um vídeo online traduzido e dublado em tempo real",
  intro:["Assistir a um vídeo em um idioma que você entende só em parte é cansativo. As legendas ajudam, mas dividem sua atenção. A dublagem em tempo real permite ouvir a tradução enquanto o vídeo continua.","A melhor opção depende do site, das legendas, dos idiomas e da privacidade ou qualidade de voz desejada."],
  sections:[
    {id:"what-real-time-dubbing-means",title:"O que dublagem em tempo real realmente significa",paragraphs:["Normalmente o arquivo não é alterado. Uma ferramenta acompanha a reprodução, traduz fala ou legendas e sobrepõe uma voz sintetizada, reduzindo o áudio original."],items:[{title:"Capturar",body:"Ler legendas, texto na tela ou o próprio áudio."},{title:"Entender",body:"Reconstruir frases e preservar nomes, termos e contexto."},{title:"Traduzir",body:"Converter cada frase para o idioma escolhido."},{title:"Falar",body:"Gerar a voz e manter a sincronia após pausas, saltos ou mudanças de velocidade."}],ordered:true},
    {id:"choose-a-method",title:"Escolha o método certo",paragraphs:["Comece pela opção mais simples que funcionar."],items:[{title:"Dublagem da plataforma",body:"Confira as faixas de áudio; ótima sincronia, mas só nos idiomas fornecidos."},{title:"Legendas traduzidas",body:"Gratuitas e comuns, porém menos confortáveis em tutoriais longos."},{title:"Dublagem de arquivo",body:"Boa para criadores, mas exige o arquivo e tempo de processamento."},{title:"Extensão do navegador",body:"A opção direta para espectadores em sites diferentes, sem download."}]},
    {id:"use-voxylio",title:"Como dublar um vídeo com Voxylio",paragraphs:["A Voxylio lê as legendas disponíveis, reconstrói frases, traduz com antecedência e fala no seu idioma."],items:[{title:"Instale",body:"Adicione a Voxylio pela loja do navegador."},{title:"Abra",body:"Reproduza um vídeo compatível e ative as legendas."},{title:"Escolha",body:"Selecione idioma e voz."},{title:"Inicie",body:"Ative a dublagem; a Voxylio acompanha pausas e saltos."}],ordered:true},
    {id:"how-it-works",title:"Por que frases completas importam",paragraphs:["Legendas ao vivo chegam em fragmentos e reescrevem a mesma linha. Traduzir cada mudança gera repetições e pausas artificiais.","Um motor confiável espera uma frase estável, dá a ela uma identidade, traduz com contexto e cancela tarefas antigas após um salto."]},
    {id:"local-vs-cloud",title:"Processamento local ou IA na nuvem",paragraphs:["O modo local é privado e econômico; a nuvem melhora a qualidade e atende vídeos sem legenda."],items:[{title:"Local",body:"Para uso diário, privacidade e uso ilimitado; depende do dispositivo."},{title:"Tradução contextual",body:"Melhor para conteúdo técnico e termos consistentes; exige Internet e uso medido."},{title:"Voz neural",body:"Ritmo e pronúncia mais naturais com custo por uso."},{title:"Transcrição ao vivo",body:"Para vídeos sem legendas, com latência maior."}]},
    {id:"common-problems",title:"Problemas comuns",paragraphs:[],items:[{title:"A frase se repete",body:"É preciso diferenciar uma revisão da legenda de uma frase nova."},{title:"A voz atrasa",body:"Use frases curtas, leve ajuste de velocidade ou buffer antecipado."},{title:"Sem legendas",body:"Ative-as ou use um adaptador ou transcrição."},{title:"Voz robótica",body:"Troque a voz e preserve a pontuação."},{title:"Fala após avançar",body:"Cancele tarefas pendentes sempre que a posição mudar."}]},
  ],
  faqTitle:"Perguntas frequentes",faq:[{title:"Posso traduzir durante a reprodução?",body:"Sim. As próximas legendas podem ser traduzidas e faladas enquanto o vídeo continua."},{title:"Posso dublar sem legendas?",body:"Sim, adicionando transcrição de fala para texto."},{title:"Substitui a voz original?",body:"Geralmente sobrepõe a tradução e reduz o áudio original."},{title:"A tradução local é privada?",body:"Funções locais ficam no dispositivo; funções em nuvem enviam apenas os dados necessários."}],ctaEyebrow:"Teste no seu próximo vídeo",ctaTitle:"Ouça o vídeo no seu idioma.",ctaBody:"Instale a Voxylio, escolha um idioma e comece a dublar no navegador sem baixar o vídeo.",ctaInstall:"Adicionar ao Chrome",ctaSites:"Ver sites compatíveis",
};

const ja: BlogContent = {
  ...en, locale:"ja", metaTitle:"Voxylioブログ — 動画翻訳とリアルタイム吹き替え",metaDescription:"オンライン動画翻訳、AIリアルタイム吹き替え、字幕、音声認識、自然な音声の実践ガイド。",blogName:"Voxylioブログ",indexTitle:"言葉だけでなく、動画のすべてを理解する。",indexIntro:"動画翻訳、リアルタイム吹き替え、音声認識、自然なAI音声についての実践ガイド。",latest:"最新の記事",category:"ガイド",readTime:"読了時間 {minutes}分",readGuide:"ガイドを読む",backToBlog:"ブログに戻る",inThisGuide:"このガイドの内容",authorRole:"Voxylio創業者",articleTitle:"オンライン動画をリアルタイムで翻訳・吹き替えする方法",articleDescription:"字幕や端末内音声から、文脈を理解するAI翻訳とライブ文字起こしまで、再生中の動画音声を翻訳するための実践ガイド。",articleExcerpt:"外国語の動画をすばやく理解する方法、リアルタイム吹き替えに必要な技術、ブラウザ拡張が適する場面を解説します。",imageAlt:"オンライン動画がリアルタイムで翻訳・吹き替えされているイメージ",
  intro:["十分に理解できない言語の動画を見続けるのは疲れます。字幕は役立ちますが、読むことと映像を見ることに注意が分かれます。リアルタイム吹き替えなら、再生を続けながら翻訳音声を聞けます。","最適な方法は、サイト、字幕の有無、言語、プライバシーや音声品質によって変わります。"],
  sections:[
    {id:"what-real-time-dubbing-means",title:"リアルタイム動画吹き替えとは",paragraphs:["通常、動画ファイル自体は変更しません。ツールが再生位置を追い、発話や字幕を翻訳し、元の音量を下げて合成音声を重ねます。"],items:[{title:"取得",body:"字幕トラック、画面上の文字、または音声を読み取る。"},{title:"理解",body:"完全な文を組み立て、固有名詞、用語、文脈を保つ。"},{title:"翻訳",body:"各文を視聴者が選んだ言語に変換する。"},{title:"発話",body:"音声を生成し、一時停止やシーク、速度変更にも同期する。"}],ordered:true},
    {id:"choose-a-method",title:"適切な翻訳方法を選ぶ",paragraphs:["その動画で使える最も簡単な方法から試しましょう。"],items:[{title:"配信サービスの吹き替え",body:"音声トラックを確認。同期は最良ですが、配信者が用意した言語に限られます。"},{title:"翻訳字幕",body:"無料で広く使えますが、長い解説動画では負担になります。"},{title:"ファイル吹き替え",body:"公開用の高品質版を作る制作者向けで、ファイルと処理時間が必要です。"},{title:"ブラウザ拡張",body:"ダウンロードせず、複数サイトの動画を理解したい視聴者に最適です。"}]},
    {id:"use-voxylio",title:"Voxylioで動画を吹き替える",paragraphs:["Voxylioは利用可能な字幕を読み、文を再構成し、先読み翻訳して選んだ言語で発話します。"],items:[{title:"インストール",body:"ブラウザの拡張ストアからVoxylioを追加。"},{title:"開く",body:"対応動画を再生し、字幕を有効にする。"},{title:"選ぶ",body:"翻訳先言語と音声を選択。"},{title:"開始",body:"吹き替えを開始。停止やシークにも追従します。"}],ordered:true},
    {id:"how-it-works",title:"完全な文が重要な理由",paragraphs:["ライブ字幕は断片的に届き、同じ行を何度も更新します。更新ごとに翻訳すると、重複や不自然な間が生じます。","安定した文を待ち、固有IDを与え、周辺文脈とともに一度だけ翻訳し、シーク時に古い処理を破棄する必要があります。"]},
    {id:"local-vs-cloud",title:"端末内処理とクラウドAI",paragraphs:["端末内処理はプライバシーとコストに優れ、クラウドは品質向上と字幕なし動画に役立ちます。"],items:[{title:"端末内",body:"日常利用、プライバシー、無制限利用向け。品質は端末に依存。"},{title:"文脈翻訳",body:"専門内容や用語の一貫性に強い。インターネットと従量処理が必要。"},{title:"ニューラル音声",body:"より自然なリズムと発音を従量料金で提供。"},{title:"ライブ文字起こし",body:"字幕のない動画に対応するが、遅延が増えます。"}]},
    {id:"common-problems",title:"よくある問題",paragraphs:[],items:[{title:"同じ文が繰り返される",body:"字幕の更新と新しい文を区別する必要があります。"},{title:"音声が遅れる",body:"短い表現、わずかな速度調整、先読みバッファが有効です。"},{title:"字幕を検出できない",body:"字幕を有効にするか、専用アダプターや文字起こしを使います。"},{title:"声が機械的",body:"別の音声を選び、句読点を維持します。"},{title:"シーク後に古い音声が流れる",body:"位置変更時に保留中の処理をすべて中止します。"}]},
  ],
  faqTitle:"よくある質問",faq:[{title:"再生中に翻訳できますか？",body:"はい。次の字幕を翻訳し、動画を止めずに音声で再生できます。"},{title:"字幕なしでも吹き替えできますか？",body:"はい。翻訳前に音声文字起こしを追加します。"},{title:"元の声は消えますか？",body:"通常は元音声を小さくし、翻訳音声を重ねます。"},{title:"端末内翻訳は安全ですか？",body:"端末内機能はローカルに留まり、クラウド機能は必要なデータのみを事業者へ送ります。"}],ctaEyebrow:"次の動画で試す",ctaTitle:"動画をあなたの言語で聞こう。",ctaBody:"Voxylioをインストールして言語を選ぶだけ。動画をダウンロードせずブラウザで吹き替えできます。",ctaInstall:"Chromeに追加",ctaSites:"対応サイトを見る",
};

const ko: BlogContent = {
  ...en,locale:"ko",metaTitle:"Voxylio 블로그 — 동영상 번역과 실시간 더빙",metaDescription:"온라인 동영상 번역, AI 실시간 더빙, 자막, 음성 인식과 자연스러운 음성에 관한 실용 가이드.",blogName:"Voxylio 블로그",indexTitle:"단어만이 아니라 영상 전체를 이해하세요.",indexIntro:"동영상 번역, 실시간 더빙, 음성 인식과 자연스러운 AI 음성에 관한 실용 가이드.",latest:"최신 글",category:"가이드",readTime:"{minutes}분 읽기",readGuide:"가이드 읽기",backToBlog:"블로그로 돌아가기",inThisGuide:"가이드 목차",authorRole:"Voxylio 창립자",articleTitle:"온라인 동영상을 실시간으로 번역하고 더빙하는 방법",articleDescription:"자막과 로컬 음성부터 문맥형 AI 번역과 실시간 전사까지, 재생 중인 동영상 음성을 번역하는 실용 가이드입니다.",articleExcerpt:"외국어 동영상을 빠르게 이해하는 방법, 실시간 더빙에 필요한 요소, 브라우저 확장이 알맞은 경우를 알아보세요.",imageAlt:"온라인 동영상이 실시간으로 번역되고 더빙되는 모습",
  intro:["완전히 이해하지 못하는 언어로 영상을 보는 일은 피곤합니다. 자막은 도움이 되지만 읽기와 시청에 주의가 나뉩니다. 실시간 더빙은 영상이 계속 재생되는 동안 번역 음성을 들려줍니다.","최적의 방법은 웹사이트, 자막 유무, 언어, 개인정보 보호와 음성 품질 요구에 따라 달라집니다."],
  sections:[
    {id:"what-real-time-dubbing-means",title:"실시간 동영상 더빙의 실제 의미",paragraphs:["보통 영상 파일 자체를 바꾸지 않습니다. 도구가 재생 위치를 따라 말이나 자막을 번역하고 원본 소리를 낮춘 뒤 합성 음성을 겹칩니다."],items:[{title:"수집",body:"자막 트랙, 화면 글자 또는 오디오를 읽습니다."},{title:"이해",body:"완전한 문장을 만들고 이름, 용어와 문맥을 유지합니다."},{title:"번역",body:"각 문장을 시청자가 선택한 언어로 바꿉니다."},{title:"발화",body:"음성을 만들고 일시 정지, 탐색, 속도 변경에도 동기화합니다."}],ordered:true},
    {id:"choose-a-method",title:"알맞은 번역 방법 선택",paragraphs:["해당 영상에서 작동하는 가장 간단한 방법부터 시작하세요."],items:[{title:"플랫폼 더빙",body:"오디오 트랙을 먼저 확인하세요. 동기화는 좋지만 제공된 언어만 가능합니다."},{title:"번역 자막",body:"무료이고 널리 쓰이지만 긴 강의에는 불편할 수 있습니다."},{title:"파일 기반 더빙",body:"제작자의 완성본에는 좋지만 파일과 처리 시간이 필요합니다."},{title:"브라우저 확장",body:"다운로드 없이 여러 사이트 영상을 이해하려는 시청자에게 직접적인 방법입니다."}]},
    {id:"use-voxylio",title:"Voxylio로 온라인 영상 더빙하기",paragraphs:["Voxylio는 사용 가능한 자막을 읽고 문장을 재구성한 뒤 미리 번역하여 선택한 언어로 말합니다."],items:[{title:"설치",body:"브라우저 확장 스토어에서 Voxylio를 추가합니다."},{title:"열기",body:"지원 영상을 재생하고 자막을 켭니다."},{title:"선택",body:"대상 언어와 음성을 고릅니다."},{title:"시작",body:"더빙을 시작하면 일시 정지와 탐색을 따라갑니다."}],ordered:true},
    {id:"how-it-works",title:"완전한 문장이 중요한 이유",paragraphs:["실시간 자막은 조각으로 들어오며 같은 줄을 여러 번 수정합니다. 수정할 때마다 번역하면 반복과 부자연스러운 멈춤이 생깁니다.","안정된 문장을 기다리고 고유 ID를 부여하며 주변 문맥과 번역하고, 탐색 후에는 오래된 작업을 취소해야 합니다."]},
    {id:"local-vs-cloud",title:"로컬 처리와 클라우드 AI",paragraphs:["로컬 처리는 사생활과 비용에 유리하고, 클라우드는 품질과 자막 없는 영상 지원을 높입니다."],items:[{title:"기기 내 처리",body:"일상, 개인정보 보호와 무제한 사용에 적합하며 품질은 기기에 따라 다릅니다."},{title:"문맥 번역",body:"기술 내용과 일관된 용어에 유리하며 인터넷과 사용량 측정이 필요합니다."},{title:"신경망 음성",body:"더 자연스러운 리듬과 발음을 사용량 비용으로 제공합니다."},{title:"실시간 전사",body:"자막 없는 영상에 쓰지만 지연이 커집니다."}]},
    {id:"common-problems",title:"흔한 문제",paragraphs:[],items:[{title:"문장이 반복됨",body:"자막 수정과 새 문장을 구분해야 합니다."},{title:"음성이 늦음",body:"짧은 표현, 약한 속도 조절 또는 선행 버퍼를 사용합니다."},{title:"자막 미감지",body:"자막을 켜거나 전용 어댑터 또는 전사를 사용합니다."},{title:"로봇 같은 음성",body:"다른 음성을 선택하고 문장부호를 유지합니다."},{title:"탐색 후 이전 음성 재생",body:"위치가 바뀔 때 대기 작업을 모두 취소합니다."}]},
  ],
  faqTitle:"자주 묻는 질문",faq:[{title:"재생 중에 번역할 수 있나요?",body:"네. 다음 자막을 번역해 영상이 계속되는 동안 말할 수 있습니다."},{title:"자막이 없어도 더빙할 수 있나요?",body:"네. 번역 전에 음성-텍스트 전사를 추가합니다."},{title:"원본 음성을 대체하나요?",body:"보통 번역 음성을 겹치고 원본 소리를 낮춥니다."},{title:"로컬 번역은 비공개인가요?",body:"기기 내 기능은 로컬에 남고 클라우드 기능은 필요한 데이터만 공급자에게 보냅니다."}],ctaEyebrow:"다음 영상에서 사용해 보세요",ctaTitle:"영상을 내 언어로 들으세요.",ctaBody:"Voxylio를 설치하고 언어를 선택해 다운로드 없이 브라우저에서 더빙하세요.",ctaInstall:"Chrome에 추가",ctaSites:"지원 사이트 보기",
};

const zhCN: BlogContent = {
  ...en,locale:"zh-CN",metaTitle:"Voxylio 博客 — 视频翻译与实时配音",metaDescription:"关于在线视频翻译、AI 实时配音、字幕、语音识别和自然语音的实用指南。",blogName:"Voxylio 博客",indexTitle:"理解整段视频，而不只是每个单词。",indexIntro:"视频翻译、实时配音、语音识别和自然 AI 语音的实用指南。",latest:"最新文章",category:"指南",readTime:"阅读约 {minutes} 分钟",readGuide:"阅读指南",backToBlog:"返回博客",inThisGuide:"本指南内容",authorRole:"Voxylio 创始人",articleTitle:"如何实时翻译并配音在线视频",articleDescription:"从字幕和本地语音到上下文 AI 翻译与实时转写，了解如何在视频播放时翻译其音频。",articleExcerpt:"了解快速听懂外语视频的方法、实时配音需要什么，以及何时适合使用浏览器扩展。",imageAlt:"在线视频正在被实时翻译和配音",
  intro:["观看一种只能部分理解的语言视频很累。字幕虽然有帮助，却会让注意力在阅读与画面之间切换。实时配音让你在视频继续播放时直接听到译文。","最佳方法取决于网站、字幕、语言，以及你对隐私和声音质量的要求。"],
  sections:[
    {id:"what-real-time-dubbing-means",title:"实时视频配音究竟是什么",paragraphs:["它通常不会修改视频文件。工具跟随播放进度，翻译语音或字幕，在降低原声的同时叠加合成语音。"],items:[{title:"采集",body:"读取字幕轨、屏幕文字或音频。"},{title:"理解",body:"重组完整句子并保留名称、术语和上下文。"},{title:"翻译",body:"将每句话转换为观众选择的语言。"},{title:"朗读",body:"生成语音，并在暂停、跳转或变速后保持同步。"}],ordered:true},
    {id:"choose-a-method",title:"选择合适的翻译方式",paragraphs:["先尝试对当前视频有效的最简单方式。"],items:[{title:"平台自带配音",body:"先检查音轨；同步最好，但仅限发布者提供的语言。"},{title:"翻译字幕",body:"免费且常见，但长教程中阅读负担较大。"},{title:"文件配音",body:"适合创作者制作精细版本，但需要文件和处理时间。"},{title:"浏览器扩展",body:"适合观众在多个网站直接理解视频，无需下载。"}]},
    {id:"use-voxylio",title:"使用 Voxylio 为在线视频配音",paragraphs:["Voxylio 读取可用字幕，重组句子，提前翻译并用你的语言朗读。"],items:[{title:"安装",body:"从浏览器扩展商店添加 Voxylio。"},{title:"打开",body:"播放受支持的视频并开启字幕。"},{title:"选择",body:"选择目标语言和声音。"},{title:"开始",body:"启动配音；Voxylio 会跟随暂停和跳转。"}],ordered:true},
    {id:"how-it-works",title:"为什么完整句子很重要",paragraphs:["实时字幕常以片段到达，并多次改写同一行。逐次翻译会造成重复和不自然停顿。","可靠的引擎会等待稳定句子、分配持久标识、结合上下文只翻译一次，并在跳转后取消旧任务。"]},
    {id:"local-vs-cloud",title:"本地处理与云端 AI",paragraphs:["本地处理更私密、成本更低；云服务提升质量并支持无字幕视频。"],items:[{title:"设备端",body:"适合日常、隐私和无限使用；质量取决于设备。"},{title:"上下文翻译",body:"更适合技术内容和术语一致性；需要联网并计量。"},{title:"神经语音",body:"以使用成本换取更自然的节奏和发音。"},{title:"实时转写",body:"支持无字幕视频，但延迟更高。"}]},
    {id:"common-problems",title:"常见问题",paragraphs:[],items:[{title:"同一句重复",body:"必须区分字幕修订和新句子。"},{title:"语音落后",body:"使用更短表达、轻微调速或前瞻缓冲。"},{title:"未检测到字幕",body:"开启字幕，或使用专用适配器或转写。"},{title:"声音像机器人",body:"更换声音并保留标点。"},{title:"跳转后播放旧语音",body:"位置变化时取消所有待处理任务。"}]},
  ],
  faqTitle:"常见问题",faq:[{title:"可以边播放边翻译吗？",body:"可以。系统能翻译接下来的字幕，并在视频继续播放时朗读。"},{title:"没有字幕也能配音吗？",body:"可以，需要先增加语音转文字步骤。"},{title:"会替换原声吗？",body:"通常会叠加译文语音并降低原声。"},{title:"本地翻译保护隐私吗？",body:"设备端功能保留在本地；云功能仅发送完成该功能所需的数据。"}],ctaEyebrow:"在下一段视频中试试",ctaTitle:"用你的语言听视频。",ctaBody:"安装 Voxylio，选择语言，无需下载即可直接在浏览器中开始配音。",ctaInstall:"添加至 Chrome",ctaSites:"查看支持的网站",
};

const zhTW: BlogContent = {
  ...zhCN,locale:"zh-TW",metaTitle:"Voxylio 部落格 — 影片翻譯與即時配音",metaDescription:"關於線上影片翻譯、AI 即時配音、字幕、語音辨識與自然語音的實用指南。",blogName:"Voxylio 部落格",indexTitle:"理解整段影片，而不只是每個單字。",indexIntro:"影片翻譯、即時配音、語音辨識與自然 AI 語音的實用指南。",latest:"最新文章",category:"指南",readTime:"閱讀約 {minutes} 分鐘",readGuide:"閱讀指南",backToBlog:"返回部落格",inThisGuide:"本指南內容",authorRole:"Voxylio 創辦人",articleTitle:"如何即時翻譯並配音線上影片",articleDescription:"從字幕和本機語音到情境 AI 翻譯與即時轉錄，了解如何在影片播放時翻譯其音訊。",articleExcerpt:"了解快速聽懂外語影片的方法、即時配音所需技術，以及何時適合使用瀏覽器擴充功能。",imageAlt:"線上影片正在即時翻譯與配音",
  intro:["觀看只能部分理解的語言影片很累。字幕雖有幫助，卻會讓注意力在閱讀與畫面之間切換。即時配音讓你在影片繼續播放時直接聽到譯文。","最佳方法取決於網站、字幕、語言，以及你對隱私和聲音品質的需求。"],
  sections:[
    {id:"what-real-time-dubbing-means",title:"即時影片配音究竟是什麼",paragraphs:["它通常不會修改影片檔案。工具會跟隨播放進度，翻譯語音或字幕，在降低原聲的同時疊加合成語音。"],items:[{title:"擷取",body:"讀取字幕軌、畫面文字或音訊。"},{title:"理解",body:"重組完整句子並保留名稱、術語和上下文。"},{title:"翻譯",body:"將每句話轉換為觀眾選擇的語言。"},{title:"朗讀",body:"產生語音，並在暫停、跳轉或變速後保持同步。"}],ordered:true},
    {id:"choose-a-method",title:"選擇合適的翻譯方式",paragraphs:["先嘗試對目前影片有效的最簡單方式。"],items:[{title:"平台內建配音",body:"先檢查音軌；同步最佳，但僅限發佈者提供的語言。"},{title:"翻譯字幕",body:"免費且常見，但長篇教學中閱讀負擔較大。"},{title:"檔案配音",body:"適合創作者製作精緻版本，但需要檔案與處理時間。"},{title:"瀏覽器擴充功能",body:"適合觀眾在多個網站直接理解影片，無需下載。"}]},
    {id:"use-voxylio",title:"使用 Voxylio 為線上影片配音",paragraphs:["Voxylio 讀取可用字幕，重組句子，預先翻譯並用你的語言朗讀。"],items:[{title:"安裝",body:"從瀏覽器擴充功能商店加入 Voxylio。"},{title:"開啟",body:"播放支援的影片並開啟字幕。"},{title:"選擇",body:"選擇目標語言和聲音。"},{title:"開始",body:"啟動配音；Voxylio 會跟隨暫停與跳轉。"}],ordered:true},
    {id:"how-it-works",title:"為什麼完整句子很重要",paragraphs:["即時字幕常以片段抵達，並多次改寫同一行。逐次翻譯會造成重複和不自然的停頓。","可靠的引擎會等待穩定句子、分配持久識別碼、結合上下文只翻譯一次，並在跳轉後取消舊工作。"]},
    {id:"local-vs-cloud",title:"本機處理與雲端 AI",paragraphs:["本機處理更私密、成本更低；雲端服務可提升品質並支援無字幕影片。"],items:[{title:"裝置端",body:"適合日常、隱私和無限使用；品質取決於裝置。"},{title:"上下文翻譯",body:"更適合技術內容和術語一致性；需要連網並計量。"},{title:"神經語音",body:"以使用成本換取更自然的節奏與發音。"},{title:"即時轉錄",body:"支援無字幕影片，但延遲較高。"}]},
    {id:"common-problems",title:"常見問題",paragraphs:[],items:[{title:"同一句重複",body:"必須區分字幕修訂和新句子。"},{title:"語音落後",body:"使用較短的表達、輕微調速或預讀緩衝。"},{title:"未偵測到字幕",body:"開啟字幕，或使用專用轉接器或轉錄。"},{title:"聲音像機器人",body:"更換聲音並保留標點符號。"},{title:"跳轉後播放舊語音",body:"位置變更時取消所有待處理工作。"}]},
  ],
  faqTitle:"常見問題",faq:[{title:"可以邊播放邊翻譯嗎？",body:"可以。系統能翻譯接下來的字幕，並在影片繼續播放時朗讀。"},{title:"沒有字幕也能配音嗎？",body:"可以，需要先增加語音轉文字步驟。"},{title:"會取代原聲嗎？",body:"通常會疊加譯文語音並降低原聲。"},{title:"本機翻譯保護隱私嗎？",body:"裝置端功能保留在本機；雲端功能只傳送完成該功能所需的資料。"}],ctaEyebrow:"在下一段影片中試試",ctaTitle:"用你的語言聽影片。",ctaBody:"安裝 Voxylio，選擇語言，無需下載即可直接在瀏覽器中開始配音。",ctaInstall:"加到 Chrome",ctaSites:"查看支援的網站",
};

export const BLOG_CONTENT: Record<BlogLocale, BlogContent> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  ko,
  fr,
  de,
  es,
  it,
  "pt-BR": ptBR,
};

export function getBlogContent(locale: string): BlogContent {
  return BLOG_CONTENT[locale as BlogLocale] ?? en;
}
