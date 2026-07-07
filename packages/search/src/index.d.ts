type Period = 'hour' | 'day' | 'week' | 'month' | 'year'

type Type =
  | 'search'
  | 'news'
  | 'images'
  | 'videos'
  | 'places'
  | 'maps'
  | 'shopping'
  | 'scholar'
  | 'patents'
  | 'autocomplete'

interface TypeToPage {
  search: SearchPage
  news: NewsPage
  images: ImagesPage
  videos: VideosPage
  places: PlacesPage
  maps: MapsPage
  shopping: ShoppingPage
  scholar: ScholarPage
  patents: PatentsPage
  autocomplete: AutocompletePage
}

type Location =
  | 'af' | 'al' | 'dz' | 'as' | 'ad' | 'ao' | 'ai' | 'aq' | 'ag' | 'ar'
  | 'am' | 'aw' | 'au' | 'at' | 'az' | 'bs' | 'bh' | 'bd' | 'bb' | 'by'
  | 'be' | 'bz' | 'bj' | 'bm' | 'bt' | 'bo' | 'ba' | 'bw' | 'bv' | 'br'
  | 'io' | 'bn' | 'bg' | 'bf' | 'bi' | 'kh' | 'cm' | 'ca' | 'cv' | 'ky'
  | 'cf' | 'td' | 'cl' | 'cn' | 'cx' | 'cc' | 'co' | 'km' | 'cg' | 'cd'
  | 'ck' | 'cr' | 'ci' | 'hr' | 'cu' | 'cy' | 'cz' | 'dk' | 'dj' | 'dm'
  | 'do' | 'ec' | 'eg' | 'sv' | 'gq' | 'er' | 'ee' | 'et' | 'fk' | 'fo'
  | 'fj' | 'fi' | 'fr' | 'gf' | 'pf' | 'tf' | 'ga' | 'gm' | 'ge' | 'de'
  | 'gh' | 'gi' | 'gr' | 'gl' | 'gd' | 'gp' | 'gu' | 'gt' | 'gn' | 'gw'
  | 'gy' | 'ht' | 'hm' | 'va' | 'hn' | 'hk' | 'hu' | 'is' | 'in' | 'id'
  | 'ir' | 'iq' | 'ie' | 'il' | 'it' | 'jm' | 'jp' | 'jo' | 'kz' | 'ke'
  | 'ki' | 'kp' | 'kr' | 'kw' | 'kg' | 'la' | 'lv' | 'lb' | 'ls' | 'lr'
  | 'ly' | 'li' | 'lt' | 'lu' | 'mo' | 'mk' | 'mg' | 'mw' | 'my' | 'mv'
  | 'ml' | 'mt' | 'mh' | 'mq' | 'mr' | 'mu' | 'yt' | 'mx' | 'fm' | 'md'
  | 'mc' | 'mn' | 'ms' | 'ma' | 'mz' | 'mm' | 'na' | 'nr' | 'np' | 'nl'
  | 'an' | 'nc' | 'nz' | 'ni' | 'ne' | 'ng' | 'nu' | 'nf' | 'mp' | 'no'
  | 'om' | 'pk' | 'pw' | 'ps' | 'pa' | 'pg' | 'py' | 'pe' | 'ph' | 'pn'
  | 'pl' | 'pt' | 'pr' | 'qa' | 're' | 'ro' | 'ru' | 'rw' | 'sh' | 'kn'
  | 'lc' | 'pm' | 'vc' | 'ws' | 'sm' | 'st' | 'sa' | 'sn' | 'rs' | 'sc'
  | 'sl' | 'sg' | 'sk' | 'si' | 'sb' | 'so' | 'za' | 'gs' | 'es' | 'lk'
  | 'sd' | 'sr' | 'sj' | 'sz' | 'se' | 'ch' | 'sy' | 'tw' | 'tj' | 'tz'
  | 'th' | 'tl' | 'tg' | 'tk' | 'to' | 'tt' | 'tn' | 'tr' | 'tm' | 'tc'
  | 'tv' | 'ug' | 'ua' | 'ae' | 'gb' | 'us' | 'um' | 'uy' | 'uz' | 'vu'
  | 've' | 'vn' | 'vg' | 'vi' | 'wf' | 'eh' | 'ye' | 'zm' | 'zw'

interface Options {
  type?: Type
  limit?: number
  location?: Location
  period?: Period
}

interface Sitelink {
  title: string
  link: string
}

interface KnowledgeGraph {
  title?: string
  type?: string
  website?: string
  image?: { url: string }
  description?: string
  descriptionSource?: string
  descriptionLink?: string
  attributes?: Record<string, string>
}

interface PeopleAlsoAsk {
  question: string
  snippet: string
  title: string
  link: string
}

interface RelatedSearch {
  query: string
}

interface SearchResult {
  title: string
  url: string
  description: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface SearchPage {
  results: SearchResult[]
  knowledgeGraph?: KnowledgeGraph
  peopleAlsoAsk?: PeopleAlsoAsk[]
  relatedSearches?: RelatedSearch[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<SearchPage>
}

interface NewsResult {
  title: string
  url: string
  description: string
  date: string
  publisher: string
  image?: { url: string }
  html(): Promise<string>
  markdown(): Promise<string>
}

interface NewsPage {
  results: NewsResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<NewsPage>
}

interface ImageResult {
  title: string
  url: string
  image: { url: string; width: number; height: number }
  thumbnail: { url: string; width: number; height: number }
  google?: { url: string }
  creator?: string
  credit?: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface ImagesPage {
  results: ImageResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<ImagesPage>
}

interface VideoResult {
  title: string
  url: string
  description: string
  image?: { url: string }
  video?: { url: string }
  duration?: number
  duration_pretty?: string
  publisher?: string
  channel?: string
  date?: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface VideosPage {
  results: VideoResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<VideosPage>
}

interface PlaceResult {
  title: string
  address: string
  latitude: number
  longitude: number
  phone?: { number: string }
  url?: string
  cid: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface PlacesPage {
  results: PlaceResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<PlacesPage>
}

interface MapPlaceResult {
  title: string
  address: string
  latitude: number
  longitude: number
  rating?: number
  ratingCount?: number
  price?: { level: string }
  type?: string
  types?: string[]
  url?: string
  phone?: { number: string }
  description?: string
  opening?: { hours: Record<string, string> }
  thumbnail?: { url: string }
  cid: string
  fid?: string
  place?: { id: string }
  html(): Promise<string>
  markdown(): Promise<string>
}

interface MapsPage {
  results: MapPlaceResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<MapsPage>
}

interface ShoppingResult {
  title: string
  url: string
  publisher: string
  price: { symbol: string; amount: number }
  image?: { url: string }
  rating?: { score: number; total: number; reviews?: number }
  id?: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface ShoppingPage {
  results: ShoppingResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<ShoppingPage>
}

interface ScholarResult {
  title: string
  url: string
  description: string
  publisher: string
  year: number
  citations: number
  pdf?: { url: string }
  id: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface ScholarPage {
  results: ScholarResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<ScholarPage>
}

interface PatentResult {
  title: string
  description: string
  url: string
  priority: { date: string }
  filing: { date: string }
  grant?: { date: string }
  publication: { date: string; number: string }
  inventor: string
  assignee: string
  language: string
  pdf?: { url: string }
  thumbnail?: { url: string }
  figures?: Array<{ image: { url: string }; thumbnail: { url: string } }>
  id?: string
  html(): Promise<string>
  markdown(): Promise<string>
}

interface PatentsPage {
  results: PatentResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<PatentsPage>
}

interface SuggestionResult {
  value: string
}

interface AutocompletePage {
  results: SuggestionResult[]
  html(): Promise<string>
  markdown(): Promise<string>
  next(): Promise<AutocompletePage>
}

interface GoogleClient {
  <K extends Type>(
    query: string,
    options: Omit<Options, 'type'> & { type: K }
  ): Promise<TypeToPage[K]>
  (query: string, options?: Options): Promise<SearchPage>
}

interface ContextOptions {
  apiKey?: string
  endpoint?: string
  timeout?: number
}

export declare const DOMAIN: string

export declare function buildPath(
  query: string,
  limit?: number,
  location?: string
): string

export declare function buildUrl(
  query: string,
  options?: {
    limit?: number
    location?: string
    type?: Type
    period?: Period
  }
): URL

interface createGoogleClient {
  (options?: ContextOptions): GoogleClient
}

declare const createGoogleClient: createGoogleClient

export default createGoogleClient
