export type WorkType = 'Movie' | 'TV Series' | 'Anime' | 'Documentary';

export type WatchStatus =
  | 'Want to Watch'
  | 'Watching'
  | 'Watched'
  | 'Paused'
  | 'Dropped';

export interface Work {
  id: string;
  title: string;
  originalTitle: string;
  year: number;
  type: WorkType;
  genres: string[];
  director: string[];
  cast: string[];
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  runtime: number;
  personalRating: number | null;
  watchStatus: WatchStatus;
  tags: string[];
  favorite: boolean;
  curatorNote?: string;
  relatedWorkIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WatchEntry {
  id: string;
  workId: string;
  watchedAt: string;
  rating: number | null;
  review: string;
  isRewatch: boolean;
  version: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  coverWorkId: string | null;
  workIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  originalName?: string;
  role: 'Director' | 'Actor' | 'Director & Writer' | 'Cinematographer' | 'Composer';
  avatarUrl: string;
  biography: string;
  birthYear?: number;
  nationality?: string;
  workIds: string[];
}

export interface StillImage {
  id: string;
  workId: string;
  imageUrl: string;
  title: string;
  note: string;
  aspectRatio?: string;
  createdAt: string;
}

export interface SoundtrackItem {
  id: string;
  workId: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  appleMusicUrl?: string;
  externalUrl: string;
  note: string;
}

export interface ArchiveDatabaseSchema {
  version: string;
  exportedAt: string;
  works: Work[];
  watchEntries: WatchEntry[];
  collections: Collection[];
  tags: Tag[];
  people: Person[];
  stills: StillImage[];
  soundtracks: SoundtrackItem[];
  dismissedRecommendationIds: string[];
}

export type PrimaryPage = 'home' | 'library' | 'discover' | 'people' | 'journal';
export type LibraryViewMode = 'poster' | 'compact' | 'list';
export type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'rating-desc' | 'year-desc' | 'title-asc';
