import React, { useMemo, useState } from 'react';
import {
  Collection,
  LibraryViewMode,
  SortOption,
  Tag,
  WatchStatus,
  Work,
  WorkType,
} from '../../types';
import {
  LetterboxdRatingStars,
  PosterCard,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../../components/PosterCard';
import { useLanguage } from '../../lib/i18n';

interface LibraryPageProps {
  works: Work[];
  tags: Tag[];
  collections: Collection[];
  initialStatusFilter?: WatchStatus | 'ALL';
  initialFavoriteOnly?: boolean;
  initialSort?: SortOption;
  isSyncingTmdb?: boolean;
  onSyncAllTmdbPosters?: () => void;
  onSelectWork: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onQuickRate: (work: Work, e: React.MouseEvent) => void;
  onOpenAddWork: () => void;
  onOpenEditWork: (work: Work) => void;
  onDeleteWork: (workId: string) => void;
  onCreateCollection: (name: string, description: string, initialWorkIds: string[]) => void;
  onUpdateCollection: (collection: Collection) => void;
  onDeleteCollection: (collectionId: string) => void;
  onToggleWorkInCollection: (collectionId: string, workId: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onUpdateTag: (tagId: string, name: string, color: string) => void;
  onDeleteTag: (tagId: string) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  works,
  tags,
  collections,
  initialStatusFilter = 'ALL',
  initialFavoriteOnly = false,
  initialSort = 'createdAt-desc',
  isSyncingTmdb = false,
  onSyncAllTmdbPosters,
  onSelectWork,
  onToggleFavorite,
  onQuickRate,
  onOpenAddWork,
  onOpenEditWork,
  onDeleteWork,
  onCreateCollection,
  onUpdateCollection,
  onDeleteCollection,
  onToggleWorkInCollection,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
}) => {
  const { lang, t } = useLanguage();
  const [subTab, setSubTab] = useState<'works' | 'collections' | 'tags'>('works');
  const [viewMode, setViewMode] = useState<LibraryViewMode>('poster');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  const [typeFilter, setTypeFilter] = useState<WorkType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<WatchStatus | 'ALL'>(initialStatusFilter);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [favoriteOnly, setFavoriteOnly] = useState<boolean>(initialFavoriteOnly);
  const [decadeFilter, setDecadeFilter] = useState<string>('ALL');
  const [genreFilter, setGenreFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [collectionFilter, setCollectionFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);

  const [confirmDeleteWorkId, setConfirmDeleteWorkId] = useState<string | null>(null);

  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [editingCol, setEditingCol] = useState<Collection | null>(null);

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#A88F76');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const allGenres = useMemo(() => {
    const s = new Set<string>();
    works.forEach((w) => w.genres.forEach((g) => s.add(g)));
    return Array.from(s);
  }, [works]);

  const tagMap = useMemo(() => new Map(tags.map((tItem) => [tItem.id, tItem])), [tags]);

  const filteredWorks = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const activeCol = collections.find((c) => c.id === collectionFilter);

    const list = works.filter((w) => {
      if (typeFilter !== 'ALL' && w.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && w.watchStatus !== statusFilter) return false;
      if (favoriteOnly && !w.favorite) return false;
      if (minRatingFilter > 0 && (w.personalRating === null || w.personalRating < minRatingFilter)) {
        return false;
      }
      if (decadeFilter !== 'ALL') {
        if (decadeFilter === '2020s' && (w.year < 2020 || w.year > 2029)) return false;
        if (decadeFilter === '2010s' && (w.year < 2010 || w.year > 2019)) return false;
        if (decadeFilter === '2000s' && (w.year < 2000 || w.year > 2009)) return false;
        if (decadeFilter === '1990s' && (w.year < 1990 || w.year > 1999)) return false;
        if (decadeFilter === 'classic' && w.year >= 1990) return false;
      }
      if (genreFilter !== 'ALL' && !w.genres.includes(genreFilter)) return false;
      if (tagFilter !== 'ALL' && !w.tags.includes(tagFilter)) return false;
      if (activeCol && !activeCol.workIds.includes(w.id)) return false;

      if (q) {
        const tagNames = w.tags.map((tid) => tagMap.get(tid)?.name || '').join(' ');
        const haystack = [
          w.title,
          w.originalTitle,
          w.director.join(' '),
          w.cast.join(' '),
          w.genres.join(' '),
          tagNames,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'createdAt-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'createdAt-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'rating-desc') {
        return (b.personalRating ?? -1) - (a.personalRating ?? -1);
      }
      if (sortBy === 'year-desc') {
        return b.year - a.year;
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title, lang === 'zh' ? 'zh-CN' : 'en');
      }
      return 0;
    });
  }, [
    works,
    deferredSearchQuery,
    typeFilter,
    statusFilter,
    minRatingFilter,
    favoriteOnly,
    decadeFilter,
    genreFilter,
    tagFilter,
    collectionFilter,
    sortBy,
    collections,
    tagMap,
    lang,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    minRatingFilter > 0 ||
    favoriteOnly ||
    decadeFilter !== 'ALL' ||
    genreFilter !== 'ALL' ||
    tagFilter !== 'ALL' ||
    collectionFilter !== 'ALL';

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setMinRatingFilter(0);
    setFavoriteOnly(false);
    setDecadeFilter('ALL');
    setGenreFilter('ALL');
    setTagFilter('ALL');
    setCollectionFilter('ALL');
  };

  return (
    <div className="space-y-10 pb-20">
      {/* 
        Cleaned Sub-Navigation:
        - Removed duplicate search box, sync button, and inscribe button (already in global top bar)
        - Sub-tabs cleanly placed on left; counts, sort, and view modes aligned on right
      */}
      <div className="flex flex-wrap items-baseline justify-between gap-6 border-b border-[#211D1A]/60 pb-4">
        <div className="flex flex-wrap items-baseline gap-7 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('works')}
            className={`ink-link ${subTab === 'works' ? 'ink-link-active' : ''}`}
          >
            {t.library.allWorks} ({works.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('collections')}
            className={`ink-link ${subTab === 'collections' ? 'ink-link-active' : ''}`}
          >
            {t.library.curatedFolios} ({collections.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('tags')}
            className={`ink-link ${subTab === 'tags' ? 'ink-link-active' : ''}`}
          >
            {t.library.indexTags} ({tags.length})
          </button>
        </div>

        {subTab === 'works' && (
          <div className="flex flex-wrap items-baseline gap-6 text-xs">
            <span className="text-[11px] font-mono text-[#9C948B]/60">
              {t.library.showingCount(filteredWorks.length, works.length)}
            </span>

            {/* Sort Dropdown */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-[#9C948B]/60 font-mono text-[11px]">{t.sort.label}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label={t.sort.label}
                className="ink-input text-xs text-[#E7E2DD] cursor-pointer"
              >
                <option value="createdAt-desc" className="bg-[#171412]">{t.sort.createdAtDesc}</option>
                <option value="createdAt-asc" className="bg-[#171412]">{t.sort.createdAtAsc}</option>
                <option value="rating-desc" className="bg-[#171412]">{t.sort.ratingDesc}</option>
                <option value="year-desc" className="bg-[#171412]">{t.sort.yearDesc}</option>
                <option value="title-asc" className="bg-[#171412]">{t.sort.titleAsc}</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-baseline gap-2.5 text-[11px]">
              {(['poster', 'compact', 'list'] as LibraryViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setViewMode(v)}
                  className={`ink-link ${viewMode === v ? 'ink-link-active' : ''}`}
                >
                  {t.views[v]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {subTab === 'works' && (
        <div className="space-y-10">
          {/* 
            Strictly Aligned & Streamlined Classification:
            - Uniform label column width (w-12 sm:w-14) so every filter row begins at the exact same horizontal column
            - Clear separation of Status, Medium, Era, and Refine criteria
          */}
          <div className="space-y-3.5 text-xs">
            {/* Row 1: Status */}
            <div className="flex items-baseline gap-4 sm:gap-6">
              <span className="w-12 sm:w-14 flex-shrink-0 text-[#9C948B]/60 font-mono text-[11px] tracking-wider uppercase text-left select-none">
                {t.library.statusFilterLabel}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 flex-1">
                {(
                  ['ALL', 'Watched', 'Watching', 'Want to Watch', 'Paused', 'Dropped'] as const
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`ink-link ${statusFilter === st ? 'ink-link-active' : ''}`}
                  >
                    {st === 'ALL' ? t.library.all : t.status[st]}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setFavoriteOnly(!favoriteOnly)}
                  className={`ink-link ml-1 ${favoriteOnly ? 'ink-link-active' : ''}`}
                >
                  · {t.library.favoredOnly}
                </button>
              </div>
            </div>

            {/* Row 2: Medium */}
            <div className="flex items-baseline gap-4 sm:gap-6">
              <span className="w-12 sm:w-14 flex-shrink-0 text-[#9C948B]/60 font-mono text-[11px] tracking-wider uppercase text-left select-none">
                {t.library.mediumFilterLabel}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 flex-1">
                {(['ALL', 'Movie', 'TV Series', 'Anime', 'Documentary'] as const).map((tType) => (
                  <button
                    key={tType}
                    type="button"
                    onClick={() => setTypeFilter(tType)}
                    className={`ink-link ${typeFilter === tType ? 'ink-link-active' : ''}`}
                  >
                    {tType === 'ALL' ? t.library.all : t.type[tType]}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Era */}
            <div className="flex items-baseline gap-4 sm:gap-6">
              <span className="w-12 sm:w-14 flex-shrink-0 text-[#9C948B]/60 font-mono text-[11px] tracking-wider uppercase text-left select-none">
                {t.library.eraFilterLabel}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 flex-1 font-mono text-[11px]">
                {[
                  { id: 'ALL', label: t.library.all },
                  { id: '2020s', label: '2020s' },
                  { id: '2010s', label: '2010s' },
                  { id: '2000s', label: '2000s' },
                  { id: '1990s', label: '1990s' },
                  { id: 'classic', label: '<1990' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDecadeFilter(d.id)}
                    className={`ink-link ${decadeFilter === d.id ? 'ink-link-active' : ''}`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4: Refine (Score, Genre, Tag, Reset) */}
            <div className="flex items-baseline gap-4 sm:gap-6">
              <span className="w-12 sm:w-14 flex-shrink-0 text-[#9C948B]/60 font-mono text-[11px] tracking-wider uppercase text-left select-none">
                {lang === 'zh' ? '精选' : 'Refine'}
              </span>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 flex-1">
                {/* Score */}
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[#9C948B]/60 text-[11px]">{t.library.scoreFilterLabel}:</span>
                  {[
                    { v: 0, label: t.library.all },
                    { v: 9.5, label: '9.5+' },
                    { v: 9.0, label: '9.0+' },
                    { v: 8.0, label: '8.0+' },
                  ].map((r) => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setMinRatingFilter(r.v)}
                      className={`ink-link font-mono text-[11px] ${
                        minRatingFilter === r.v ? 'ink-link-active' : ''
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {/* Genre dropdown */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[#9C948B]/60 text-[11px]">{t.library.genreFilterLabel}:</span>
                  <select
                    value={genreFilter}
                    onChange={(e) => setGenreFilter(e.target.value)}
                    className="ink-input text-[11px] text-[#E7E2DD] cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#171412]">{t.library.all}</option>
                    {allGenres.map((g) => (
                      <option key={g} value={g} className="bg-[#171412]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag dropdown */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[#9C948B]/60 text-[11px]">{t.library.tagFilterLabel}:</span>
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="ink-input text-[11px] text-[#E7E2DD] cursor-pointer"
                  >
                    <option value="ALL" className="bg-[#171412]">{t.library.all}</option>
                    {tags.map((tg) => (
                      <option key={tg.id} value={tg.id} className="bg-[#171412]">
                        #{tg.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reset button if active */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="ink-link text-[#A88F76] text-[11px] ml-auto"
                  >
                    · {t.library.reset}
                  </button>
                )}
              </div>
            </div>
          </div>

          {confirmDeleteWorkId && (
            <div className="py-4 flex items-baseline justify-between gap-4 text-xs">
              <span className="text-[#A88F76]">
                {t.library.deleteConfirm(
                  works.find((w) => w.id === confirmDeleteWorkId)?.title || ''
                )}
              </span>
              <div className="flex items-baseline gap-6">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteWork(confirmDeleteWorkId);
                    setConfirmDeleteWorkId(null);
                  }}
                  className="ink-link ink-link-active"
                >
                  {t.actions.confirm} {t.actions.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteWorkId(null)}
                  className="ink-link"
                >
                  {t.actions.cancel}
                </button>
              </div>
            </div>
          )}

          {filteredWorks.length === 0 ? (
            <div className="py-16 space-y-4 text-xs">
              <p className="text-sm font-editorial font-light text-[#E7E2DD]">
                {t.library.noResults}
              </p>
              <div className="flex items-baseline gap-6">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="ink-link ink-link-active"
                  >
                    {t.library.reset}
                  </button>
                )}
                <button type="button" onClick={onOpenAddWork} className="ink-link">
                  + {t.actions.inscribe}
                </button>
              </div>
            </div>
          ) : viewMode === 'poster' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 items-start">
              {filteredWorks.map((work, idx) => (
                <PosterCard
                  key={work.id}
                  work={work}
                  staggerClass={idx % 3 === 1 ? 'md:mt-5' : idx % 3 === 2 ? 'md:mt-2.5' : ''}
                  onSelect={onSelectWork}
                  onToggleFavorite={onToggleFavorite}
                  onQuickRate={onQuickRate}
                />
              ))}
            </div>
          ) : viewMode === 'compact' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-10 items-start">
              {filteredWorks.map((work) => (
                <PosterCard
                  key={work.id}
                  work={work}
                  compact
                  onSelect={onSelectWork}
                  onToggleFavorite={onToggleFavorite}
                  onQuickRate={onQuickRate}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredWorks.map((w) => (
                <div
                  key={w.id}
                  onClick={() => onSelectWork(w.id)}
                  className="flex flex-wrap items-baseline justify-between gap-4 py-2 border-b border-[#211D1A]/50 last:border-b-0 cursor-pointer group"
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-xs text-[#9C948B]/60 w-10">
                      {w.year}
                    </span>
                    <span className="font-editorial text-sm font-light text-[#E7E2DD] group-hover:text-[#A88F76] transition-colors duration-300 truncate">
                      {w.title}
                    </span>
                    <span className="text-xs text-[#9C948B] truncate">
                      {w.originalTitle} · {w.director.join(' / ')}
                    </span>
                    <span className="text-[11px] text-[#A88F76]">
                      · {t.status[w.watchStatus]}
                    </span>
                  </div>

                  <div
                    className="flex items-baseline gap-5 text-xs shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => onQuickRate(w, e)}
                      className="ink-link font-mono"
                    >
                      <LetterboxdRatingStars rating={w.personalRating} size="xs" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEditWork(w)}
                      className="ink-link text-[11px]"
                    >
                      {t.actions.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteWorkId(w.id)}
                      className="ink-link text-[11px]"
                    >
                      {t.actions.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Collections Folio Tab */}
      {subTab === 'collections' && (
        <div className="space-y-12 text-xs">
          <div className="flex flex-wrap items-baseline gap-6">
            <span className="text-[#9C948B]">
              {editingCol ? t.library.editFolio(editingCol.name) : t.library.newFolio}:
            </span>
            <input
              type="text"
              value={editingCol ? editingCol.name : newColName}
              onChange={(e) =>
                editingCol
                  ? setEditingCol({ ...editingCol, name: e.target.value })
                  : setNewColName(e.target.value)
              }
              placeholder={t.library.folioTitlePlaceholder}
              className="ink-input w-56"
            />
            <input
              type="text"
              value={editingCol ? editingCol.description : newColDesc}
              onChange={(e) =>
                editingCol
                  ? setEditingCol({ ...editingCol, description: e.target.value })
                  : setNewColDesc(e.target.value)
              }
              placeholder={t.library.curatorNotePlaceholder}
              className="ink-input w-72"
            />
            {editingCol ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (editingCol.name.trim()) {
                      onUpdateCollection(editingCol);
                      setEditingCol(null);
                    }
                  }}
                  className="ink-link ink-link-active"
                >
                  {t.actions.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCol(null)}
                  className="ink-link"
                >
                  {t.actions.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!newColName.trim()) return;
                  onCreateCollection(newColName.trim(), newColDesc.trim(), []);
                  setNewColName('');
                  setNewColDesc('');
                }}
                className="ink-link ink-link-active"
              >
                + {t.library.newFolio}
              </button>
            )}
          </div>

          <div className="space-y-14">
            {collections.map((col) => {
              const colWorks = works.filter((w) => col.workIds.includes(w.id));
              return (
                <div key={col.id} className="space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-editorial font-light text-[#E7E2DD]">
                        {col.name}{' '}
                        <span className="text-xs font-mono text-[#9C948B]">
                          ({colWorks.length})
                        </span>
                      </h4>
                      <p className="text-xs text-[#9C948B]">{col.description}</p>
                    </div>

                    <div className="flex items-baseline gap-5 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setCollectionFilter(col.id);
                          setSubTab('works');
                        }}
                        className="ink-link ink-link-active"
                      >
                        {t.library.allWorks}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCol(col)}
                        className="ink-link"
                      >
                        {t.actions.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCollection(col.id)}
                        className="ink-link"
                      >
                        {t.actions.remove}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-end gap-5 pt-2">
                    {colWorks.map((w) => (
                      <div key={w.id} className="group space-y-1">
                        <div className="w-16 aspect-[2/3] overflow-hidden">
                          <img
                            src={w.posterUrl}
                            alt={w.title}
                            onClick={() => onSelectWork(w.id)}
                            className="archive-poster-img w-full h-full object-cover cursor-pointer"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleWorkInCollection(col.id, w.id)}
                          className="ink-link text-[10px]"
                        >
                          {t.actions.unlink}
                        </button>
                      </div>
                    ))}

                    <select
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          onToggleWorkInCollection(col.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="ink-input text-xs text-[#9C948B] cursor-pointer"
                    >
                      <option value="" className="bg-[#171412]">+ {t.library.addToFolio}</option>
                      {works
                        .filter((w) => !col.workIds.includes(w.id))
                        .map((w) => (
                          <option key={w.id} value={w.id} className="bg-[#171412]">
                            {w.title} ({w.year})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Tags Index Tab */}
      {subTab === 'tags' && (
        <div className="space-y-10 text-xs">
          <div className="flex flex-wrap items-baseline gap-6">
            <span className="text-[#9C948B]">
              {editingTag ? t.library.editTag(editingTag.name) : t.library.newTag}:
            </span>
            <input
              type="text"
              value={editingTag ? editingTag.name : newTagName}
              onChange={(e) =>
                editingTag
                  ? setEditingTag({ ...editingTag, name: e.target.value })
                  : setNewTagName(e.target.value)
              }
              placeholder={t.library.tagNamePlaceholder}
              className="ink-input w-56"
            />
            {editingTag ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (editingTag.name.trim()) {
                      onUpdateTag(editingTag.id, editingTag.name.trim(), editingTag.color);
                      setEditingTag(null);
                    }
                  }}
                  className="ink-link ink-link-active"
                >
                  {t.actions.save}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingTag(null)}
                  className="ink-link"
                >
                  {t.actions.cancel}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!newTagName.trim()) return;
                  onCreateTag(newTagName.trim(), newTagColor);
                  setNewTagName('');
                }}
                className="ink-link ink-link-active"
              >
                + {t.library.newTag}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {tags.map((tItem) => {
              const count = works.filter((w) => w.tags.includes(tItem.id)).length;
              return (
                <div key={tItem.id} className="flex items-baseline gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTagFilter(tItem.id);
                      setSubTab('works');
                    }}
                    className="ink-link text-sm text-[#E7E2DD]"
                  >
                    #{tItem.name}{' '}
                    <span className="text-xs font-mono text-[#9C948B]">({count})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTag(tItem)}
                    className="ink-link text-[11px]"
                  >
                    {t.actions.rename}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTag(tItem.id)}
                    className="ink-link text-[11px]"
                  >
                    {t.actions.remove}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
