import {
  ArchiveDatabaseSchema,
  Collection,
  Person,
  SoundtrackItem,
  StillImage,
  Tag,
  WatchEntry,
  WatchStatus,
  Work,
  WorkType,
} from '../types';
import { createInitialSeedDatabase } from '../data/seedData';
import {
  createBackdropSvg,
  createCriterionPosterSvg,
  PosterTheme,
} from '../lib/artworkGenerator';

const DB_NAME = 'cinephile_archive_db_v1';
const DB_VERSION = 1;
const STORE_NAME = 'archive_state';
const STATE_KEY = 'primary_archive';
const FALLBACK_STORAGE_KEY = 'cinephile_archive_fallback_v1';

export interface CsvImportCandidate {
  rowNumber: number;
  title: string;
  originalTitle: string;
  year: number;
  type: WorkType;
  watchStatus: WatchStatus;
  personalRating: number | null;
  tags: string[];
  review: string;
  director: string[];
  genres: string[];
  isDuplicate: boolean;
  existingWorkId?: string;
  error?: string;
}

export interface IArchiveRepository {
  loadArchive(): Promise<ArchiveDatabaseSchema>;
  saveArchive(data: ArchiveDatabaseSchema): Promise<void>;
  resetToDemoSeed(): Promise<ArchiveDatabaseSchema>;
  clearAllData(): Promise<ArchiveDatabaseSchema>;
  exportJson(data: ArchiveDatabaseSchema): string;
  validateAndParseJsonBackup(rawJson: string): {
    valid: boolean;
    data?: ArchiveDatabaseSchema;
    error?: string;
    summary?: {
      worksCount: number;
      entriesCount: number;
      collectionsCount: number;
      tagsCount: number;
      version: string;
    };
  };
}

let dbInstance: IDBDatabase | null = null;

function openIndexedDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

async function readFromIndexedDB(): Promise<ArchiveDatabaseSchema | null> {
  try {
    const db = await openIndexedDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as ArchiveDatabaseSchema) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ArchiveDatabaseSchema) : null;
    } catch {
      return null;
    }
  }
}

async function writeToIndexedDB(data: ArchiveDatabaseSchema): Promise<void> {
  const updated = {
    ...data,
    exportedAt: new Date().toISOString(),
  };
  try {
    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(updated, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Sandboxed environment fallback
  }
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota
  }
}

// High-performance write debouncing to avoid blocking UI thread on rapid slider drags or typing
let saveDebounceTimer: any = null;
let pendingSaveData: ArchiveDatabaseSchema | null = null;

function debouncedWrite(data: ArchiveDatabaseSchema): Promise<void> {
  pendingSaveData = data;
  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }
  return new Promise((resolve) => {
    saveDebounceTimer = setTimeout(async () => {
      if (pendingSaveData) {
        await writeToIndexedDB(pendingSaveData);
        pendingSaveData = null;
      }
      resolve();
    }, 280);
  });
}

// Flush pending data on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (pendingSaveData) {
      try {
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(pendingSaveData));
      } catch {}
    }
  });
}

export const archiveRepository: IArchiveRepository = {
  async loadArchive(): Promise<ArchiveDatabaseSchema> {
    const existing = await readFromIndexedDB();
    if (existing && Array.isArray(existing.works)) {
      return existing;
    }
    const initial = createInitialSeedDatabase();
    await writeToIndexedDB(initial);
    return initial;
  },

  async saveArchive(data: ArchiveDatabaseSchema): Promise<void> {
    await debouncedWrite(data);
  },

  async resetToDemoSeed(): Promise<ArchiveDatabaseSchema> {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    pendingSaveData = null;
    const seed = createInitialSeedDatabase();
    await writeToIndexedDB(seed);
    return seed;
  },

  async clearAllData(): Promise<ArchiveDatabaseSchema> {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    pendingSaveData = null;
    const emptyState: ArchiveDatabaseSchema = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      works: [],
      watchEntries: [],
      collections: [],
      tags: [],
      people: [],
      stills: [],
      soundtracks: [],
      dismissedRecommendationIds: [],
    };
    await writeToIndexedDB(emptyState);
    return emptyState;
  },

  exportJson(data: ArchiveDatabaseSchema): string {
    const payload: ArchiveDatabaseSchema = {
      ...data,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  },

  validateAndParseJsonBackup(rawJson: string) {
    try {
      const parsed = JSON.parse(rawJson) as Partial<ArchiveDatabaseSchema>;
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: '文件内容不是有效的 JSON 对象。' };
      }
      if (!parsed.version || typeof parsed.version !== 'string') {
        return { valid: false, error: '缺少明确的数据版本字段（version），无法验证备份兼容性。' };
      }
      if (!Array.isArray(parsed.works) || !Array.isArray(parsed.watchEntries)) {
        return { valid: false, error: '备份文件缺少核心字段（works 或 watchEntries 数组）。' };
      }
      const normalized: ArchiveDatabaseSchema = {
        version: parsed.version,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        works: parsed.works,
        watchEntries: parsed.watchEntries,
        collections: Array.isArray(parsed.collections) ? parsed.collections : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        people: Array.isArray(parsed.people) ? parsed.people : [],
        stills: Array.isArray(parsed.stills) ? parsed.stills : [],
        soundtracks: Array.isArray(parsed.soundtracks) ? parsed.soundtracks : [],
        dismissedRecommendationIds: Array.isArray(parsed.dismissedRecommendationIds)
          ? parsed.dismissedRecommendationIds
          : [],
      };
      return {
        valid: true,
        data: normalized,
        summary: {
          worksCount: normalized.works.length,
          entriesCount: normalized.watchEntries.length,
          collectionsCount: normalized.collections.length,
          tagsCount: normalized.tags.length,
          version: normalized.version,
        },
      };
    } catch (err) {
      return {
        valid: false,
        error: `JSON 语法解析失败：${err instanceof Error ? err.message : '未知格式错误'}`,
      };
    }
  },
};

export function generateWorkArtwork(
  title: string,
  originalTitle: string,
  year: number,
  director: string[],
  indexSeed = 1
): { posterUrl: string; backdropUrl: string } {
  const palettes: PosterTheme[] = [
    { bgPrimary: '#211D1A', bgSecondary: '#171412', accent: '#A88F76', motif: 'eclipse', catalogCode: `NO.${100 + indexSeed}` },
    { bgPrimary: '#1E1B18', bgSecondary: '#141210', accent: '#8C8E91', motif: 'horizon', catalogCode: `NO.${100 + indexSeed}` },
    { bgPrimary: '#1F1E1B', bgSecondary: '#161413', accent: '#6B7065', motif: 'monolith', catalogCode: `NO.${100 + indexSeed}` },
  ];
  const theme = palettes[Math.abs(title.length + year) % palettes.length];
  const dirLabel = director.length > 0 ? director.join(' / ') : 'DIRECTOR';
  return {
    posterUrl: createCriterionPosterSvg(title, originalTitle || title, year, dirLabel, theme),
    backdropUrl: createBackdropSvg(title, originalTitle || title, year, 'Archival Folio Entry', theme),
  };
}

export function parseCsvImportPreview(
  csvText: string,
  existingWorks: Work[]
): { candidates: CsvImportCandidate[]; fatalError?: string } {
  const trimmed = csvText.trim();
  if (!trimmed) {
    return { candidates: [], fatalError: 'CSV 内容为空。' };
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      candidates: [],
      fatalError: 'CSV 至少需要包含表头行和一行作品记录。',
    };
  }

  const splitCsvRow = (row: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = splitCsvRow(lines[0]).map((h) => h.toLowerCase().trim());
  const findColIndex = (aliases: string[]) =>
    rawHeaders.findIndex((h) => aliases.some((a) => h === a.toLowerCase() || h.includes(a.toLowerCase())));

  const titleIdx = findColIndex(['title', '作品名称', '片名', '名称']);
  if (titleIdx === -1) {
    return {
      candidates: [],
      fatalError: '未找到“作品名称”或“title”列。',
    };
  }

  const origTitleIdx = findColIndex(['originaltitle', '原始片名', '外文名']);
  const yearIdx = findColIndex(['year', '年份', '上映年份']);
  const typeIdx = findColIndex(['type', '作品类型', '类型']);
  const statusIdx = findColIndex(['watchstatus', 'status', '观看状态', '状态']);
  const ratingIdx = findColIndex(['personalrating', 'rating', '个人评分', '评分']);
  const tagsIdx = findColIndex(['tags', 'tag', '标签']);
  const reviewIdx = findColIndex(['review', 'note', '影评', '观影感受']);
  const directorIdx = findColIndex(['director', '导演']);
  const genresIdx = findColIndex(['genres', 'genre', '流派', '分类']);

  const normalizeType = (val: string): WorkType => {
    const v = val.toLowerCase();
    if (v.includes('tv') || v.includes('剧') || v.includes('series')) return 'TV Series';
    if (v.includes('anime') || v.includes('动')) return 'Anime';
    if (v.includes('doc') || v.includes('纪录')) return 'Documentary';
    return 'Movie';
  };

  const normalizeStatus = (val: string): WatchStatus => {
    const v = val.toLowerCase();
    if (v.includes('want') || v.includes('想看') || v.includes('待看')) return 'Want to Watch';
    if (v.includes('watching') || v.includes('在看')) return 'Watching';
    if (v.includes('pause') || v.includes('搁置') || v.includes('暂停')) return 'Paused';
    if (v.includes('drop') || v.includes('弃')) return 'Dropped';
    return 'Watched';
  };

  const candidates: CsvImportCandidate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvRow(lines[i]);
    const title = (cols[titleIdx] || '').trim();
    const originalTitle = origTitleIdx >= 0 ? (cols[origTitleIdx] || '').trim() : title;
    const rawYear = yearIdx >= 0 ? parseInt(cols[yearIdx] || '', 10) : NaN;
    const year = !Number.isNaN(rawYear) && rawYear >= 1888 && rawYear <= 2035 ? rawYear : new Date().getFullYear();
    const type = typeIdx >= 0 ? normalizeType(cols[typeIdx] || '') : 'Movie';
    const watchStatus = statusIdx >= 0 ? normalizeStatus(cols[statusIdx] || '') : 'Watched';

    let personalRating: number | null = null;
    if (ratingIdx >= 0 && cols[ratingIdx]) {
      const parsedRating = parseFloat(cols[ratingIdx]);
      if (!Number.isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 10) {
        personalRating = Math.round(parsedRating * 10) / 10;
      }
    }

    const tags =
      tagsIdx >= 0 && cols[tagsIdx]
        ? cols[tagsIdx]
            .split(/[;|/、]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const director =
      directorIdx >= 0 && cols[directorIdx]
        ? cols[directorIdx]
            .split(/[;|/、]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : ['未知导演'];

    const genres =
      genresIdx >= 0 && cols[genresIdx]
        ? cols[genresIdx]
            .split(/[;|/、]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : ['剧情'];

    const review = reviewIdx >= 0 ? (cols[reviewIdx] || '').trim() : '';

    const duplicateMatch = existingWorks.find(
      (w) =>
        w.title.toLowerCase() === title.toLowerCase() ||
        (originalTitle && w.originalTitle.toLowerCase() === originalTitle.toLowerCase() && w.year === year)
    );

    candidates.push({
      rowNumber: i + 1,
      title,
      originalTitle: originalTitle || title,
      year,
      type,
      watchStatus,
      personalRating,
      tags,
      review,
      director,
      genres,
      isDuplicate: Boolean(duplicateMatch),
      existingWorkId: duplicateMatch?.id,
      error: !title ? '缺少作品名称' : undefined,
    });
  }

  return { candidates };
}
