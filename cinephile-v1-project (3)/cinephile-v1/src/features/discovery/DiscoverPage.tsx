import React, { useMemo, useState } from 'react';
import { Tag, Work } from '../../types';
import {
  buildRecommendations,
  RecommendationItem,
  runLocalAdvisorRule,
} from '../../services/recommendationEngine';
import { PosterImage, STATUS_LABELS } from '../../components/PosterCard';
import { useLanguage } from '../../lib/i18n';

interface DiscoverPageProps {
  works: Work[];
  tags: Tag[];
  dismissedIds: string[];
  onSelectWork: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onDismissRecommendation: (workId: string) => void;
  onResetDismissed: () => void;
}

export const DiscoverPage: React.FC<DiscoverPageProps> = ({
  works,
  tags,
  dismissedIds,
  onSelectWork,
  onToggleFavorite,
  onDismissRecommendation,
  onResetDismissed,
}) => {
  const { lang, t } = useLanguage();
  const [selectedAdvisorPrompt, setSelectedAdvisorPrompt] = useState<
    'high-rated' | 'cross-genre' | 'auteur-focus' | 'late-night'
  >('high-rated');

  const sections = useMemo(
    () => buildRecommendations(works, tags, dismissedIds),
    [works, tags, dismissedIds]
  );

  const advisorResult = useMemo(
    () => runLocalAdvisorRule(selectedAdvisorPrompt, works, tags, dismissedIds),
    [selectedAdvisorPrompt, works, tags, dismissedIds]
  );

  const renderRecCard = (item: RecommendationItem, idx: number) => {
    const { work, reasonLabel, reasonDetail } = item;
    return (
      <div
        key={work.id}
        className={`group flex flex-col justify-between space-y-3 ${
          idx % 2 === 1 ? 'md:mt-5' : ''
        }`}
      >
        <div>
          <div
            onClick={() => onSelectWork(work.id)}
            className="aspect-[2/3] cursor-pointer overflow-hidden"
          >
            <PosterImage work={work} />
          </div>

          <div
            onClick={() => onSelectWork(work.id)}
            className="pt-3 space-y-1 cursor-pointer"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="truncate text-[#E7E2DD]/85 group-hover:text-[#E7E2DD] transition-colors duration-300">
                <span className="text-[13px] font-light">{work.title}</span>
                <span className="text-[11px] font-light text-[#A88F76] ml-1.5">
                  · {t.status[work.watchStatus]}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#9C948B]/70 shrink-0">
                {work.year}
              </span>
            </div>

            <p className="text-[11px] font-light text-[#A88F76] truncate">{reasonLabel}</p>
            <p className="text-xs font-light text-[#9C948B]/75 line-clamp-2 leading-relaxed">
              {reasonDetail}
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between text-[11px] pt-1">
          <div className="flex items-baseline gap-4">
            <button
              type="button"
              onClick={() => onSelectWork(work.id)}
              className="ink-link ink-link-active"
            >
              {t.actions.details} →
            </button>
            <button
              type="button"
              onClick={(e) => onToggleFavorite(work.id, e)}
              className={`ink-link ${work.favorite ? 'ink-link-active' : ''}`}
            >
              {work.favorite ? t.actions.favored : t.actions.favor}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onDismissRecommendation(work.id)}
            className="ink-link text-[11px]"
          >
            {t.actions.dismiss}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-20 pb-20">
      {dismissedIds.length > 0 && (
        <div className="flex justify-end text-xs">
          <button
            type="button"
            onClick={onResetDismissed}
            className="ink-link ink-link-active"
          >
            {t.actions.restoreHidden} ({dismissedIds.length})
          </button>
        </div>
      )}

      {/* Local Rule-Based Advisor as Boxless Flowing Text Section */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-base font-editorial font-light tracking-[0.12em] text-[#E7E2DD]">
              {t.discover.curatorialAdvisor} ({t.discover.advisorLocalNotice})
            </h2>

            <div className="flex flex-wrap items-baseline gap-6 text-xs">
              {[
                { id: 'high-rated', label: t.discover.advisorPrompts.highRated },
                { id: 'auteur-focus', label: t.discover.advisorPrompts.auteurFocus },
                { id: 'cross-genre', label: t.discover.advisorPrompts.crossGenre },
                { id: 'late-night', label: t.discover.advisorPrompts.lateNight },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedAdvisorPrompt(p.id as typeof selectedAdvisorPrompt)}
                  className={`ink-link ${
                    selectedAdvisorPrompt === p.id ? 'ink-link-active' : ''
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs font-light text-[#9C948B] max-w-3xl">
            {advisorResult.explanation}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-10 pt-2">
          {advisorResult.items.map((item, idx) => (
            <div
              key={item.work.id}
              onClick={() => onSelectWork(item.work.id)}
              className={`group cursor-pointer space-y-2.5 ${idx % 2 === 1 ? 'sm:mt-4' : ''}`}
            >
              <div className="w-full aspect-[2/3] overflow-hidden">
                <PosterImage work={item.work} />
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-light text-[#A88F76] block truncate">
                  {item.reasonLabel}
                </span>
                <h4 className="text-xs font-editorial font-light text-[#E7E2DD] group-hover:text-[#A88F76] transition-colors duration-300 truncate">
                  {item.work.title} ({item.work.year})
                </h4>
              </div>
            </div>
          ))}
        </div>
      </section>

      {[
        { title: t.discover.priorityUnwatched, items: sections.topPicksForYou },
        { title: t.discover.auteurCastLineage, items: sections.byAuteurAndCast },
        { title: t.discover.thematicResonance, items: sections.byGenreAndTag },
        { title: t.discover.crossMediumHorizon, items: sections.exploratoryHorizon },
      ].map((sec) => (
        <section key={sec.title} className="space-y-8">
          <h2 className="text-sm font-editorial font-light tracking-[0.12em] text-[#E7E2DD]">
            {sec.title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 items-start">
            {sec.items.map((item, idx) => renderRecCard(item, idx))}
          </div>
        </section>
      ))}
    </div>
  );
};
