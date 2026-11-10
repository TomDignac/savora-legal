/*
 * Savora — affichage des pages de partage. Toute donnée passe par `textContent` ou un attribut posé par
 * `setAttribute` sur un lien déjà validé (`SavoraPartage.safeHref`) : jamais `innerHTML`.
 * La page déclare son rôle par `<body data-page="lieu">`, `<body data-page="carnet">` ou `<body data-page="liste">` (lot C).
 */
(function () {
  'use strict';
  let P = self.SavoraPartage;
  let CONFIG = self.SAVORA_CONFIG || {};
  let page = document.body.getAttribute('data-page');
  let forced = (new URLSearchParams(location.search).get('lang') || '').slice(0, 2);
  let lang = P.pickLang(forced, navigator.languages || [navigator.language || '']);
  document.documentElement.lang = lang;
  let T = function (key, vars) {
    return P.text(lang, key, vars);
  };

  // Textes fixes du gabarit (pied de page…).
  let fixed = document.querySelectorAll('[data-t]');
  for (let i = 0; i < fixed.length; i++) {
    fixed[i].textContent = T(fixed[i].getAttribute('data-t'));
  }

  let card = document.getElementById('carte');

  function el(tag, className, content) {
    let node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (typeof content === 'string') {
      node.textContent = content;
    }
    return node;
  }

  function link(href, className, label, external) {
    let safe = P.safeHref(href);
    if (safe === null) {
      return null;
    }
    let a = el('a', className, label);
    a.setAttribute('href', safe);
    if (external) {
      a.setAttribute('rel', 'noopener noreferrer');
    }
    return a;
  }

  function append(parent, child) {
    if (child) {
      parent.appendChild(child);
    }
  }

  function icon(type, size) {
    let img = el('img', 'vignette');
    img.setAttribute('src', '../' + P.placeIcon(type));
    img.setAttribute('alt', '');
    img.setAttribute('width', String(size));
    img.setAttribute('height', String(size));
    return img;
  }

  function clear() {
    while (card.firstChild) {
      card.removeChild(card.firstChild);
    }
  }

  function message(titleKey, textKey) {
    clear();
    card.appendChild(el('h1', null, T(titleKey)));
    card.appendChild(el('p', 'texte', T(textKey)));
    appActions(null);
  }

  /** « Ouvrir dans Savora » + « Télécharger Savora » (TestFlight en attendant l'App Store). */
  function appActions(userId) {
    let row = el('div', 'actions');
    append(row, link(P.appUrl(userId), 'bouton', T('open'), false));
    append(row, link(P.TESTFLIGHT_URL, 'bouton secondaire', T('download'), true));
    card.appendChild(row);
    card.appendChild(el('p', 'note', T('downloadNote')));
  }

  // ── Une adresse : tout est dans le lien ───────────────────────────────────
  function renderPlace() {
    let place = P.parsePlaceParams(location.search);
    if (place === null) {
      message('incompleteTitle', 'incompleteText');
      return;
    }
    let name = P.capitalizeFirst(place.name);
    let mine = P.parseMineParams(location.search);
    document.title = name + ' · Savora';
    clear();
    card.className = 'carte fiche';

    // Bandeau sans photo, comme la fiche de l'app : fond sauge à 12 %, symbole à 18 %, tuile du type.
    // La page n'affiche JAMAIS de photo (celles des carnets sont privées).
    let hero = el('div', 'hero');
    let mark = el('img', 'filigrane');
    mark.setAttribute('src', '../img/savora-symbol.svg');
    mark.setAttribute('alt', '');
    hero.appendChild(mark);
    let tile = el('div', 'tuile-type');
    tile.appendChild(el('span', 'glyphe t-' + (place.placeType || 'restaurant')));
    hero.appendChild(tile);
    card.appendChild(hero);

    let identity = el('div', 'identite');
    identity.appendChild(el('h1', null, name));
    if (place.city) {
      identity.appendChild(el('p', 'meta', place.city));
    }
    let pills = el('div', 'pastilles');
    let typeLabel = P.placeTypeLabel(lang, place.placeType);
    if (typeLabel) {
      pills.appendChild(el('span', 'puce', typeLabel));
    }
    let cuisines = P.cuisinesLabels(lang, place);
    for (let i = 0; i < cuisines.length; i++) {
      pills.appendChild(el('span', 'puce', cuisines[i]));
    }
    if (pills.firstChild) {
      identity.appendChild(pills);
    }
    if (mine !== null) {
      identity.appendChild(mineBlock(mine));
    }
    card.appendChild(identity);

    let body = el('div', 'corps');
    if (place.address) {
      let info = el('div', 'info');
      info.appendChild(el('span', 'epingle'));
      info.appendChild(el('span', 'info-texte', place.address));
      body.appendChild(info);
    }
    let maps = el('div', 'actions');
    append(maps, link(P.plansUrl(place), 'bouton secondaire', T('plans'), true));
    append(maps, link(P.googleUrl(place), 'bouton secondaire', T('google'), true));
    body.appendChild(maps);
    let open = el('div', 'actions');
    append(open, link(P.appUrl(null), 'bouton', T('open'), false));
    body.appendChild(open);
    body.appendChild(el('p', 'note', T('downloadNote')));
    append(body, link(P.TESTFLIGHT_URL, 'lien-discret', T('download'), true));
    card.appendChild(body);
  }

  /** « Ma fiche » : état, extrait d'avis, pseudo — les seuls champs personnels du lien, tous nettoyés par le noyau. */
  function mineBlock(mine) {
    let box = el('div', 'ma-fiche');
    if (mine.state) {
      box.appendChild(el('span', 'etat etat-' + mine.state, P.categoryLabel(lang, mine.state)));
    }
    if (mine.excerpt) {
      box.appendChild(el('blockquote', 'avis', mine.excerpt));
    }
    if (mine.username) {
      box.appendChild(el('p', 'par', T('sharedBy', { name: mine.username })));
    }
    return box;
  }

  // ── Un carnet ou une collection publics : lus par get_public_carnet ──────
  function renderCarnet() {
    let params = P.parseCarnetParams(location.search);
    if (params === null || !CONFIG.supabaseUrl || !CONFIG.publishableKey) {
      message('neutralTitle', 'neutralText');
      return;
    }
    clear();
    card.appendChild(el('p', 'texte', T('loading')));
    let endpoint = P.safeHref(CONFIG.supabaseUrl + '/rest/v1/rpc/get_public_carnet');
    if (endpoint === null) {
      message('neutralTitle', 'neutralText');
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_user: params.user, p_collection: params.collection }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    })
      .then(function (res) {
        return res.text().then(function (raw) {
          return { status: res.status, body: P.parseJson(raw) };
        });
      })
      // Deux voies séparées : le second argument ne reçoit QUE l'échec du réseau (requête ou lecture du corps) ;
      // une exception de l'affichage reste dans showCarnet, qui la traite comme une panne — jamais « Vérifie ta connexion ».
      .then(function (result) {
        showCarnet(P.pageStateFor(result.status, result.body), params);
      }, function () {
        message('networkTitle', 'networkText');
      });
  }

  function showCarnet(state, params) {
    try {
      if (state.kind === 'data') {
        drawCarnet(state.carnet, params);
      } else if (state.kind === 'neutral') {
        message('neutralTitle', 'neutralText');
      } else {
        message('unavailableTitle', 'unavailableText');
      }
    } catch (_e) {
      message('unavailableTitle', 'unavailableText');
    }
  }

  function drawCarnet(data, params) {
    clear();
    let who = data.profile.displayName || data.profile.username;
    let single = params.collection !== null && data.shelves.length === 1 ? data.shelves[0] : null;
    card.appendChild(el('span', 'pastille', T(single ? 'collectionBadge' : 'carnetBadge')));
    let title = single ? P.shelfTitle(lang, single) : T('carnetTitle', { name: who });
    document.title = title + ' · Savora';
    card.appendChild(el('h1', null, title));
    if (single && data.profile.username) {
      card.appendChild(el('p', 'meta', '@' + data.profile.username));
    }
    for (let s = 0; s < data.shelves.length; s++) {
      let shelf = data.shelves[s];
      let section = el('section', 'etagere');
      if (!single) {
        let head = el('div', 'etagere-tete');
        head.appendChild(el('h2', 'sous-titre', P.shelfTitle(lang, shelf)));
        head.appendChild(el('span', 'compte', P.countText(lang, shelf.places.length)));
        section.appendChild(head);
      }
      if (shelf.places.length === 0) {
        section.appendChild(el('p', 'note', T('emptyShelf')));
      } else {
        let list = el('ul', 'lieux');
        for (let p = 0; p < shelf.places.length; p++) {
          list.appendChild(placeRow(shelf.places[p]));
        }
        section.appendChild(list);
      }
      card.appendChild(section);
    }
    appActions(params.user);
  }

  function placeRow(place) {
    let li = el('li');
    // Lien relatif vers la page d'une adresse, construit sur une base fixe : jamais une URL venue de la base.
    let a = el('a', 'lieu');
    a.setAttribute('href', '../l/' + P.placeQuery(place) + '&lang=' + lang);
    a.appendChild(icon(place.placeType, 36));
    let body = el('span', 'lieu-texte');
    body.appendChild(el('span', 'lieu-nom', P.capitalizeFirst(place.name)));
    let meta = P.placeMeta(lang, place);
    if (meta.length > 0) {
      body.appendChild(el('span', 'lieu-meta', meta));
    }
    a.appendChild(body);
    li.appendChild(a);
    return li;
  }

  // ── Lot C : une liste envoyée par lien (`get_shared_list`), lisible sans compte ──────────────────────────────
  function renderList() {
    let token = P.sharedListToken(location.search);
    if (token === null || !CONFIG.supabaseUrl || !CONFIG.publishableKey) {
      message('listGoneTitle', 'listGoneText');
      return;
    }
    clear();
    card.appendChild(el('p', 'texte', T('loading')));
    let endpoint = P.safeHref(CONFIG.supabaseUrl + '/rest/v1/rpc/get_shared_list');
    if (endpoint === null) {
      message('listGoneTitle', 'listGoneText');
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { apikey: CONFIG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_token: token }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    })
      .then(function (res) {
        return res.text().then(function (raw) {
          return { status: res.status, body: P.parseJson(raw) };
        });
      })
      .then(function (result) {
        try {
          if (result.status < 200 || result.status > 299 || result.body === undefined) {
            message('unavailableTitle', 'unavailableText');
            return;
          }
          let list = P.normalizeSharedList(result.body);
          if (list === null) {
            message('listGoneTitle', 'listGoneText');
            return;
          }
          drawList(list, token);
        } catch (_e) {
          message('unavailableTitle', 'unavailableText');
        }
      }, function () {
        message('networkTitle', 'networkText');
      });
  }

  function drawList(list, token) {
    clear();
    card.appendChild(el('span', 'pastille', T('listBadge')));
    document.title = list.title + ' · Savora';
    card.appendChild(el('h1', null, list.title));
    if (list.sender) {
      card.appendChild(el('p', 'meta', T('sentBy', { name: list.sender })));
    }
    let section = el('section', 'etagere');
    let head = el('div', 'etagere-tete');
    head.appendChild(el('span', 'compte', P.countText(lang, list.places.length)));
    section.appendChild(head);
    let ul = el('ul', 'lieux');
    for (let i = 0; i < list.places.length; i++) {
      ul.appendChild(placeRow(list.places[i]));
    }
    section.appendChild(ul);
    card.appendChild(section);
    let open = el('div', 'actions');
    append(open, link(P.sharedListAppUrl(token), 'bouton', T('open'), false));
    card.appendChild(open);
    card.appendChild(el('p', 'note', T('downloadNote')));
    append(card, link(P.TESTFLIGHT_URL, 'lien-discret', T('download'), true));
  }

  if (page === 'lieu') {
    renderPlace();
  } else if (page === 'carnet') {
    renderCarnet();
  } else if (page === 'liste') {
    renderList();
  }
})();
