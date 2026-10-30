import React, { useMemo, useState } from 'react';
import { Person, Work } from '../../types';
import { PosterCard } from '../../components/PosterCard';
import { createAvatarSvg } from '../../lib/artworkGenerator';
import { useLanguage } from '../../lib/i18n';

interface PeoplePageProps {
  people: Person[];
  works: Work[];
  selectedPersonId: string | null;
  isSyncingPeople?: boolean;
  onSyncAllPeople?: () => void;
  onSelectPerson: (personId: string | null) => void;
  onSelectWork: (workId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onQuickRate: (work: Work, e: React.MouseEvent) => void;
}

const PersonAvatar: React.FC<{ person: Person; sizeClass?: string }> = ({
  person,
  sizeClass = 'w-16 h-16',
}) => {
  const [failed, setFailed] = useState(false);
  const fallback = createAvatarSvg(person.originalName || person.name, person.role, '#A88F76');

  return (
    <img
      src={failed || !person.avatarUrl ? fallback : person.avatarUrl}
      alt={person.name}
      onError={() => setFailed(true)}
      className={`${sizeClass} rounded-full object-cover shrink-0 opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
    />
  );
};

export const PeoplePage: React.FC<PeoplePageProps> = ({
  people,
  works,
  selectedPersonId,
  isSyncingPeople = false,
  onSyncAllPeople,
  onSelectPerson,
  onSelectWork,
  onToggleFavorite,
  onQuickRate,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [sortByCount, setSortByCount] = useState<'desc' | 'asc'>('desc');

  const getPersonWorks = (person: Person): Work[] =>
    works.filter(
      (w) =>
        person.workIds.includes(w.id) ||
        w.director.includes(person.name) ||
        w.cast.includes(person.name)
    );

  const filteredPeople = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return people
      .filter((p) => {
        if (roleFilter !== 'ALL' && !p.role.toLowerCase().includes(roleFilter.toLowerCase())) {
          return false;
        }
        if (q) {
          const hay = `${p.name} ${p.originalName || ''} ${p.nationality || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const countA = getPersonWorks(a).length;
        const countB = getPersonWorks(b).length;
        return sortByCount === 'desc' ? countB - countA : countA - countB;
      });
  }, [people, works, searchQuery, roleFilter, sortByCount]);

  const activePerson = selectedPersonId
    ? people.find((p) => p.id === selectedPersonId) || null
    : null;

  if (activePerson) {
    const personWorks = getPersonWorks(activePerson);
    const ratedWorks = personWorks.filter((w) => w.personalRating !== null);
    const avgScore =
      ratedWorks.length > 0
        ? (
            ratedWorks.reduce((acc, w) => acc + (w.personalRating || 0), 0) / ratedWorks.length
          ).toFixed(1)
        : '—';

    return (
      <div className="space-y-16 pb-20">
        <button
          type="button"
          onClick={() => onSelectPerson(null)}
          className="ink-link text-xs"
        >
          ← {t.people.returnToDirectory}
        </button>

        <section className="flex flex-col md:flex-row gap-10 items-start">
          <PersonAvatar person={activePerson} sizeClass="w-24 h-24 sm:w-28 sm:h-28" />
          <div className="flex-1 space-y-4 max-w-3xl">
            <div className="space-y-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-2xl sm:text-3xl font-editorial font-light text-[#E7E2DD] tracking-widest">
                  {activePerson.name}
                </h1>
                {activePerson.originalName && (
                  <span className="text-xs font-mono text-[#9C948B]">
                    {activePerson.originalName}
                  </span>
                )}
                <span className="text-xs text-[#A88F76]">· {activePerson.role}</span>
              </div>

              <div className="flex flex-wrap items-baseline gap-6 text-xs text-[#9C948B]">
                {activePerson.nationality && <span>{activePerson.nationality}</span>}
                {activePerson.birthYear && (
                  <span className="font-mono">b. {activePerson.birthYear}</span>
                )}
                <span>
                  {t.people.archivedCount} ·{' '}
                  <strong className="font-mono font-normal text-[#E7E2DD]">
                    {personWorks.length}
                  </strong>
                </span>
                <span>
                  {t.people.meanScore} ·{' '}
                  <strong className="font-mono font-normal text-[#A88F76]">{avgScore}</strong>
                </span>
              </div>
            </div>

            <p className="text-sm font-editorial font-light text-[#E7E2DD]/85 leading-[1.9]">
              {activePerson.biography}
            </p>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-sm font-editorial font-light tracking-[0.12em] text-[#E7E2DD]">
            {t.people.archivedFilmography} ({personWorks.length})
          </h2>

          {personWorks.length === 0 ? (
            <p className="text-xs font-light text-[#9C948B]/60">{t.people.emptyWorks}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 items-start">
              {personWorks.map((w, idx) => (
                <PosterCard
                  key={w.id}
                  work={w}
                  staggerClass={idx % 2 === 1 ? 'md:mt-5' : ''}
                  onSelect={onSelectWork}
                  onToggleFavorite={onToggleFavorite}
                  onQuickRate={onQuickRate}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-14 pb-20">
      <div className="flex flex-wrap items-baseline justify-between gap-6 text-xs">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-[#9C948B]/60 font-mono text-[11px]">{t.people.roleFilterLabel}:</span>
          {[
            { id: 'ALL', label: t.people.roles.all },
            { id: 'Director', label: t.people.roles.director },
            { id: 'Actor', label: t.people.roles.actor },
            { id: 'Composer', label: t.people.roles.composer },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              className={`ink-link ${roleFilter === r.id ? 'ink-link-active' : ''}`}
            >
              {r.label}
            </button>
          ))}

          <span className="text-[#9C948B]/60 font-mono text-[11px] ml-2">{t.sort.label}:</span>
          <button
            type="button"
            onClick={() => setSortByCount(sortByCount === 'desc' ? 'asc' : 'desc')}
            className="ink-link"
          >
            {sortByCount === 'desc' ? t.sort.peopleCountDesc : t.sort.peopleCountAsc}
          </button>
        </div>

        <div className="flex flex-wrap items-baseline gap-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.actions.searchPlaceholder}
            className="ink-input w-48 text-xs"
          />

          {onSyncAllPeople && (
            <button
              type="button"
              disabled={isSyncingPeople}
              onClick={onSyncAllPeople}
              className="ink-link ink-link-active text-xs"
            >
              {isSyncingPeople ? t.actions.syncing : t.actions.syncTmdb}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-14">
        {filteredPeople.map((person) => {
          const pWorks = getPersonWorks(person);
          return (
            <div
              key={person.id}
              onClick={() => onSelectPerson(person.id)}
              className="group cursor-pointer space-y-4"
            >
              <div className="flex items-start gap-4">
                <PersonAvatar person={person} sizeClass="w-14 h-14" />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-base font-editorial font-light text-[#E7E2DD] group-hover:text-[#A88F76] transition-colors duration-300 truncate">
                      {person.name}
                    </h3>
                    <span className="text-[11px] font-mono text-[#A88F76] shrink-0">
                      {t.people.worksCount(pWorks.length)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9C948B]/75 font-mono truncate">
                    {person.originalName} · {person.role}
                  </p>
                  <p className="text-xs font-editorial font-light text-[#9C948B] line-clamp-2 leading-relaxed pt-0.5">
                    {person.biography}
                  </p>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-3 pl-[72px] text-[11px]">
                <div className="flex items-center gap-2 overflow-hidden">
                  {pWorks.slice(0, 4).map((w) => (
                    <span key={w.id} className="text-[#9C948B]/80 truncate">
                      《{w.title}》
                    </span>
                  ))}
                </div>
                <span className="ink-link text-[11px] shrink-0">{t.actions.details} →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
