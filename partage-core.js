/*
 * Savora — pages de partage (site/l/ : une adresse ; site/p/ : un carnet ou une collection publics).
 * Module PUR : lecture et validation de l'URL, construction des liens, mise en forme des données reçues.
 * Aucun accès au DOM ici — la page (`partage-page.js`) construit l'affichage par `textContent` / `createElement`,
 * jamais `innerHTML`. Importé tel quel par Jest (`src/features/share/__tests__/sitePartage.test.ts`).
 *
 * Tout ce qui vient de l'URL ou de la base est du texte libre écrit par n'importe qui : nettoyé (caractères de
 * contrôle et de direction retirés), borné en longueur, et jamais utilisé tel quel comme lien — les liens sont
 * construits sur des bases fixes avec `encodeURIComponent`, puis leur schéma est vérifié (`https:` ou `savora:`).
 *
 * Les libellés de types et de cuisines (LABELS) sont recopiés de `src/lib/i18n/locales/*.json` ; le test vérifie
 * qu'ils sont identiques.
 */
(function (root, factory) {
  let api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.SavoraPartage = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  let LANGS = ['fr', 'en', 'de', 'it'];
  let TESTFLIGHT_URL = 'https://testflight.apple.com/join/EVuXnhQb';
  let APP_URL = 'savora://';

  let MAX = { name: 120, city: 80, address: 200, title: 60, username: 40, displayName: 60, excerpt: 280 };
  let MAX_CUISINES = 3;
  let MAX_PLACES = 500;

  let PLACE_TYPES = ['restaurant', 'cafe', 'bar', 'street_food', 'brunch', 'gastronomique'];
  let CATEGORY_KEYS = ['aime', 'pas_aime', 'a_tester'];
  let UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /* LABELS:BEGIN — généré depuis src/lib/i18n/locales/*.json (common.placeTypes, common.cuisines, categories) */
  let LABELS = {
    "placeTypes": {
      "fr": {
        "restaurant": "Restaurant",
        "cafe": "Café",
        "bar": "Bar",
        "street_food": "Street food / Fast-food",
        "brunch": "Brunch / Petit-déj",
        "gastronomique": "Gastronomique"
      },
      "en": {
        "restaurant": "Restaurant",
        "cafe": "Cafe",
        "bar": "Bar",
        "street_food": "Street food / Fast food",
        "brunch": "Brunch / Breakfast",
        "gastronomique": "Fine dining"
      },
      "de": {
        "restaurant": "Restaurant",
        "cafe": "Café",
        "bar": "Bar",
        "street_food": "Streetfood / Fastfood",
        "brunch": "Brunch / Frühstück",
        "gastronomique": "Gourmet"
      },
      "it": {
        "restaurant": "Ristorante",
        "cafe": "Caffè",
        "bar": "Bar",
        "street_food": "Street food / Fast food",
        "brunch": "Brunch / Colazione",
        "gastronomique": "Alta cucina"
      }
    },
    "cuisines": {
      "fr": {
        "italienne": "Italienne",
        "pizza": "Pizza",
        "japonaise": "Japonaise",
        "mexicaine": "Mexicaine",
        "indienne": "Indienne",
        "thailandaise": "Thaïlandaise",
        "americaine": "Américaine",
        "burger": "Burger",
        "libanaise": "Libanaise",
        "espagnole": "Espagnole",
        "grecque": "Grecque",
        "francaise": "Française",
        "vietnamienne": "Vietnamienne",
        "moyen_orientale": "Moyen-Orientale",
        "chinoise": "Chinoise",
        "coreenne": "Coréenne",
        "marocaine": "Marocaine",
        "asiatique": "Asiatique",
        "vegetarienne": "Végétarienne",
        "mediterraneenne": "Méditerranéenne",
        "africaine": "Africaine",
        "allemande": "Allemande",
        "bresilienne": "Brésilienne",
        "desserts": "Desserts",
        "fruits_de_mer": "Fruits de mer",
        "portugaise": "Portugaise",
        "turque": "Turque",
        "cafe": "Café",
        "brunch": "Brunch"
      },
      "en": {
        "italienne": "Italian",
        "pizza": "Pizza",
        "japonaise": "Japanese",
        "mexicaine": "Mexican",
        "indienne": "Indian",
        "thailandaise": "Thai",
        "americaine": "American",
        "burger": "Burger",
        "libanaise": "Lebanese",
        "espagnole": "Spanish",
        "grecque": "Greek",
        "francaise": "French",
        "vietnamienne": "Vietnamese",
        "moyen_orientale": "Middle Eastern",
        "chinoise": "Chinese",
        "coreenne": "Korean",
        "marocaine": "Moroccan",
        "asiatique": "Asian",
        "vegetarienne": "Vegetarian",
        "mediterraneenne": "Mediterranean",
        "africaine": "African",
        "allemande": "German",
        "bresilienne": "Brazilian",
        "desserts": "Desserts",
        "fruits_de_mer": "Seafood",
        "portugaise": "Portuguese",
        "turque": "Turkish",
        "cafe": "Coffee shop",
        "brunch": "Brunch"
      },
      "de": {
        "italienne": "Italienisch",
        "pizza": "Pizza",
        "japonaise": "Japanisch",
        "mexicaine": "Mexikanisch",
        "indienne": "Indisch",
        "thailandaise": "Thailändisch",
        "americaine": "Amerikanisch",
        "burger": "Burger",
        "libanaise": "Libanesisch",
        "espagnole": "Spanisch",
        "grecque": "Griechisch",
        "francaise": "Französisch",
        "vietnamienne": "Vietnamesisch",
        "moyen_orientale": "Nahöstlich",
        "chinoise": "Chinesisch",
        "coreenne": "Koreanisch",
        "marocaine": "Marokkanisch",
        "asiatique": "Asiatisch",
        "vegetarienne": "Vegetarisch",
        "mediterraneenne": "Mediterran",
        "africaine": "Afrikanisch",
        "allemande": "Deutsch",
        "bresilienne": "Brasilianisch",
        "desserts": "Desserts",
        "fruits_de_mer": "Meeresfrüchte",
        "portugaise": "Portugiesisch",
        "turque": "Türkisch",
        "cafe": "Café",
        "brunch": "Brunch"
      },
      "it": {
        "italienne": "Italiana",
        "pizza": "Pizza",
        "japonaise": "Giapponese",
        "mexicaine": "Messicana",
        "indienne": "Indiana",
        "thailandaise": "Thailandese",
        "americaine": "Americana",
        "burger": "Burger",
        "libanaise": "Libanese",
        "espagnole": "Spagnola",
        "grecque": "Greca",
        "francaise": "Francese",
        "vietnamienne": "Vietnamita",
        "moyen_orientale": "Mediorientale",
        "chinoise": "Cinese",
        "coreenne": "Coreana",
        "marocaine": "Marocchina",
        "asiatique": "Asiatica",
        "vegetarienne": "Vegetariana",
        "mediterraneenne": "Mediterranea",
        "africaine": "Africana",
        "allemande": "Tedesca",
        "bresilienne": "Brasiliana",
        "desserts": "Dessert",
        "fruits_de_mer": "Frutti di mare",
        "portugaise": "Portoghese",
        "turque": "Turca",
        "cafe": "Caffè",
        "brunch": "Brunch"
      }
    },
    "categories": {
      "fr": {
        "aime": "Aimé",
        "pas_aime": "Pas aimé",
        "a_tester": "À tester"
      },
      "en": {
        "aime": "Liked",
        "pas_aime": "Didn't like",
        "a_tester": "To try"
      },
      "de": {
        "aime": "Gefallen",
        "pas_aime": "Nicht gefallen",
        "a_tester": "Zu testen"
      },
      "it": {
        "aime": "Piaciuto",
        "pas_aime": "Non piaciuto",
        "a_tester": "Da provare"
      }
    }
  };
  /* LABELS:END */

  let TEXTS = {
    fr: {
      sharedBy: 'Partagé par {name}',
      placeBadge: 'Adresse', directions: 'Itinéraire', plans: 'Plans', google: 'Google Maps',
      open: 'Ouvrir dans Savora', download: 'Télécharger Savora',
      downloadNote: 'Savora est en test sur iPhone : le lien t’invite à la version d’essai (TestFlight).',
      incompleteTitle: 'Ce lien est incomplet',
      incompleteText: 'Il manque le nom de l’adresse. Demande à la personne de te la renvoyer depuis l’app Savora.',
      carnetBadge: 'Carnet', collectionBadge: 'Collection',
      carnetTitle: 'Les adresses de {name}',
      loading: 'Chargement…',
      neutralTitle: 'Rien à afficher ici',
      neutralText: 'Cette page n’est pas publique, ou elle n’est pas encore disponible. Les adresses restent dans l’app Savora.',
      networkTitle: 'Impossible de charger cette page',
      networkText: 'Vérifie ta connexion, puis recharge la page.',
      unavailableTitle: 'Cette page est indisponible pour le moment',
      unavailableText: 'Réessaie un peu plus tard. Les adresses restent dans l’app Savora.',
      emptyShelf: 'Aucune adresse pour l’instant.',
      count_one: '{count} adresse', count_other: '{count} adresses',
      devise: 'Savora · Le plaisir de bien manger', confidentialite: 'Confidentialité', cgu: 'Conditions d’utilisation'
    },
    en: {
      sharedBy: 'Shared by {name}',
      placeBadge: 'Address', directions: 'Directions', plans: 'Apple Maps', google: 'Google Maps',
      open: 'Open in Savora', download: 'Download Savora',
      downloadNote: 'Savora is in beta on iPhone: the link invites you to the test version (TestFlight).',
      incompleteTitle: 'This link is incomplete',
      incompleteText: 'The name of the place is missing. Ask the person to send it again from the Savora app.',
      carnetBadge: 'Notebook', collectionBadge: 'Collection',
      carnetTitle: '{name}’s places',
      loading: 'Loading…',
      neutralTitle: 'Nothing to show here',
      neutralText: 'This page is not public, or it is not available yet. The places stay in the Savora app.',
      networkTitle: 'This page could not be loaded',
      networkText: 'Check your connection, then reload the page.',
      unavailableTitle: 'This page is unavailable right now',
      unavailableText: 'Try again a little later. The places stay in the Savora app.',
      emptyShelf: 'No places yet.',
      count_one: '{count} place', count_other: '{count} places',
      devise: 'Savora · The joy of eating well', confidentialite: 'Privacy', cgu: 'Terms of Service'
    },
    de: {
      sharedBy: 'Geteilt von {name}',
      placeBadge: 'Adresse', directions: 'Route', plans: 'Apple Karten', google: 'Google Maps',
      open: 'In Savora öffnen', download: 'Savora herunterladen',
      downloadNote: 'Savora ist auf dem iPhone in der Testphase: Der Link lädt dich zur Testversion (TestFlight) ein.',
      incompleteTitle: 'Dieser Link ist unvollständig',
      incompleteText: 'Der Name der Adresse fehlt. Bitte die Person, sie dir aus der Savora-App noch einmal zu schicken.',
      carnetBadge: 'Notizbuch', collectionBadge: 'Sammlung',
      carnetTitle: 'Die Adressen von {name}',
      loading: 'Wird geladen…',
      neutralTitle: 'Hier gibt es nichts zu sehen',
      neutralText: 'Diese Seite ist nicht öffentlich oder noch nicht verfügbar. Die Adressen bleiben in der Savora-App.',
      networkTitle: 'Diese Seite konnte nicht geladen werden',
      networkText: 'Prüfe deine Verbindung und lade die Seite neu.',
      unavailableTitle: 'Diese Seite ist im Moment nicht verfügbar',
      unavailableText: 'Versuche es etwas später noch einmal. Die Adressen bleiben in der Savora-App.',
      emptyShelf: 'Noch keine Adressen.',
      count_one: '{count} Adresse', count_other: '{count} Adressen',
      devise: 'Savora · Die Freude am guten Essen', confidentialite: 'Datenschutz', cgu: 'Nutzungsbedingungen'
    },
    it: {
      sharedBy: 'Condiviso da {name}',
      placeBadge: 'Indirizzo', directions: 'Indicazioni', plans: 'Apple Mappe', google: 'Google Maps',
      open: 'Apri in Savora', download: 'Scarica Savora',
      downloadNote: 'Savora è in prova su iPhone: il link ti invita alla versione di prova (TestFlight).',
      incompleteTitle: 'Questo link è incompleto',
      incompleteText: 'Manca il nome dell’indirizzo. Chiedi alla persona di rimandartelo dall’app Savora.',
      carnetBadge: 'Taccuino', collectionBadge: 'Raccolta',
      carnetTitle: 'Gli indirizzi di {name}',
      loading: 'Caricamento…',
      neutralTitle: 'Niente da mostrare qui',
      neutralText: 'Questa pagina non è pubblica, oppure non è ancora disponibile. Gli indirizzi restano nell’app Savora.',
      networkTitle: 'Impossibile caricare questa pagina',
      networkText: 'Controlla la connessione, poi ricarica la pagina.',
      unavailableTitle: 'Questa pagina non è disponibile al momento',
      unavailableText: 'Riprova un po’ più tardi. Gli indirizzi restano nell’app Savora.',
      emptyShelf: 'Ancora nessun indirizzo.',
      count_one: '{count} indirizzo', count_other: '{count} indirizzi',
      devise: 'Savora · Il piacere di mangiare bene', confidentialite: 'Privacy', cgu: 'Condizioni d’uso'
    }
  };

  function has(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  /** Langue : `?lang=xx` d'abord, puis les langues du navigateur ; anglais sinon. */
  function pickLang(forced, prefs) {
    let list = [forced].concat(Array.isArray(prefs) ? prefs : []);
    for (let i = 0; i < list.length; i++) {
      let c = String(list[i] || '').slice(0, 2).toLowerCase();
      if (LANGS.indexOf(c) !== -1) {
        return c;
      }
    }
    return 'en';
  }

  function text(lang, key, vars) {
    let table = has(TEXTS, lang) ? TEXTS[lang] : TEXTS.en;
    let s = has(table, key) ? table[key] : has(TEXTS.en, key) ? TEXTS.en[key] : '';
    if (vars) {
      s = s.replace(/\{(\w+)\}/g, function (m, k) {
        return has(vars, k) ? String(vars[k]) : m;
      });
    }
    return s;
  }

  /**
   * Forme du pluriel : les règles CLDR, comme l'app (i18next). En français, 0 prend le singulier (« 0 adresse »,
   * DF6) ; en anglais, allemand et italien, seul 1 est singulier.
   */
  function pluralForm(lang, count) {
    if (lang === 'fr') {
      return count === 0 || count === 1 ? 'one' : 'other';
    }
    return count === 1 ? 'one' : 'other';
  }

  function countText(lang, count) {
    let l = has(TEXTS, lang) ? lang : 'en';
    return text(l, pluralForm(l, count) === 'one' ? 'count_one' : 'count_other', { count: count });
  }

  // Contrôles C0/C1, séparateurs de ligne, marques et isolats de direction : jamais affichés.
  let CONTROL = /[\u0000-\u001F\u007F-\u009F\u2028\u2029\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

  /** Texte libre → texte affichable : sans caractère de contrôle, espaces repliés, borné en caractères (pas en unités UTF-16). */
  function cleanText(value, max) {
    if (typeof value !== 'string') {
      return '';
    }
    let s = value.replace(CONTROL, ' ').replace(/\s+/g, ' ').trim();
    let chars = Array.from(s);
    if (chars.length > max) {
      s = chars.slice(0, max).join('').trim();
    }
    return s;
  }

  /** « melissa's kitchen » → « Melissa's kitchen » : première lettre seulement, à l'affichage. */
  function capitalizeFirst(value) {
    let chars = Array.from(String(value || ''));
    if (chars.length === 0) {
      return '';
    }
    return chars[0].toLocaleUpperCase() + chars.slice(1).join('');
  }

  function toNumber(value) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value !== 'string' || !/^\s*-?\d{1,3}(\.\d{1,12})?\s*$/.test(value)) {
      return NaN;
    }
    return Number(value);
  }

  /** Coordonnées : deux nombres finis dans les bornes, ou rien du tout. */
  function parseCoords(lat, lng) {
    let a = toNumber(lat);
    let b = toNumber(lng);
    if (!isFinite(a) || !isFinite(b) || a < -90 || a > 90 || b < -180 || b > 180) {
      return null;
    }
    return { lat: Math.round(a * 1e6) / 1e6, lng: Math.round(b * 1e6) / 1e6 };
  }

  function parsePlaceType(value) {
    return typeof value === 'string' && PLACE_TYPES.indexOf(value) !== -1 ? value : null;
  }

  function knownCuisine(value) {
    return typeof value === 'string' && has(LABELS.cuisines.fr, value);
  }

  function parseUuid(value) {
    return typeof value === 'string' && UUID.test(value) ? value.toLowerCase() : null;
  }

  /** Une adresse validée — toujours la même forme, quelle que soit sa source (lien ou base). */
  function normalizePlace(raw) {
    let name = cleanText(raw.name, MAX.name);
    if (name.length === 0) {
      return null;
    }
    let coords = parseCoords(raw.lat, raw.lng);
    let cuisines = [];
    let list = Array.isArray(raw.cuisines) ? raw.cuisines : [];
    for (let i = 0; i < list.length && cuisines.length < MAX_CUISINES; i++) {
      if (knownCuisine(list[i]) && cuisines.indexOf(list[i]) === -1) {
        cuisines.push(list[i]);
      }
    }
    return {
      name: name,
      placeType: parsePlaceType(raw.placeType),
      cuisines: cuisines,
      city: cleanText(raw.city, MAX.city) || null,
      address: cleanText(raw.address, MAX.address) || null,
      lat: coords ? coords.lat : null,
      lng: coords ? coords.lng : null
    };
  }

  /** `?n=…&t=…&c=a,b&v=…&a=…&ll=lat,lng` → adresse, ou `null` si le nom manque. */
  function parsePlaceParams(search) {
    let q = new URLSearchParams(typeof search === 'string' ? search : '');
    let ll = (q.get('ll') || '').split(',');
    return normalizePlace({
      name: q.get('n'),
      placeType: q.get('t'),
      cuisines: (q.get('c') || '').split(','),
      city: q.get('v'),
      address: q.get('a'),
      lat: ll.length === 2 ? ll[0] : null,
      lng: ll.length === 2 ? ll[1] : null
    });
  }

  /**
   * Variante « ma fiche » : `s` (état), `r` (extrait d'avis), `by` (pseudo) — les trois seuls champs PERSONNELS
   * que le lien peut porter, choisis par la personne qui partage. État hors liste ignoré ; textes nettoyés et
   * bornés comme les autres. `null` si rien d'exploitable.
   */
  function parseMineParams(search) {
    let q = new URLSearchParams(typeof search === 'string' ? search : '');
    let rawState = q.get('s');
    let state = typeof rawState === 'string' && CATEGORY_KEYS.indexOf(rawState) !== -1 ? rawState : null;
    let excerpt = cleanText(q.get('r'), MAX.excerpt) || null;
    let username = cleanText(q.get('by'), MAX.username) || null;
    return state === null && excerpt === null && username === null ? null : { state: state, excerpt: excerpt, username: username };
  }

  /** Adresse → paramètres du lien (même encodage que l'app, `src/features/share/webShareLinks.ts`). */
  function placeQuery(place) {
    let parts = ['n=' + encodeURIComponent(place.name)];
    if (place.placeType) {
      parts.push('t=' + encodeURIComponent(place.placeType));
    }
    if (place.cuisines && place.cuisines.length > 0) {
      parts.push('c=' + place.cuisines.map(encodeURIComponent).join(','));
    }
    if (place.city) {
      parts.push('v=' + encodeURIComponent(place.city));
    }
    if (place.address) {
      parts.push('a=' + encodeURIComponent(place.address));
    }
    if (place.lat !== null && place.lng !== null) {
      parts.push('ll=' + place.lat + ',' + place.lng);
    }
    return '?' + parts.join('&');
  }

  /** `?u=<uuid>[&c=<uuid>]` → { user, collection } ; `null` si le compte manque ou n'est pas un uuid. */
  function parseCarnetParams(search) {
    let q = new URLSearchParams(typeof search === 'string' ? search : '');
    let user = parseUuid(q.get('u'));
    if (user === null) {
      return null;
    }
    let rawCollection = q.get('c');
    let collection = parseUuid(rawCollection);
    if (rawCollection !== null && collection === null) {
      return null;
    }
    return { user: user, collection: collection };
  }

  /** Seuls `https:` et `savora:` passent ; tout le reste (`javascript:`, `data:`…) devient l'absence. */
  function safeHref(url) {
    try {
      let u = new URL(url);
      return u.protocol === 'https:' || u.protocol === 'savora:' ? u.href : null;
    } catch (_e) {
      return null;
    }
  }

  function coord(value) {
    return String(Math.round(value * 1e6) / 1e6);
  }

  function textQuery(place) {
    return [place.name, place.address || place.city || ''].filter(function (s) {
      return s.length > 0;
    }).join(', ');
  }

  /** Même lien Plans que le message de l'app (`applePlansUrl`). */
  function plansUrl(place) {
    if (place.lat !== null && place.lng !== null) {
      return safeHref('https://maps.apple.com/?q=' + encodeURIComponent(place.name) + '&ll=' + coord(place.lat) + ',' + coord(place.lng));
    }
    return safeHref('https://maps.apple.com/?q=' + encodeURIComponent(textQuery(place)));
  }

  /** Même lien Google Maps que le message de l'app (`googleMapsUrl`). */
  function googleUrl(place) {
    let query = place.lat !== null && place.lng !== null
      ? place.name + ' ' + coord(place.lat) + ',' + coord(place.lng)
      : textQuery(place);
    return safeHref('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query));
  }

  /** Lien qui ouvre l'app : le profil quand on le connaît (`savora://user/<id>`), l'app sinon. */
  function appUrl(userId) {
    let id = parseUuid(userId);
    return safeHref(id === null ? APP_URL : 'savora://user/' + id);
  }

  function placeTypeLabel(lang, type) {
    let table = LABELS.placeTypes[has(LABELS.placeTypes, lang) ? lang : 'en'];
    return type !== null && has(table, type) ? table[type] : '';
  }

  function cuisineLabel(lang, key) {
    let table = LABELS.cuisines[has(LABELS.cuisines, lang) ? lang : 'en'];
    return has(table, key) ? table[key] : '';
  }

  /** « Restaurant · Italienne · Lucerne » — type, première cuisine distincte du type, ville ; sans doublon. */
  function placeMeta(lang, place) {
    let out = [];
    function push(v) {
      let s = String(v || '').trim();
      if (s.length > 0 && !out.some(function (o) { return o.toLowerCase() === s.toLowerCase(); })) {
        out.push(s);
      }
    }
    push(placeTypeLabel(lang, place.placeType));
    for (let i = 0; i < place.cuisines.length; i++) {
      if (place.cuisines[i] !== place.placeType) {
        push(cuisineLabel(lang, place.cuisines[i]));
        break;
      }
    }
    push(place.city);
    return out.join(' · ');
  }

  /** Vignette par type de lieu (`site/img/types/<type>.svg`), le restaurant par défaut. */
  function placeIcon(type) {
    return 'img/types/' + (parsePlaceType(type) || 'restaurant') + '.svg';
  }

  function cuisinesLabels(lang, place) {
    let out = [];
    for (let i = 0; i < place.cuisines.length; i++) {
      if (place.cuisines[i] !== place.placeType) {
        let l = cuisineLabel(lang, place.cuisines[i]);
        if (l.length > 0 && out.indexOf(l) === -1) {
          out.push(l);
        }
      }
    }
    return out;
  }

  function categoryLabel(lang, key) {
    let table = LABELS.categories[has(LABELS.categories, lang) ? lang : 'en'];
    return has(table, key) ? table[key] : '';
  }

  function idList(value) {
    let out = [];
    if (!Array.isArray(value)) {
      return out;
    }
    for (let i = 0; i < value.length; i++) {
      let id = parseUuid(value[i]);
      if (id !== null && out.indexOf(id) === -1) {
        out.push(id);
      }
    }
    return out;
  }

  /**
   * Réponse de `get_public_carnet` → { profile, shelves } validés. Chaque étagère : { kind, key, title, places }.
   * `null` si la réponse n'a pas la forme attendue. Les lieux inconnus d'une étagère sont ignorés.
   */
  function normalizeCarnet(json) {
    if (json === null || typeof json !== 'object' || Array.isArray(json)) {
      return null;
    }
    let profile = json.profile && typeof json.profile === 'object' ? json.profile : {};
    let username = cleanText(profile.username, MAX.username);
    let displayName = cleanText(profile.display_name, MAX.displayName);
    let byId = {};
    let rows = Array.isArray(json.places) ? json.places.slice(0, MAX_PLACES) : [];
    for (let i = 0; i < rows.length; i++) {
      let r = rows[i] && typeof rows[i] === 'object' ? rows[i] : {};
      let id = parseUuid(r.id);
      // `restaurants.cuisine` (une valeur) : même liste blanche que la page d'une adresse (`normalizePlace`).
      let p = id === null ? null : normalizePlace({
        name: r.name, placeType: r.place_type, cuisines: [r.cuisine], city: r.city, address: r.address, lat: r.lat, lng: r.lng
      });
      if (p !== null) {
        p.id = id;
        byId[id] = p;
      }
    }
    function placesOf(ids) {
      return idList(ids).filter(function (id) { return has(byId, id); }).map(function (id) { return byId[id]; });
    }
    let shelves = [];
    let cats = Array.isArray(json.categories) ? json.categories : [];
    for (let c = 0; c < cats.length; c++) {
      let cat = cats[c] && typeof cats[c] === 'object' ? cats[c] : {};
      if (CATEGORY_KEYS.indexOf(cat.key) !== -1) {
        shelves.push({ kind: 'category', key: cat.key, title: null, places: placesOf(cat.place_ids) });
      }
    }
    if (json.top10 && typeof json.top10 === 'object' && !Array.isArray(json.top10)) {
      shelves.push({ kind: 'top10', key: 'top10', title: null, places: placesOf(json.top10.place_ids) });
    }
    let cols = Array.isArray(json.collections) ? json.collections : [];
    for (let k = 0; k < cols.length; k++) {
      let col = cols[k] && typeof cols[k] === 'object' ? cols[k] : {};
      let title = cleanText(col.title, MAX.title);
      let colId = parseUuid(col.id);
      if (title.length > 0 && colId !== null) {
        shelves.push({ kind: 'collection', key: colId, title: title, places: placesOf(col.place_ids) });
      }
    }
    return { profile: { username: username, displayName: displayName }, shelves: shelves };
  }

  /** Corps d'une réponse → valeur JSON, ou `undefined` si elle est illisible (jamais d'exception). */
  function parseJson(raw) {
    if (typeof raw !== 'string') {
      return undefined;
    }
    try {
      return JSON.parse(raw);
    } catch (_e) {
      return undefined;
    }
  }

  /**
   * Réponse HTTP de `get_public_carnet` → ce que la page affiche. `body` : JSON déjà lu, `undefined` si illisible.
   * - `data` : un carnet validé, avec au moins une étagère ;
   * - `neutral` : RIEN de public (la fonction rend `null`), ou la fonction n'existe pas encore (404 `PGRST202`) ;
   * - `unavailable` : une panne — 401/403/5xx, tout autre refus, réponse illisible ou hors forme.
   * La coupure réseau n'arrive jamais ici : elle est traitée par la page (« Vérifie ta connexion »).
   */
  function pageStateFor(status, body) {
    if (status === 404 && body && typeof body === 'object' && body.code === 'PGRST202') {
      return { kind: 'neutral' };
    }
    if (typeof status !== 'number' || status < 200 || status > 299 || body === undefined) {
      return { kind: 'unavailable' };
    }
    if (body === null) {
      return { kind: 'neutral' };
    }
    let carnet = normalizeCarnet(body);
    if (carnet === null) {
      return { kind: 'unavailable' };
    }
    return carnet.shelves.length === 0 ? { kind: 'neutral' } : { kind: 'data', carnet: carnet };
  }

  /** Titre d'une étagère dans la langue de la page. */
  function shelfTitle(lang, shelf) {
    if (shelf.kind === 'collection') {
      return shelf.title;
    }
    if (shelf.kind === 'top10') {
      return 'Top 10';
    }
    return categoryLabel(lang, shelf.key);
  }

  return {
    LANGS: LANGS,
    TEXTS: TEXTS,
    LABELS: LABELS,
    MAX: MAX,
    MAX_PLACES: MAX_PLACES,
    TESTFLIGHT_URL: TESTFLIGHT_URL,
    pickLang: pickLang,
    text: text,
    countText: countText,
    cleanText: cleanText,
    capitalizeFirst: capitalizeFirst,
    parseCoords: parseCoords,
    parseUuid: parseUuid,
    normalizePlace: normalizePlace,
    parsePlaceParams: parsePlaceParams,
    parseMineParams: parseMineParams,
    placeTypeLabel: placeTypeLabel,
    cuisinesLabels: cuisinesLabels,
    categoryLabel: categoryLabel,
    placeQuery: placeQuery,
    parseCarnetParams: parseCarnetParams,
    safeHref: safeHref,
    plansUrl: plansUrl,
    googleUrl: googleUrl,
    appUrl: appUrl,
    placeMeta: placeMeta,
    placeIcon: placeIcon,
    normalizeCarnet: normalizeCarnet,
    parseJson: parseJson,
    pageStateFor: pageStateFor,
    shelfTitle: shelfTitle
  };
});
