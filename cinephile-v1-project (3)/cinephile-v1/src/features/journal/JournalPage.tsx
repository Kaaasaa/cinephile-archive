import React, { useMemo, useState } from 'react';
import { WatchEntry, Work } from '../../types';
import { LetterboxdRatingStars } from '../../components/PosterCard';
import { useLanguage } from '../../lib/i18n';

interface JournalPageProps {
  watchEntries: WatchEntry[];
  works: Work[];
  onSelectWork: (workId: string) => void;
  onOpenAddEntry: () => void;
  onOpenEditEntry: (entry: WatchEntry) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const JournalPage: React.FC<JournalPageProps> = ({
  watchEntries,
  works,
  onSelectWork,
  onOpenAddEntry,
  onOpenEditEntry,
  onDeleteEntry,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);

  const workMap = useMemo(() => new Map(works.map((w) => [w.id, w])), [works]);

  const stats = useMemo(() => {
    const totalScreenings = watchEntries.length;
    const uniqueWorkIds = new Set(watchEntries.map((e) => e.workId));
    const currentYear = '2026';
    const thisYearCount = watchEntries.filter((e) => e.watchedAt.startsWith(currentYear)).length;
    const ratedEntries = watchEntries.filter((e) => e.rating !== null);
    const avgRating =
      ratedEntries.length > 0
        ? (
            ratedEntries.reduce((sum, e) => sum + (e.rating || 0), 0) / ratedEntries.length
          ).toFixed(1)
        : '—';

    return {
      totalScreenings,
      uniqueWorksCount: uniqueWorkIds.size,
      thisYearCount,
      avgRating,
    };
  }, [watchEntries]);

  const availableYears = useMemo(() => {
    const ys = new Set<string>();
    watchEntries.forEach((e) => {
      if (e.watchedAt && e.watchedAt.length >= 4) {
        ys.add(e.watchedAt.slice(0, 4));
      }
    });
    return Array.from(ys).sort((a, b) => b.localeCompare(a));
  }, [watchEntries]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...watchEntries]
      .filter((entry) => {
        const w = workMap.get(entry.workId);
        if (yearFilter !== 'ALL' && !entry.watchedAt.startsWith(yearFilter)) return false;
        if (minRatingFilter > 0 && (entry.rating === null || entry.rating < minRatingFilter)) {
          return false;
        }
        if (q) {
          const hay = `${w?.title || ''} ${w?.originalTitle || ''} ${entry.review} ${entry.version}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));
  }, [watchEntries, workMap, searchQuery, yearFilter, minRatingFilter]);

  return (
    <div className="space-y-16 pb-28 max-w-4xl">
      {/* 
        Rule 6: 顶部统计栏、撰写随笔按钮、年份评分筛选全部保留
      */}
      <div className="space-y-5 border-b border-[#211D1A]/60 pb-5">
        <div className="flex flex-wrap items-baseline justify-between gap-6 text-xs">
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[#9C948B]">
            <span>
              {t.journal.totalScreenings}{' '}
              <strong className="font-mono font-normal text-[#E7E2DD] ml-1">
                {stats.totalScreenings}
              </strong>
            </span>
            <span>
              {t.journal.worksCount}{' '}
              <strong className="font-mono font-normal text-[#E7E2DD] ml-1">
                {stats.uniqueWorksCount}
              </strong>
            </span>
            <span>
              {t.journal.yearCount}{' '}
              <strong className="font-mono font-normal text-[#A88F76] ml-1">
                {stats.thisYearCount}
              </strong>
            </span>
            <span>
              {t.journal.meanScore}{' '}
              <strong className="font-mono font-normal text-[#A88F76] ml-1">
                {stats.avgRating}
              </strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAddEntry}
            className="ink-link ink-link-active text-xs"
          >
            + {t.actions.addLog}
          </button>
        </div>

        {/* Filter bar: Year & Score aligned */}
        <div className="flex flex-wrap items-baseline justify-between gap-6 text-xs pt-1">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div className="flex items-baseline gap-2.5">
              <span className="text-[#9C948B]/60 font-mono text-[11px]">{t.journal.yearFilterLabel}:</span>
              <button
                type="button"
                onClick={() => setYearFilter('ALL')}
                className={`ink-link ${yearFilter === 'ALL' ? 'ink-link-active' : ''}`}
              >
                {t.journal.all}
              </button>
              {availableYears.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearFilter(y)}
                  className={`ink-link font-mono ${yearFilter === y ? 'ink-link-active' : ''}`}
                >
                  {y}
                </button>
              ))}
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-[#9C948B]/60 font-mono text-[11px]">{t.journal.scoreFilterLabel}:</span>
              {[
                { v: 0, label: t.journal.all },
                { v: 9.5, label: '9.5+' },
                { v: 9.0, label: '9.0+' },
                { v: 8.0, label: '8.0+' },
              ].map((r) => (
                <button
                  key={r.v}
                  type="button"
                  onClick={() => setMinRatingFilter(r.v)}
                  className={`ink-link font-mono ${
                    minRatingFilter === r.v ? 'ink-link-active' : ''
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.actions.searchPlaceholder}
            className="ink-input w-44 text-xs"
          />
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="py-16 space-y-4 text-xs">
          <p className="text-sm font-editorial font-light text-[#E7E2DD]">{t.journal.emptyTitle}</p>
          <button
            type="button"
            onClick={onOpenAddEntry}
            className="ink-link ink-link-active"
          >
            + {t.actions.addLog}
          </button>
        </div>
      ) : (
        /* 
          Rule 1, 2, 3, 4, 5:
          - 双栏布局：左侧固定窄栏放日期、介质版本与柔和微缩海报；右侧为主阅读区
          - 影片标题适度突出，作为视觉锚点；正文大行高（leading-[2.1]）、适中行宽（max-w-2xl）
          - 编辑、删除小字批注放在正文末尾，弱化视觉权重
          - 条目之间只用留白分隔（space-y-16 sm:space-y-20），彻底禁止分割线与底色卡片
          - 左侧加入低饱和、低透明度极小缩略图（w-12 sm:w-14），柔和克制不抢视线
        */
        <div className="space-y-16 sm:space-y-20">
          {filteredEntries.map((entry) => {
            const work = workMap.get(entry.workId);
            const directorStr = work
              ? Array.isArray(work.director)
                ? work.director.join('/')
                : work.director
              : '';

            return (
              <article
                key={entry.id}
                className="group flex flex-col sm:flex-row gap-6 sm:gap-10 md:gap-12 items-start"
              >
                {/* 1. 左侧窄栏：固定放日期、介质版本标签，全部左对齐 + 5. 可选低饱和微缩海报 */}
                <div className="w-full sm:w-36 md:w-40 shrink-0 space-y-2.5 text-left">
                  <time className="block font-mono text-xs tracking-[0.14em] text-[#A88F76]">
                    {entry.watchedAt}
                  </time>

                  <div className="text-[11px] font-light text-[#9C948B]/70 tracking-wide leading-relaxed">
                    <span>{entry.version}</span>
                    {entry.isRewatch && (
                      <span className="block text-[#A88F76]/80 text-[10px] mt-0.5 font-mono">
                        · {t.journal.rewatch}
                      </span>
                    )}
                  </div>

                  {/* 5. 极小影片缩略图：低饱和、低透明度柔和视觉锚点，克制不抢视线 */}
                  {work?.posterUrl && (
                    <div
                      onClick={() => onSelectWork(work.id)}
                      className="w-12 sm:w-14 aspect-[2/3] overflow-hidden cursor-pointer mt-2.5 transition-all duration-500"
                      title={work.title}
                    >
                      <img
                        src={work.posterUrl}
                        alt={work.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover filter saturate-[0.55] brightness-[0.75] opacity-50 group-hover:opacity-90 group-hover:saturate-90 transition-all duration-500"
                      />
                    </div>
                  )}
                </div>

                {/* 2. 右侧主阅读区：影片标题作为视觉锚点，正文加大行高、控制行宽 */}
                <div className="flex-1 min-w-0 max-w-2xl space-y-3.5 text-left">
                  {/* 标题区：适度突出，辅以原名、年份、导演与星级 */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <h3
                        onClick={() => work && onSelectWork(work.id)}
                        className="text-lg sm:text-xl font-editorial font-normal text-[#E7E2DD] hover:text-[#A88F76] transition-colors cursor-pointer text-left tracking-wide"
                      >
                        {work ? work.title : '—'}
                      </h3>
                      {entry.rating !== null && (
                        <div className="inline-flex items-baseline gap-1.5 ml-1">
                          <LetterboxdRatingStars rating={entry.rating} size="xs" />
                          <span className="font-mono text-xs text-[#A88F76] font-normal">
                            {entry.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {work && (
                      <p className="text-xs font-light text-[#9C948B] tracking-wide">
                        {work.originalTitle} · {work.year} · {directorStr}
                      </p>
                    )}
                  </div>

                  {/* 正文阅读区：高行距、舒适行宽、文字自然排版 */}
                  <p className="font-editorial font-light text-sm sm:text-[15px] text-[#E7E2DD]/90 leading-[2.15] tracking-wide text-justify">
                    {entry.review}
                    {/* 3. 编辑、删除小字批注放在单条日志末尾，弱化视觉权重 */}
                    <span className="inline-flex items-baseline gap-2 pl-3 font-ui text-[11px] select-none text-[#9C948B]/35">
                      <button
                        type="button"
                        onClick={() => onOpenEditEntry(entry)}
                        className="ink-link text-[11px] text-[#9C948B]/50 hover:text-[#A88F76]"
                      >
                        {t.actions.edit}
                      </button>
                      <span className="text-[#9C948B]/20">/</span>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="ink-link text-[11px] text-[#9C948B]/50 hover:text-[#A88F76]"
                      >
                        {t.actions.delete}
                      </button>
                    </span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JournalPage;
