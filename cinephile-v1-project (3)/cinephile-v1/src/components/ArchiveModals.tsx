import React, { useState } from 'react';
import {
  ArchiveDatabaseSchema,
  SoundtrackItem,
  StillImage,
  Tag,
  WatchEntry,
  WatchStatus,
  Work,
  WorkType,
} from '../types';
import {
  archiveRepository,
  CsvImportCandidate,
  generateWorkArtwork,
  parseCsvImportPreview,
} from '../services/archiveRepository';
import {
  DEFAULT_TMDB_API_KEY,
  fetchTmdbWorkDetails,
  searchTmdb,
  TmdbSearchResultItem,
} from '../services/tmdbService';
import { STATUS_LABELS, TYPE_LABELS } from './PosterCard';
import { useLanguage } from '../lib/i18n';

// 1. Quick Rate Drawer
interface QuickRateModalProps {
  work: Work | null;
  onClose: () => void;
  onSave: (workId: string, rating: number | null, status: WatchStatus, note: string) => void;
}

export const QuickRateModal: React.FC<QuickRateModalProps> = ({ work, onClose, onSave }) => {
  const { lang, t } = useLanguage();
  if (!work) return null;
  const [rating, setRating] = useState<string>(
    work.personalRating !== null ? work.personalRating.toString() : '9.0'
  );
  const [clearScore, setClearScore] = useState<boolean>(work.personalRating === null);
  const [status, setStatus] = useState<WatchStatus>(work.watchStatus);
  const [note, setNote] = useState<string>(work.curatorNote || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = clearScore
      ? null
      : Math.min(10, Math.max(1, Math.round(parseFloat(rating || '8') * 10) / 10));
    onSave(work.id, num, status, note.trim());
    onClose();
  };

  return (
    <section className="max-w-[1360px] mx-auto px-6 sm:px-12 py-10 bg-[#211D1A]/45 transition-opacity duration-300">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[#9C948B] tracking-widest uppercase">
              {t.modals.quickRateTitle}
            </span>
            <h3 className="text-lg font-editorial font-light text-[#E7E2DD]">
              {work.title} <span className="text-xs text-[#9C948B]">({work.year})</span>
            </h3>
          </div>
          <button type="button" onClick={onClose} className="ink-link text-xs">
            {t.actions.close}
          </button>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-xs">
          <span className="text-[#9C948B]">{t.library.statusFilterLabel}:</span>
          {(['Want to Watch', 'Watching', 'Watched', 'Paused', 'Dropped'] as WatchStatus[]).map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`ink-link ${status === s ? 'ink-link-active' : ''}`}
              >
                {t.status[s]}
              </button>
            )
          )}
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs">
          <span className="text-[#9C948B]">{t.modals.personalScore}:</span>
          {!clearScore ? (
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-40 accent-[#A88F76] bg-transparent cursor-pointer"
              />
              <span className="font-mono text-sm text-[#A88F76]">
                {parseFloat(rating).toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-[#9C948B]/60 italic">{t.modals.unrated}</span>
          )}
          <button
            type="button"
            onClick={() => setClearScore(!clearScore)}
            className="ink-link text-[11px]"
          >
            {clearScore ? t.modals.enableScore : t.modals.leaveBlank}
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-[#9C948B]">{t.modals.curatorNoteLabel}</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.modals.curatorNotePlaceholder}
            className="ink-input w-full text-sm"
          />
        </div>

        <div className="flex items-baseline gap-6 pt-2 text-xs">
          <button type="submit" className="ink-link ink-link-active">
            {t.actions.save}
          </button>
          <button type="button" onClick={onClose} className="ink-link">
            {t.actions.cancel}
          </button>
        </div>
      </form>
    </section>
  );
};

// 2. Work Entry Form
interface WorkFormModalProps {
  isOpen: boolean;
  editingWork?: Work | null;
  existingWorks: Work[];
  tags: Tag[];
  onClose: () => void;
  onSaveWork: (workData: Work, isUpdate: boolean) => void;
}

export const WorkFormModal: React.FC<WorkFormModalProps> = ({
  isOpen,
  editingWork,
  existingWorks,
  tags,
  onClose,
  onSaveWork,
}) => {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const [tmdbQuery, setTmdbQuery] = useState('');
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResultItem[]>([]);
  const [tmdbError, setTmdbError] = useState('');
  const [tmdbApiKey, setTmdbApiKey] = useState(DEFAULT_TMDB_API_KEY);
  const [showTmdbKeyInput, setShowTmdbKeyInput] = useState(false);
  const [posterUrl, setPosterUrl] = useState(editingWork?.posterUrl || '');
  const [backdropUrl, setBackdropUrl] = useState(editingWork?.backdropUrl || '');

  const [searchExistingQuery, setSearchExistingQuery] = useState('');
  const [selectedExistingId, setSelectedExistingId] = useState<string | null>(
    editingWork?.id || null
  );

  const [title, setTitle] = useState(editingWork?.title || '');
  const [originalTitle, setOriginalTitle] = useState(editingWork?.originalTitle || '');
  const [year, setYear] = useState(editingWork?.year?.toString() || '2024');
  const [type, setType] = useState<WorkType>(editingWork?.type || 'Movie');
  const [director, setDirector] = useState(editingWork?.director.join(', ') || '');
  const [cast, setCast] = useState(editingWork?.cast.join(', ') || '');
  const [genres, setGenres] = useState(editingWork?.genres.join(', ') || (lang === 'zh' ? '剧情' : 'Drama'));
  const [runtime, setRuntime] = useState(editingWork?.runtime?.toString() || '120');
  const [watchStatus, setWatchStatus] = useState<WatchStatus>(
    editingWork?.watchStatus || 'Watched'
  );
  const [hasRating, setHasRating] = useState<boolean>(
    editingWork ? editingWork.personalRating !== null : true
  );
  const [rating, setRating] = useState<string>(
    editingWork?.personalRating !== null && editingWork?.personalRating !== undefined
      ? editingWork.personalRating.toString()
      : '9.0'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(editingWork?.tags || []);
  const [favorite, setFavorite] = useState<boolean>(editingWork?.favorite || false);
  const [synopsis, setSynopsis] = useState<string>(editingWork?.synopsis || '');
  const [curatorNote, setCuratorNote] = useState<string>(editingWork?.curatorNote || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSearchTmdb = async () => {
    if (!tmdbQuery.trim()) return;
    setTmdbLoading(true);
    setTmdbError('');
    try {
      const items = await searchTmdb(tmdbQuery.trim(), tmdbApiKey);
      setTmdbResults(items);
      if (items.length === 0) {
        setTmdbError(lang === 'zh' ? '未检索到匹配的 TMDB 条目。' : 'No matching TMDB entries found.');
      }
    } catch (err) {
      setTmdbError(err instanceof Error ? err.message : 'TMDB error');
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleSelectTmdbItem = async (item: TmdbSearchResultItem) => {
    setTmdbLoading(true);
    setTmdbError('');
    try {
      const details = await fetchTmdbWorkDetails(item.id, item.mediaType, tmdbApiKey);
      setTitle(details.title);
      setOriginalTitle(details.originalTitle);
      setYear(details.year.toString());
      setType(details.type);
      setDirector(details.director.join(', '));
      setCast(details.cast.join(', '));
      setGenres(details.genres.join(', '));
      setRuntime(details.runtime.toString());
      setSynopsis(details.synopsis);
      if (details.posterUrl) setPosterUrl(details.posterUrl);
      if (details.backdropUrl) setBackdropUrl(details.backdropUrl);
      setTmdbResults([]);
      setTmdbQuery('');
    } catch (err) {
      setTmdbError(err instanceof Error ? err.message : 'Error fetching details');
    } finally {
      setTmdbLoading(false);
    }
  };

  const matchingExisting = searchExistingQuery.trim()
    ? existingWorks
        .filter(
          (w) =>
            w.title.toLowerCase().includes(searchExistingQuery.toLowerCase()) ||
            w.originalTitle.toLowerCase().includes(searchExistingQuery.toLowerCase())
        )
        .slice(0, 4)
    : [];

  const handleLoadExisting = (w: Work) => {
    setSelectedExistingId(w.id);
    setTitle(w.title);
    setOriginalTitle(w.originalTitle);
    setYear(w.year.toString());
    setType(w.type);
    setDirector(w.director.join(', '));
    setCast(w.cast.join(', '));
    setGenres(w.genres.join(', '));
    setRuntime(w.runtime.toString());
    setWatchStatus(w.watchStatus);
    setHasRating(w.personalRating !== null);
    setRating(w.personalRating !== null ? w.personalRating.toString() : '9.0');
    setSelectedTags(w.tags);
    setFavorite(w.favorite);
    setSynopsis(w.synopsis);
    setCuratorNote(w.curatorNote || '');
    setSearchExistingQuery('');
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg(lang === 'zh' ? '请填写作品名称（必填项）。' : 'Please provide a title (required).');
      return;
    }

    const duplicateByName =
      !editingWork && !selectedExistingId
        ? existingWorks.find(
            (w) =>
              w.title.trim().toLowerCase() === title.trim().toLowerCase() &&
              w.year === (parseInt(year, 10) || 2024)
          )
        : null;

    const targetExisting =
      editingWork ||
      (selectedExistingId ? existingWorks.find((w) => w.id === selectedExistingId) : null) ||
      duplicateByName;

    const parsedYear = Math.min(2035, Math.max(1888, parseInt(year, 10) || 2024));
    const parsedRuntime = Math.max(1, parseInt(runtime, 10) || 110);
    const dirList = director
      .split(/[,，/、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const castList = cast
      .split(/[,，/、]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const genreList = genres
      .split(/[,，/、]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedArt = generateWorkArtwork(
      title.trim(),
      originalTitle.trim() || title.trim(),
      parsedYear,
      dirList.length ? dirList : ['Unknown Director'],
      existingWorks.length + 1
    );

    const now = new Date().toISOString();
    const finalWork: Work = {
      id: targetExisting ? targetExisting.id : `work-${Date.now()}`,
      title: title.trim(),
      originalTitle: originalTitle.trim() || title.trim(),
      year: parsedYear,
      type,
      genres: genreList.length ? genreList : [lang === 'zh' ? '剧情' : 'Drama'],
      director: dirList.length ? dirList : [lang === 'zh' ? '未知导演' : 'Unknown Director'],
      cast: castList.length ? castList : [lang === 'zh' ? '演员' : 'Cast'],
      synopsis:
        synopsis.trim() ||
        (lang === 'zh'
          ? `${parsedYear} 年由 ${dirList.join(' / ') || '导演'} 执导的 ${t.type[type]}作品，收录于私人影视档案馆。`
          : `Archival record for the ${parsedYear} ${t.type[type]} directed by ${dirList.join(' / ') || 'Director'}.`),
      posterUrl:
        posterUrl || (targetExisting ? targetExisting.posterUrl : generatedArt.posterUrl),
      backdropUrl:
        backdropUrl || (targetExisting ? targetExisting.backdropUrl : generatedArt.backdropUrl),
      runtime: parsedRuntime,
      personalRating: hasRating
        ? Math.min(10, Math.max(1, Math.round(parseFloat(rating || '8.5') * 10) / 10))
        : null,
      watchStatus,
      tags: selectedTags,
      favorite,
      curatorNote: curatorNote.trim(),
      relatedWorkIds: targetExisting?.relatedWorkIds || [],
      createdAt: targetExisting ? targetExisting.createdAt : now,
      updatedAt: now,
    };

    onSaveWork(finalWork, Boolean(targetExisting));
    onClose();
  };

  return (
    <section className="max-w-[1360px] mx-auto px-6 sm:px-12 py-12 bg-[#211D1A]/40 transition-opacity duration-300">
      <div className="max-w-3xl space-y-8">
        <div className="flex items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[#9C948B] tracking-widest uppercase">
              {editingWork ? t.modals.workFolioRevision : t.modals.workFolioAcquisition}
            </span>
            <h3 className="text-xl font-editorial font-light text-[#E7E2DD]">
              {editingWork ? `${t.modals.workFolioRevision} · ${editingWork.title}` : t.modals.inscribeAction}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="ink-link text-xs">
            {t.actions.close}
          </button>
        </div>

        {!editingWork && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-baseline gap-4">
              <span className="text-[#9C948B]">{t.modals.tmdbLookupLabel}:</span>
              <input
                type="text"
                value={tmdbQuery}
                onChange={(e) => setTmdbQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchTmdb();
                  }
                }}
                placeholder={t.modals.tmdbLookupPlaceholder}
                className="ink-input w-64 text-xs"
              />
              <button
                type="button"
                disabled={tmdbLoading}
                onClick={handleSearchTmdb}
                className="ink-link text-xs"
              >
                {tmdbLoading ? t.actions.syncing : t.modals.queryTmdb}
              </button>
              <button
                type="button"
                onClick={() => setShowTmdbKeyInput(!showTmdbKeyInput)}
                className="ink-link text-[11px]"
              >
                {showTmdbKeyInput ? 'hide key' : 'api key'}
              </button>
            </div>

            {showTmdbKeyInput && (
              <div className="flex items-baseline gap-3">
                <span className="text-[#9C948B]">key:</span>
                <input
                  type="text"
                  value={tmdbApiKey}
                  onChange={(e) => setTmdbApiKey(e.target.value)}
                  className="ink-input w-72 font-mono text-xs"
                />
              </div>
            )}

            {tmdbError && <p className="text-xs text-[#A88F76]">{tmdbError}</p>}

            {tmdbResults.length > 0 && (
              <div className="space-y-2.5 pt-2">
                {tmdbResults.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-baseline justify-between gap-4 text-xs"
                  >
                    <span className="text-[#E7E2DD] truncate">
                      {item.title}{' '}
                      <span className="text-[#9C948B]">
                        ({item.originalTitle}, {item.year} · {item.mediaType})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectTmdbItem(item)}
                      className="ink-link ink-link-active shrink-0"
                    >
                      {t.modals.fillFolio} →
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-baseline gap-4 pt-1">
              <span className="text-[#9C948B]">{t.modals.existingCheckLabel}:</span>
              <input
                type="text"
                value={searchExistingQuery}
                onChange={(e) => setSearchExistingQuery(e.target.value)}
                placeholder={t.modals.existingCheckPlaceholder}
                className="ink-input w-64 text-xs"
              />
              {matchingExisting.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLoadExisting(item)}
                  className="ink-link text-xs"
                >
                  {t.modals.reuseAction(item.title, item.year)} →
                </button>
              ))}
            </div>
          </div>
        )}

        {errorMsg && <p className="text-xs text-[#A88F76]">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="flex items-baseline gap-3">
              <label className="text-[#9C948B] shrink-0">{t.modals.titleLabel} *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrorMsg('');
                }}
                placeholder={t.modals.titlePlaceholder}
                className="ink-input flex-1 text-sm"
              />
            </div>

            <div className="flex items-baseline gap-3">
              <label className="text-[#9C948B] shrink-0">{t.modals.originalLabel}</label>
              <input
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder={t.modals.originalPlaceholder}
                className="ink-input flex-1 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="text-[#9C948B]">{t.library.mediumFilterLabel}:</span>
            {(['Movie', 'TV Series', 'Anime', 'Documentary'] as WorkType[]).map((tType) => (
              <button
                key={tType}
                type="button"
                onClick={() => setType(tType)}
                className={`ink-link ${type === tType ? 'ink-link-active' : ''}`}
              >
                {t.type[tType]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="text-[#9C948B]">{t.library.statusFilterLabel}:</span>
            {(['Want to Watch', 'Watching', 'Watched', 'Paused', 'Dropped'] as WatchStatus[]).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setWatchStatus(st)}
                  className={`ink-link ${watchStatus === st ? 'ink-link-active' : ''}`}
                >
                  {t.status[st]}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.yearLabel}</label>
              <input
                type="number"
                min="1888"
                max="2035"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="ink-input w-20 font-mono"
              />
            </div>

            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.runtimeLabel}</label>
              <input
                type="number"
                min="1"
                max="999"
                value={runtime}
                onChange={(e) => setRuntime(e.target.value)}
                className="ink-input w-20 font-mono"
              />
            </div>

            <div className="flex items-baseline gap-3 col-span-2">
              <span className="text-[#9C948B] shrink-0">{t.modals.scoreLabel}</span>
              {hasRating ? (
                <>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-28 accent-[#A88F76] bg-transparent"
                  />
                  <span className="font-mono text-[#A88F76]">{parseFloat(rating).toFixed(1)}</span>
                </>
              ) : (
                <span className="text-[#9C948B]/60">{t.modals.unrated}</span>
              )}
              <button
                type="button"
                onClick={() => setHasRating(!hasRating)}
                className="ink-link text-[11px] ml-2"
              >
                {hasRating ? t.modals.leaveBlank : t.modals.enableScore}
              </button>
              <button
                type="button"
                onClick={() => setFavorite(!favorite)}
                className={`ink-link text-[11px] ml-3 ${favorite ? 'ink-link-active' : ''}`}
              >
                {favorite ? `· ${t.actions.favored}` : `· ${t.actions.favor}`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.directorLabel}</label>
              <input
                type="text"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                placeholder={lang === 'zh' ? '例如：侯孝贤' : 'Director name'}
                className="ink-input flex-1"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.castLabel}</label>
              <input
                type="text"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                placeholder={lang === 'zh' ? '主要演员' : 'Cast'}
                className="ink-input flex-1"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.genreLabel}</label>
              <input
                type="text"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder={lang === 'zh' ? '剧情, 历史' : 'Drama, History'}
                className="ink-input flex-1"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="text-[#9C948B]">{t.modals.tagsLabel}:</span>
            {tags.map((tItem) => {
              const active = selectedTags.includes(tItem.id);
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => toggleTag(tItem.id)}
                  className={`ink-link ${active ? 'ink-link-active' : ''}`}
                >
                  #{tItem.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.synopsisLabel}</label>
              <input
                type="text"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder={lang === 'zh' ? '故事脉络与背景…' : 'Plot synopsis…'}
                className="ink-input flex-1"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <label className="text-[#9C948B] shrink-0">{t.modals.noteLabel}</label>
              <input
                type="text"
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                placeholder={lang === 'zh' ? '私人美学批注…' : 'Curator reflections…'}
                className="ink-input flex-1"
              />
            </div>
          </div>

          <div className="flex items-baseline gap-6 pt-3">
            <button type="submit" className="ink-link ink-link-active text-sm">
              {editingWork || selectedExistingId
                ? t.modals.commitRevision
                : t.modals.inscribeAction}
            </button>
            <button type="button" onClick={onClose} className="ink-link text-xs">
              {t.actions.cancel}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

// 3. Watch Entry Form
interface WatchEntryModalProps {
  isOpen: boolean;
  works: Work[];
  defaultWorkId?: string;
  editingEntry?: WatchEntry | null;
  onClose: () => void;
  onSaveEntry: (entry: WatchEntry) => void;
}

export const WatchEntryModal: React.FC<WatchEntryModalProps> = ({
  isOpen,
  works,
  defaultWorkId,
  editingEntry,
  onClose,
  onSaveEntry,
}) => {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const [workId, setWorkId] = useState<string>(
    editingEntry?.workId || defaultWorkId || works[0]?.id || ''
  );
  const [watchedAt, setWatchedAt] = useState<string>(
    editingEntry?.watchedAt || new Date().toISOString().slice(0, 10)
  );
  const [hasRating, setHasRating] = useState<boolean>(
    editingEntry ? editingEntry.rating !== null : true
  );
  const [rating, setRating] = useState<string>(
    editingEntry?.rating !== null && editingEntry?.rating !== undefined
      ? editingEntry.rating.toString()
      : '9.2'
  );
  const [version, setVersion] = useState<string>(
    editingEntry?.version || '4K Criterion Restoration'
  );
  const [isRewatch, setIsRewatch] = useState<boolean>(editingEntry?.isRewatch || false);
  const [review, setReview] = useState<string>(editingEntry?.review || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workId) return;
    const entry: WatchEntry = {
      id: editingEntry ? editingEntry.id : `entry-${Date.now()}`,
      workId,
      watchedAt,
      rating: hasRating
        ? Math.min(10, Math.max(1, Math.round(parseFloat(rating || '9.0') * 10) / 10))
        : null,
      review: review.trim() || (lang === 'zh' ? '完成了一次沉浸观影记录。' : 'Completed a quiet screening session.'),
      isRewatch,
      version: version.trim() || 'Digital Projection',
      createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
    };
    onSaveEntry(entry);
    onClose();
  };

  return (
    <section className="max-w-[1360px] mx-auto px-6 sm:px-12 py-10 bg-[#211D1A]/40 transition-opacity duration-300">
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 text-xs">
        <div className="flex items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[#9C948B] tracking-widest uppercase">
              {editingEntry ? t.modals.logTitleEdit : t.modals.logTitleNew}
            </span>
            <h3 className="text-lg font-editorial font-light text-[#E7E2DD]">
              {editingEntry ? t.modals.logTitleEdit : t.modals.logTitleNew}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="ink-link text-xs">
            {t.actions.close}
          </button>
        </div>

        <div className="flex flex-wrap items-baseline gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-[#9C948B]">{t.modals.workLabel}:</span>
            <select
              value={workId}
              onChange={(e) => setWorkId(e.target.value)}
              disabled={Boolean(defaultWorkId && !editingEntry)}
              className="ink-input bg-transparent text-[#E7E2DD]"
            >
              {works.map((w) => (
                <option key={w.id} value={w.id} className="bg-[#171412]">
                  {w.title} ({w.year})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[#9C948B]">{t.modals.dateLabel}:</span>
            <input
              type="date"
              value={watchedAt}
              onChange={(e) => setWatchedAt(e.target.value)}
              className="ink-input font-mono"
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[#9C948B]">{t.modals.editionLabel}:</span>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="35mm / 4K Restoration"
              className="ink-input w-44"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => setIsRewatch(!isRewatch)}
            className={`ink-link ${isRewatch ? 'ink-link-active' : ''}`}
          >
            {isRewatch ? `· ${t.journal.rewatch}` : `· ${t.modals.firstViewing}`}
          </button>

          {hasRating && (
            <div className="flex items-center gap-3">
              <span className="text-[#9C948B]">{t.modals.scoreLabel}:</span>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.1"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-28 accent-[#A88F76] bg-transparent"
              />
              <span className="font-mono text-[#A88F76]">{parseFloat(rating).toFixed(1)}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setHasRating(!hasRating)}
            className="ink-link text-[11px]"
          >
            {hasRating ? t.modals.leaveBlank : t.modals.enableScore}
          </button>
        </div>

        <div className="space-y-1">
          <label className="block text-[#9C948B]">{t.modals.essayLabel} *</label>
          <textarea
            rows={3}
            required
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t.modals.essayPlaceholder}
            className="ink-input w-full text-sm leading-relaxed resize-none"
          />
        </div>

        <div className="flex items-baseline gap-6 pt-2">
          <button type="submit" className="ink-link ink-link-active">
            {t.actions.save}
          </button>
          <button type="button" onClick={onClose} className="ink-link">
            {t.actions.cancel}
          </button>
        </div>
      </form>
    </section>
  );
};

// 4. Data Management Drawer
interface DataManagementModalProps {
  isOpen: boolean;
  archive: ArchiveDatabaseSchema;
  isSyncingTmdb?: boolean;
  tmdbSyncProgress?: string;
  onSyncAllTmdbPosters?: () => void;
  onClose: () => void;
  onImportCsvRows: (rows: CsvImportCandidate[], skipDuplicates: boolean) => void;
  onRestoreBackup: (backup: ArchiveDatabaseSchema, mode: 'overwrite' | 'merge') => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  archive,
  isSyncingTmdb = false,
  tmdbSyncProgress = '',
  onSyncAllTmdbPosters,
  onClose,
  onImportCsvRows,
  onRestoreBackup,
  onResetDemoData,
  onClearAllData,
}) => {
  const { lang, t } = useLanguage();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'reset'>('csv');
  const [csvText, setCsvText] = useState<string>(
    `title,originalTitle,year,type,watchStatus,personalRating,tags,director,genres,review\n悲情城市,A City of Sadness,1989,Movie,Watched,9.7,Criterion 馆藏级,侯孝贤,剧情|历史,基隆山城与九份长镜头里的时代苍凉\n花样年华,In the Mood for Love,2000,Movie,Watched,9.9,Criterion 馆藏级,王家卫,剧情|爱情,重复导入测试条目`
  );
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [csvPreview, setCsvPreview] = useState<{
    candidates: CsvImportCandidate[];
    fatalError?: string;
  } | null>(null);

  const [jsonInput, setJsonInput] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'overwrite' | 'merge'>('merge');
  const [backupValidation, setBackupValidation] = useState<
    ReturnType<typeof archiveRepository.validateAndParseJsonBackup> | null
  >(null);
  const [confirmDangerAction, setConfirmDangerAction] = useState<'reset' | 'clear' | null>(null);

  const handleParseCsv = () => {
    const res = parseCsvImportPreview(csvText, archive.works);
    setCsvPreview(res);
  };

  const handleDownloadJson = () => {
    const raw = archiveRepository.exportJson(archive);
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinephile-archive-backup-v${archive.version}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setJsonInput(content);
      setBackupValidation(archiveRepository.validateAndParseJsonBackup(content));
    };
    reader.readAsText(file);
  };

  const handleValidateRawJson = () => {
    setBackupValidation(archiveRepository.validateAndParseJsonBackup(jsonInput));
  };

  return (
    <section className="max-w-[1360px] mx-auto px-6 sm:px-12 py-12 bg-[#211D1A]/40 transition-opacity duration-300">
      <div className="max-w-3xl space-y-8 text-xs">
        <div className="flex items-baseline justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-[#9C948B] tracking-widest uppercase">
              {t.modals.dataManagementTitle}
            </span>
            <h3 className="text-xl font-editorial font-light text-[#E7E2DD]">
              {t.modals.dataManagementTitle}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="ink-link text-xs">
            {t.actions.close}
          </button>
        </div>

        <div className="flex flex-wrap items-baseline gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`ink-link ${activeTab === 'csv' ? 'ink-link-active' : ''}`}
          >
            {t.modals.csvTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`ink-link ${activeTab === 'json' ? 'ink-link-active' : ''}`}
          >
            {t.modals.jsonTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`ink-link ${activeTab === 'reset' ? 'ink-link-active' : ''}`}
          >
            {t.modals.resetTab}
          </button>
        </div>

        {activeTab === 'csv' && (
          <div className="space-y-5">
            <p className="text-[#9C948B]">
              title, originalTitle, year, type, watchStatus, personalRating, tags, director, genres, review
            </p>
            <textarea
              rows={4}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="ink-input w-full font-mono text-xs leading-relaxed"
            />
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <button
                type="button"
                onClick={() => setSkipDuplicates(!skipDuplicates)}
                className={`ink-link ${skipDuplicates ? 'ink-link-active' : ''}`}
              >
                {skipDuplicates ? t.modals.skipDuplicates : t.modals.mergeDuplicates}
              </button>

              <button type="button" onClick={handleParseCsv} className="ink-link ink-link-active">
                {t.modals.parsePreview}
              </button>
            </div>

            {csvPreview?.fatalError && (
              <p className="text-[#A88F76]">{csvPreview.fatalError}</p>
            )}

            {csvPreview && !csvPreview.fatalError && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  {csvPreview.candidates.map((c) => (
                    <div
                      key={c.rowNumber}
                      className="flex items-baseline justify-between gap-4 text-xs"
                    >
                      <span className="font-mono text-[#9C948B]">#{c.rowNumber}</span>
                      <span className="text-[#E7E2DD] flex-1">
                        {c.title} ({c.year} · {t.type[c.type]}) — {t.status[c.watchStatus]}{' '}
                        {c.personalRating ?? t.modals.unrated}
                      </span>
                      <span className="text-[#A88F76]">
                        {c.error
                          ? c.error
                          : c.isDuplicate
                          ? skipDuplicates
                            ? (lang === 'zh' ? '重复 (将跳过)' : 'duplicate (skip)')
                            : (lang === 'zh' ? '重复 (将合并)' : 'duplicate (merge)')
                          : (lang === 'zh' ? '可新增' : 'valid')}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onImportCsvRows(csvPreview.candidates, skipDuplicates);
                    onClose();
                  }}
                  className="ink-link ink-link-active"
                >
                  {t.modals.restoreConfirm} →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[#9C948B]">
                {lang === 'zh'
                  ? `导出完整备份（含 ${archive.works.length} 部作品、${archive.watchEntries.length} 篇随笔，版本 v${archive.version}）`
                  : `Export backup (${archive.works.length} works, ${archive.watchEntries.length} reflections, v${archive.version})`}
              </span>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="ink-link ink-link-active"
              >
                {t.modals.exportJsonAction} →
              </button>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[#9C948B]">{t.modals.restoreJsonAction}:</span>
                <label className="ink-link cursor-pointer">
                  <span>{t.modals.chooseJsonFile}</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleJsonFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={3}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setBackupValidation(null);
                }}
                placeholder="Paste JSON archive content here for validation…"
                className="ink-input w-full font-mono text-xs"
              />

              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-6">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`ink-link ${restoreMode === 'merge' ? 'ink-link-active' : ''}`}
                  >
                    · {lang === 'zh' ? '安全合并模式' : 'merge mode'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestoreMode('overwrite')}
                    className={`ink-link ${restoreMode === 'overwrite' ? 'ink-link-active' : ''}`}
                  >
                    · {lang === 'zh' ? '完整覆盖模式' : 'overwrite mode'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleValidateRawJson}
                  className="ink-link ink-link-active"
                >
                  {t.modals.validateJsonFormat}
                </button>
              </div>

              {backupValidation && !backupValidation.valid && (
                <p className="text-[#A88F76]">{backupValidation.error}</p>
              )}

              {backupValidation && backupValidation.valid && backupValidation.data && (
                <div className="space-y-2 pt-2">
                  <p className="text-[#E7E2DD]">
                    {lang === 'zh'
                      ? `校验通过（v${backupValidation.summary?.version}）：含 ${backupValidation.summary?.worksCount} 部作品、${backupValidation.summary?.entriesCount} 篇随笔。`
                      : `Valid backup (v${backupValidation.summary?.version}): ${backupValidation.summary?.worksCount} works, ${backupValidation.summary?.entriesCount} reflections.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreBackup(backupValidation.data!, restoreMode);
                      onClose();
                    }}
                    className="ink-link ink-link-active"
                  >
                    {t.modals.restoreConfirm} →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div className="space-y-6">
            {onSyncAllTmdbPosters && (
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <span className="text-[#9C948B]">
                  {t.modals.syncTmdbNotice(archive.works.length)}
                  {tmdbSyncProgress && <span className="ml-2 text-[#A88F76]">({tmdbSyncProgress})</span>}
                </span>
                <button
                  type="button"
                  disabled={isSyncingTmdb}
                  onClick={onSyncAllTmdbPosters}
                  className="ink-link ink-link-active"
                >
                  {isSyncingTmdb ? t.actions.syncing : `${t.modals.refreshAllPosters} →`}
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[#9C948B]">
                {lang === 'zh'
                  ? '重置为初始预置的 26 部经典馆藏作品与随笔'
                  : 'Reset to initial 26 curated classics and reflections'}
              </span>
              <button
                type="button"
                onClick={() => setConfirmDangerAction('reset')}
                className="ink-link"
              >
                {t.modals.resetDemoAction}
              </button>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <span className="text-[#9C948B]">
                {lang === 'zh'
                  ? '清空全部本地馆藏记录（从零开始建立档案）'
                  : 'Clear all archive records (start fresh)'}
              </span>
              <button
                type="button"
                onClick={() => setConfirmDangerAction('clear')}
                className="ink-link"
              >
                {t.modals.clearAllAction}
              </button>
            </div>

            {confirmDangerAction && (
              <div className="flex items-baseline gap-6 pt-2">
                <span className="text-[#A88F76]">
                  {confirmDangerAction === 'reset'
                    ? t.modals.resetConfirmPrompt
                    : t.modals.clearConfirmPrompt}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDangerAction === 'reset') {
                      onResetDemoData();
                    } else {
                      onClearAllData();
                    }
                    setConfirmDangerAction(null);
                    onClose();
                  }}
                  className="ink-link ink-link-active"
                >
                  {t.actions.confirm}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDangerAction(null)}
                  className="ink-link"
                >
                  {t.actions.cancel}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
