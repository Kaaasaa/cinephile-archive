import React, { useEffect, useMemo, useState } from 'react';
import { Tag, WatchStatus, Work } from '../../types';
import {
  LetterboxdRatingStars,
  PosterCard,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../../components/PosterCard';
import { buildRecommendations } from '../../services/recommendationEngine';
import { useLanguage } from '../../lib/i18n';

interface HomePageProps {
  works: Work[];
  tags: Tag[];
  dismissedRecIds: string[];
  isSyncingTmdb?: boolean;
  tmdbSyncProgress?: string;
  onSyncAllTmdbPosters?: () => void;
  onSelectWork: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onQuickRate: (work: Work, e: React.MouseEvent) => void;
  onNavigateToLibraryFilter: (filterPreset: {
    status?: WatchStatus | 'ALL';
    favoriteOnly?: boolean;
    sort?: 'createdAt-desc' | 'rating-desc';
  }) => void;
  onNavigateToDiscover: () => void;
  onOpenQuickAdd: () => void;
  onRestoreDemoSeed: () => void;
}

const STAGGER_PATTERNS = [
  'md:mt-0',
  'md:mt-6',
  'md:mt-2',
  'md:mt-8',
  'md:mt-3',
  'md:mt-7',
];

interface HeroSectionProps {
  featuredPool: Work[];
  onSelectWork: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onQuickRate: (work: Work, e: React.MouseEvent) => void;
}

const HeroSection: React.FC<HeroSectionProps> = React.memo(({
  featuredPool,
  onSelectWork,
  onToggleFavorite,
  onQuickRate,
}) => {
  const { lang, t } = useLanguage();
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  useEffect(() => {
    if (isCarouselPaused || featuredPool.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredPool.length);
    }, 6500);
    return () => clearInterval(timer);
  }, [isCarouselPaused, featuredPool.length]);

  const activeFeatured =
    featuredPool[featuredIndex % Math.max(1, featuredPool.length)] || featuredPool[0];

  if (!activeFeatured) return null;

  return (
    <section
      onMouseEnter={() => setIsCarouselPaused(true)}
      onMouseLeave={() => setIsCarouselPaused(false)}
      className="relative overflow-hidden"
    >
      {/* 
        Clean, unobstructed cinema backdrop:
        - Top-right overlay removed (duplicate sync and view switcher removed)
        - Bottom-right thumbnail strip removed to let the native composition breathe
      */}
      <div className="relative h-[440px] sm:h-[540px] lg:h-[600px] w-full flex flex-col justify-end">
        <img
          src={activeFeatured.backdropUrl}
          alt={activeFeatured.title}
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-95 transition-opacity duration-700"
        />
        {/* Soft atmospheric gradient masking: bottom and left only */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#171412] via-[#171412]/70 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 left-0 w-80 bg-gradient-to-r from-[#171412]/60 via-transparent to-transparent pointer-events-none" />

        {/* Bottom Left: Pure, delicate typography & actions */}
        <div className="relative z-10 w-full px-6 sm:px-10 pb-8 flex items-end justify-between gap-6">
          <div className="max-w-xl space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-editorial font-light text-[#E7E2DD] tracking-widest">
                  {activeFeatured.title}
                </h1>
                <span className="text-xs font-light text-[#9C948B]">
                  {activeFeatured.originalTitle}
                </span>
                <span className="text-[11px] font-light text-[#A88F76]">
                  · {t.status[activeFeatured.watchStatus]}
                </span>
              </div>
              <p className="text-xs text-[#9C948B] font-light tracking-wide">
                {activeFeatured.year} · {Array.isArray(activeFeatured.director) ? activeFeatured.director.join('/') : activeFeatured.director} · {activeFeatured.runtime}{' '}
                {t.home.min}
              </p>
            </div>

            <div className="flex flex-wrap items-baseline gap-5 pt-1 text-xs">
              <button
                type="button"
                onClick={() => onSelectWork(activeFeatured.id)}
                className="ink-link ink-link-active"
              >
                {t.actions.openFolio}
              </button>

              <button
                type="button"
                onClick={(e) => onToggleFavorite(activeFeatured.id, e)}
                className={`ink-link ${activeFeatured.favorite ? 'ink-link-active' : ''}`}
              >
                {activeFeatured.favorite ? t.actions.favored : t.actions.favor}
              </button>

              <button
                type="button"
                onClick={(e) => onQuickRate(activeFeatured, e)}
                className="ink-link font-mono"
              >
                {activeFeatured.personalRating !== null
                  ? `${t.actions.rate} ${activeFeatured.personalRating.toFixed(1)}`
                  : t.actions.rate}
              </button>

              {/* Minimal inline slide indicator (no boxes, no poster thumbnails blocking the view) */}
              {featuredPool.length > 1 && (
                <div className="flex items-baseline gap-2.5 pl-3 border-l border-[#9C948B]/25 text-[11px] text-[#9C948B]/70">
                  <button
                    type="button"
                    onClick={() =>
                      setFeaturedIndex(
                        (prev) => (prev - 1 + featuredPool.length) % featuredPool.length
                      )
                    }
                    className="ink-link text-[11px]"
                    aria-label="Previous"
                  >
                    ←
                  </button>
                  <span className="font-mono text-[10px] tracking-widest text-[#9C948B]/80">
                    {String((featuredIndex % featuredPool.length) + 1).padStart(2, '0')}&thinsp;/&thinsp;
                    {String(featuredPool.length).padStart(2, '0')}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setFeaturedIndex((prev) => (prev + 1) % featuredPool.length)
                    }
                    className="ink-link text-[11px]"
                    aria-label="Next"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export const HomePage: React.FC<HomePageProps> = React.memo(({
  works,
  tags,
  dismissedRecIds,
  isSyncingTmdb = false,
  tmdbSyncProgress = '',
  onSyncAllTmdbPosters,
  onSelectWork,
  onToggleFavorite,
  onQuickRate,
  onNavigateToLibraryFilter,
  onNavigateToDiscover,
  onOpenQuickAdd,
  onRestoreDemoSeed,
}) => {
  const { t } = useLanguage();
  const [wallViewMode, setWallViewMode] = useState<'grid' | 'list'>('grid');

  const featuredPool = useMemo(() => {
    const favs = works.filter((w) => w.favorite);
    if (favs.length >= 4) return favs.slice(0, 6);
    return [...works]
      .sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0))
      .slice(0, 6);
  }, [works]);

  const recentlyAdded = useMemo(
    () =>
      [...works]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [works]
  );

  const continueWatching = useMemo(
    () =>
      works
        .filter(
          (w) =>
            w.watchStatus === 'Watching' ||
            w.watchStatus === 'Paused' ||
            w.watchStatus === 'Want to Watch'
        )
        .slice(0, 6),
    [works]
  );

  const yourFavorites = useMemo(
    () =>
      works
        .filter((w) => w.favorite)
        .sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0))
        .slice(0, 6),
    [works]
  );

  const recommendedForYou = useMemo(() => {
    const rec = buildRecommendations(works, tags, dismissedRecIds);
    const rawList = [
      ...rec.topPicksForYou,
      ...rec.byAuteurAndCast,
      ...rec.byGenreAndTag,
      ...rec.exploratoryHorizon,
    ];
    // Map RecommendationItem to actual Work objects and filter duplicates
    const seen = new Set<string>();
    const uniqueWorks: Work[] = [];
    for (const item of rawList) {
      if (item && item.work && !seen.has(item.work.id)) {
        seen.add(item.work.id);
        uniqueWorks.push(item.work);
      }
    }
    return uniqueWorks.slice(0, 6);
  }, [works, tags, dismissedRecIds]);

  if (works.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-28 px-4 text-center space-y-6">
        <p className="text-base font-editorial font-light text-[#E7E2DD] tracking-widest">
          {t.home.emptyTitle}
        </p>
        <div className="flex flex-wrap items-baseline justify-center gap-8 text-xs">
          <button type="button" onClick={onOpenQuickAdd} className="ink-link ink-link-active">
            {t.actions.inscribeFirst}
          </button>
          <button type="button" onClick={onRestoreDemoSeed} className="ink-link">
            {t.actions.restoreClassics}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-24 pb-20">
      <HeroSection
        featuredPool={featuredPool}
        onSelectWork={onSelectWork}
        onToggleFavorite={onToggleFavorite}
        onQuickRate={onQuickRate}
      />

      {[
        {
          id: 'continue',
          title: t.home.currentlyScreening,
          count: continueWatching.length,
          items: continueWatching,
          onAction: () => onNavigateToLibraryFilter({ status: 'Watching' }),
        },
        {
          id: 'recent',
          title: t.home.recentAcquisitions,
          count: works.length,
          items: recentlyAdded,
          onAction: () => onNavigateToLibraryFilter({ sort: 'createdAt-desc' }),
        },
        {
          id: 'favorites',
          title: t.home.personalCanon,
          count: works.filter((w) => w.favorite).length,
          items: yourFavorites,
          onAction: () => onNavigateToLibraryFilter({ favoriteOnly: true, sort: 'rating-desc' }),
        },
      ].map((sec, secIdx) => (
        <section key={sec.id} className="space-y-8">
          <div className="flex items-baseline justify-between border-b border-[#211D1A]/60 pb-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-editorial font-light tracking-[0.14em] text-[#E7E2DD]">
                {sec.title}
              </h2>
              <span className="text-[11px] font-mono text-[#9C948B]/60">({sec.count})</span>
            </div>

            <div className="flex items-baseline gap-6">
              {/* View Switcher placed appropriately above exhibition wall */}
              {secIdx === 0 && (
                <div className="flex items-baseline gap-2.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWallViewMode('grid')}
                    className={`ink-link ${wallViewMode === 'grid' ? 'ink-link-active' : ''}`}
                  >
                    {t.views.folio}
                  </button>
                  <span className="text-[#9C948B]/35">/</span>
                  <button
                    type="button"
                    onClick={() => setWallViewMode('list')}
                    className={`ink-link ${wallViewMode === 'list' ? 'ink-link-active' : ''}`}
                  >
                    {t.views.index}
                  </button>
                </div>
              )}

              <button type="button" onClick={sec.onAction} className="ink-link text-xs">
                {t.actions.indexAll} →
              </button>
            </div>
          </div>

          {sec.items.length === 0 ? (
            <p className="py-6 text-xs font-light text-[#9C948B]/60">{t.home.emptySection}</p>
          ) : wallViewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-8 gap-y-12 items-start">
              {sec.items.map((work, idx) => {
                const staggerClass =
                  STAGGER_PATTERNS[(idx + secIdx * 2) % STAGGER_PATTERNS.length];
                return (
                  <PosterCard
                    key={work.id}
                    work={work}
                    staggerClass={staggerClass}
                    onSelect={onSelectWork}
                    onToggleFavorite={onToggleFavorite}
                    onQuickRate={onQuickRate}
                  />
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {sec.items.map((work) => (
                <div
                  key={work.id}
                  className="flex flex-wrap items-baseline justify-between gap-4 py-2 border-b border-[#211D1A]/50 last:border-b-0 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onSelectWork(work.id)}
                    className="ink-link text-left"
                  >
                    <span className="text-[#E7E2DD]">{work.title}</span>
                    <span className="text-[#9C948B] ml-2">
                      ({work.originalTitle}, {work.year}) · {Array.isArray(work.director) ? work.director.join('/') : work.director}
                    </span>
                  </button>

                  <div className="flex items-baseline gap-4">
                    <span className="text-[11px] font-mono text-[#A88F76]">
                      {t.status[work.watchStatus]}
                    </span>
                    {work.personalRating !== null && (
                      <span className="font-mono text-xs text-[#A88F76]">
                        ★ {work.personalRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {recommendedForYou.length > 0 && (
        <section className="space-y-8 pt-8 border-t border-[#211D1A]">
          <div className="flex items-baseline justify-between border-b border-[#211D1A]/60 pb-3">
            <div className="flex items-baseline gap-3">
              <h2 className="text-sm font-editorial font-light tracking-[0.14em] text-[#E7E2DD]">
                {t.home.curatedResonance}
              </h2>
              <span className="text-[11px] font-mono text-[#9C948B]/60">
                ({recommendedForYou.length})
              </span>
            </div>
            <button type="button" onClick={onNavigateToDiscover} className="ink-link text-xs">
              {t.actions.details} →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-8 gap-y-12 items-start">
            {recommendedForYou.map((work, idx) => (
              <PosterCard
                key={work.id}
                work={work}
                staggerClass={STAGGER_PATTERNS[idx % STAGGER_PATTERNS.length]}
                onSelect={onSelectWork}
                onToggleFavorite={onToggleFavorite}
                onQuickRate={onQuickRate}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

export default HomePage;
