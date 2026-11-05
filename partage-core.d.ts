// Types de `partage-core.js`, pour les tests Jest de l'app (src/features/share/__tests__/sitePartage.test.ts).
// Le navigateur ne lit pas ce fichier.
export type Lang = 'fr' | 'en' | 'de' | 'it';

export type PagePlace = {
  id?: string;
  name: string;
  placeType: string | null;
  cuisines: string[];
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type Shelf = { kind: 'category' | 'top10' | 'collection'; key: string; title: string | null; places: PagePlace[] };
export type PageCarnet = { profile: { username: string; displayName: string }; shelves: Shelf[] };

export const LANGS: Lang[];
export const TEXTS: Record<Lang, Record<string, string>>;
export const LABELS: {
  placeTypes: Record<Lang, Record<string, string>>;
  cuisines: Record<Lang, Record<string, string>>;
  categories: Record<Lang, Record<string, string>>;
};
export const MAX: { name: number; city: number; address: number; title: number; username: number; displayName: number };
export const MAX_PLACES: number;
export const TESTFLIGHT_URL: string;
export function pickLang(forced: string, prefs: readonly string[]): Lang;
export function text(lang: string, key: string, vars?: Record<string, string | number>): string;
export function countText(lang: string, count: number): string;
export function cleanText(value: unknown, max: number): string;
export function capitalizeFirst(value: string): string;
export function parseCoords(lat: unknown, lng: unknown): { lat: number; lng: number } | null;
export function parseUuid(value: unknown): string | null;
export function normalizePlace(raw: Record<string, unknown>): PagePlace | null;
export function parsePlaceParams(search: string): PagePlace | null;
export function placeQuery(place: PagePlace): string;
export function parseCarnetParams(search: string): { user: string; collection: string | null } | null;
export function safeHref(url: string): string | null;
export function plansUrl(place: PagePlace): string | null;
export function googleUrl(place: PagePlace): string | null;
export function appUrl(userId: string | null): string | null;
export function placeMeta(lang: string, place: PagePlace): string;
export function placeIcon(type: string | null): string;
export function normalizeCarnet(json: unknown): PageCarnet | null;
export type PageState = { kind: 'data'; carnet: PageCarnet } | { kind: 'neutral' } | { kind: 'unavailable' };
export function parseJson(raw: unknown): unknown;
export function pageStateFor(status: number, body: unknown): PageState;
export function shelfTitle(lang: string, shelf: Shelf): string;
