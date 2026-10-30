import React, { useState } from 'react';
import { WatchStatus, Work } from '../types';
import { createCriterionPosterSvg } from '../lib/artworkGenerator';
import { useLanguage } from '../lib/i18n';

export const STATUS_LABELS: Record<
  WatchStatus,
  { zh: string; en: string; dotColor: string }
> = {
  Watched: {
    zh: '已看',
    en: 'watched',
    dotColor: '#A88F76',
  },
  Watching: {
    zh: '在看',
    en: 'watching',
    dotColor: '#A88F76',
  },
  'Want to Watch': {
    zh: '想看',
    en: 'to watch',
    dotColor: '#9C948B',
  },
  Paused: {
    zh: '搁置',
    en: 'paused',
    dotColor: '#9C948B',
  },
  Dropped: {
    zh: '弃剧',
    en: 'dropped',
    dotColor: '#9C948B',
  },
};

export const TYPE_LABELS: Record<Work['type'], { zh: string; en: string }> = {
  Movie: { zh: '电影', en: 'film' },
  'TV Series': { zh: '剧集', en: 'series' },
  Anime: { zh: '动画', en: 'animation' },
  Documentary: { zh: '纪录片', en: 'documentary' },
};

export const LetterboxdRatingStars: React.FC<{
  rating: number | null;
  size?: 'xs' | 'sm';
}> = React.memo(({ rating }) => {
  const { t } = useLanguage();
  if (rating === null) {
    return <span className="text-[11px] font-mono text-[#9C948B]/50">{t.modals.unrated}</span>;
  }
  return (
    <span className="font-mono text-[11px] text-[#A88F76] tracking-wider">
      {rating.toFixed(1)}
    </span>
  );
});

interface PosterImageProps {
  work: Work;
  className?: string;
}

export const PosterImage: React.FC<PosterImageProps> = React.memo(({ work, className = '' }) => {
  const [hasError, setHasError] = useState(false);

  const fallbackSvg = createCriterionPosterSvg(
    work.title,
    work.originalTitle || work.title,
    work.year,
    work.director.join(' / ') || 'ARCHIVE',
    {
      bgPrimary: '#211D1A',
      bgSecondary: '#171412',
      accent: '#A88F76',
      motif: 'monolith',
      catalogCode: `NO.${work.id.replace(/\D/g, '').padStart(3, '0') || '001'}`,
    }
  );

  return (
    <div className={`relative aspect-[2/3] w-full overflow-hidden bg-transparent select-none ${className}`}>
      <img
        src={hasError || !work.posterUrl ? fallbackSvg : work.posterUrl}
        alt={work.title}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="archive-poster-img h-full w-full object-cover"
      />
    </div>
  );
});

interface PosterCardProps {
  work: Work;
  compact?: boolean;
  staggerClass?: string;
  onSelect: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onQuickRate?: (work: Work, e: React.MouseEvent) => void;
}

export const PosterCard: React.FC<PosterCardProps> = React.memo(({
  work,
  compact = false,
  staggerClass = '',
  onSelect,
  onToggleFavorite,
  onQuickRate,
}) => {
  const { lang, t } = useLanguage();
  const statusLabel = t.status[work.watchStatus];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(work.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(work.id);
        }
      }}
      className={`group flex flex-col text-left focus:outline-none ${staggerClass}`}
    >
      <div className="w-full aspect-[2/3] overflow-hidden">
        <PosterImage work={work} />
      </div>

      <div className={compact ? 'pt-2.5 space-y-0.5' : 'pt-3.5 space-y-1'}>
        <div className="flex items-baseline justify-between gap-2">
          <div className="truncate text-[#E7E2DD]/75 group-hover:text-[#E7E2DD] transition-colors duration-300">
            <span className={compact ? 'text-xs font-light' : 'text-[13px] font-light tracking-wide'}>
              {work.title}
            </span>
            <span className="text-[11px] font-light text-[#9C948B] group-hover:text-[#A88F76] transition-colors duration-300 ml-1.5">
              · {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 text-[11px] font-light text-[#9C948B]/70 group-hover:text-[#9C948B] transition-colors duration-300">
          <span className="truncate">
            {work.year}
            {!compact && work.director[0] ? ` · ${work.director[0]}` : ''}
          </span>

          <div className="flex items-baseline gap-2.5 shrink-0">
            {onQuickRate ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickRate(work, e);
                }}
                className="ink-link text-[11px] font-mono"
              >
                {work.personalRating !== null ? work.personalRating.toFixed(1) : t.actions.rate}
              </button>
            ) : (
              work.personalRating !== null && (
                <span className="font-mono text-[#A88F76]">{work.personalRating.toFixed(1)}</span>
              )
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(work.id, e);
              }}
              className={`ink-link text-[11px] ${
                work.favorite ? 'text-[#A88F76]' : 'text-[#9C948B]/60'
              }`}
            >
              {work.favorite ? t.actions.favored : t.actions.favor}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
