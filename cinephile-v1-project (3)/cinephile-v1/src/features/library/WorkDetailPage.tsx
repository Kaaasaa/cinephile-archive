import React, { useState } from 'react';
import {
  Collection,
  Person,
  SoundtrackItem,
  StillImage,
  Tag,
  WatchEntry,
  WatchStatus,
  Work,
} from '../../types';
import {
  LetterboxdRatingStars,
  PosterImage,
  STATUS_LABELS,
  TYPE_LABELS,
} from '../../components/PosterCard';
import { createAvatarSvg } from '../../lib/artworkGenerator';
import { useLanguage } from '../../lib/i18n';

interface WorkDetailPageProps {
  work: Work | null;
  allWorks: Work[];
  tags: Tag[];
  collections: Collection[];
  people: Person[];
  watchEntries: WatchEntry[];
  stills: StillImage[];
  soundtracks: SoundtrackItem[];
  onBack: () => void;
  onSelectWork: (workId: string) => void;
  onSelectPerson: (personId: string) => void;
  onToggleFavorite: (workId: string, e: React.MouseEvent) => void;
  onUpdateStatus: (workId: string, status: WatchStatus) => void;
  onOpenQuickRate: (work: Work, e: React.MouseEvent) => void;
  onOpenEditWork: (work: Work) => void;
  onDeleteWork: (workId: string) => void;
  onOpenAddWatchEntry: (workId: string) => void;
  onOpenEditWatchEntry: (entry: WatchEntry) => void;
  onDeleteWatchEntry: (entryId: string) => void;
  onToggleWorkInCollection: (collectionId: string, workId: string) => void;
  onAddStill: (still: StillImage) => void;
  onAddSoundtrack: (track: SoundtrackItem) => void;
}

export const WorkDetailPage: React.FC<WorkDetailPageProps> = ({
  work,
  allWorks,
  tags,
  collections,
  people,
  watchEntries,
  stills,
  soundtracks,
  onBack,
  onSelectWork,
  onSelectPerson,
  onToggleFavorite,
  onUpdateStatus,
  onOpenQuickRate,
  onOpenEditWork,
  onDeleteWork,
  onOpenAddWatchEntry,
  onOpenEditWatchEntry,
  onDeleteWatchEntry,
  onToggleWorkInCollection,
  onAddStill,
  onAddSoundtrack,
}) => {
  const { lang, t } = useLanguage();
  const [lightboxStill, setLightboxStill] = useState<StillImage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [showAddStillForm, setShowAddStillForm] = useState(false);
  const [stillTitle, setStillTitle] = useState('');
  const [stillNote, setStillNote] = useState('');
  const [stillDataUrl, setStillDataUrl] = useState('');
  const [stillUploadError, setStillUploadError] = useState('');

  const [showAddOstForm, setShowAddOstForm] = useState(false);
  const [ostTitle, setOstTitle] = useState('');
  const [ostArtist, setOstArtist] = useState('');
  const [ostAlbum, setOstAlbum] = useState('');
  const [ostAppleUrl, setOstAppleUrl] = useState('');
  const [ostUrl, setOstUrl] = useState('');
  const [ostNote, setOstNote] = useState('');

  if (!work) {
    return (
      <div className="max-w-xl mx-auto py-24 text-center space-y-4">
        <p className="text-sm font-editorial font-light text-[#E7E2DD]">
          {t.workDetail.notFound}
        </p>
        <button type="button" onClick={onBack} className="ink-link ink-link-active text-xs">
          ← {t.actions.back}
        </button>
      </div>
    );
  }

  const workEntries = watchEntries
    .filter((e) => e.workId === work.id)
    .sort((a, b) => b.watchedAt.localeCompare(a.watchedAt));

  const workStills = stills.filter((s) => s.workId === work.id);
  const workOst = soundtracks.filter((s) => s.workId === work.id);

  const defaultAppleMusicUrl = `https://music.apple.com/us/search?term=${encodeURIComponent(
    `${work.originalTitle || work.title} Soundtrack`
  )}`;

  const associatedPeople = people.filter(
    (p) =>
      p.workIds.includes(work.id) ||
      work.director.includes(p.name) ||
      work.cast.includes(p.name)
  );

  const relatedWorks = allWorks
    .filter(
      (candidate) =>
        candidate.id !== work.id &&
        (work.relatedWorkIds?.includes(candidate.id) ||
          candidate.director.some((d) => work.director.includes(d)))
    )
    .slice(0, 6);

  const workTags = tags.filter((tItem) => work.tags.includes(tItem.id));

  const handleStillFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStillUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStillUploadError(lang === 'zh' ? '请选择有效的图片格式。' : 'Please select a valid image format.');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      setStillUploadError(lang === 'zh' ? '图片大小请控制在 2.5MB 以内。' : 'Image size must be under 2.5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setStillDataUrl(String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveNewStill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stillTitle.trim()) return;
    const finalUrl = stillDataUrl || work.backdropUrl;
    onAddStill({
      id: `still-${Date.now()}`,
      workId: work.id,
      imageUrl: finalUrl,
      title: stillTitle.trim(),
      note: stillNote.trim() || '',
      createdAt: new Date().toISOString(),
    });
    setStillTitle('');
    setStillNote('');
    setStillDataUrl('');
    setShowAddStillForm(false);
  };

  const handleSaveNewOst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ostTitle.trim()) return;
    const trimmedUrl = ostUrl.trim();
    const trimmedApple = ostAppleUrl.trim();
    const isValidHttp = (u: string) => !u || u.startsWith('http://') || u.startsWith('https://');
    onAddSoundtrack({
      id: `ost-${Date.now()}`,
      workId: work.id,
      title: ostTitle.trim(),
      artist: ostArtist.trim() || 'Original Score',
      album: ostAlbum.trim() || `${work.title} OST`,
      appleMusicUrl: isValidHttp(trimmedApple) ? trimmedApple : defaultAppleMusicUrl,
      externalUrl: isValidHttp(trimmedUrl) ? trimmedUrl : '',
      note: ostNote.trim() || '',
    });
    setOstTitle('');
    setOstArtist('');
    setOstAlbum('');
    setOstAppleUrl('');
    setOstUrl('');
    setOstNote('');
    setShowAddOstForm(false);
  };

  return (
    <div className="space-y-16 pb-24">
      {/* Top Widescreen Still Area */}
      <section className="relative overflow-hidden">
        <div className="relative h-[360px] sm:h-[460px] lg:h-[520px] w-full flex flex-col justify-between">
          <img
            src={work.backdropUrl}
            alt={work.title}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-95"
          />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#171412] via-[#171412]/65 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-64 bg-gradient-to-r from-[#171412]/55 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 px-6 pt-5 flex items-center justify-between">
            <button type="button" onClick={onBack} className="ink-link text-xs text-[#E7E2DD]">
              ← {t.actions.back}
            </button>
          </div>

          <div className="relative z-10 px-6 pb-6 max-w-lg space-y-1">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-editorial font-light text-[#E7E2DD] tracking-widest">
                {work.title}
              </h1>
              <span className="text-xs font-light text-[#9C948B]">{work.originalTitle}</span>
              <span className="text-[11px] font-light text-[#A88F76]">
                · {t.status[work.watchStatus]}
              </span>
            </div>
            <p className="text-[11px] font-light text-[#9C948B] tracking-wider">
              {work.year} · {work.director.join(' / ')} · {work.runtime} {t.home.min} · {work.genres.join(' / ')}
            </p>
          </div>
        </div>
      </section>

      {/* Below-Still Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column (3 cols) */}
        <div className="lg:col-span-3 space-y-10">
          <div className="w-40 sm:w-48 lg:w-full max-w-[220px]">
            <PosterImage work={work} />
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <span className="text-[#9C948B]/60 font-mono text-[11px]">{t.library.statusFilterLabel}:</span>
              {(['Want to Watch', 'Watching', 'Watched', 'Paused', 'Dropped'] as WatchStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onUpdateStatus(work.id, st)}
                    className={`ink-link ${work.watchStatus === st ? 'ink-link-active' : ''}`}
                  >
                    {t.status[st]}
                  </button>
                )
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 pt-1">
              <button
                type="button"
                onClick={(e) => onOpenQuickRate(work, e)}
                className="ink-link font-mono"
              >
                {work.personalRating !== null
                  ? `${t.actions.rate} ${work.personalRating.toFixed(1)}`
                  : t.actions.rate}
              </button>

              <button
                type="button"
                onClick={(e) => onToggleFavorite(work.id, e)}
                className={`ink-link ${work.favorite ? 'ink-link-active' : ''}`}
              >
                {work.favorite ? t.actions.favored : t.actions.favor}
              </button>

              <button
                type="button"
                onClick={() => onOpenAddWatchEntry(work.id)}
                className="ink-link"
              >
                + {t.actions.addLog}
              </button>

              <button type="button" onClick={() => onOpenEditWork(work)} className="ink-link">
                {t.actions.edit}
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="ink-link"
              >
                {t.actions.remove}
              </button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="space-y-2 text-xs">
              <p className="text-[#A88F76]">{t.workDetail.deleteWorkConfirm(work.title)}</p>
              <div className="flex items-baseline gap-6">
                <button
                  type="button"
                  onClick={() => onDeleteWork(work.id)}
                  className="ink-link ink-link-active"
                >
                  {t.actions.confirm} {t.actions.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="ink-link"
                >
                  {t.actions.cancel}
                </button>
              </div>
            </div>
          )}

          {/* Creators & Cast */}
          <div className="space-y-4">
            <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
              {t.workDetail.credits}
            </h2>
            {associatedPeople.length > 0 ? (
              <div className="space-y-3">
                {associatedPeople.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => onSelectPerson(person.id)}
                    className="w-full flex items-center gap-3 text-left group"
                  >
                    <img
                      src={person.avatarUrl}
                      alt={person.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = createAvatarSvg(
                          person.originalName || person.name,
                          person.role,
                          '#A88F76'
                        );
                      }}
                      className="w-8 h-8 rounded-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-light text-[#E7E2DD] group-hover:text-[#A88F76] transition-colors duration-300 truncate">
                        {person.name}
                      </div>
                      <div className="text-[10px] font-light text-[#9C948B]/65 truncate">
                        {person.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs font-light text-[#9C948B]">
                {work.director.join(' / ')} · {work.cast.join(' / ')}
              </p>
            )}
          </div>

          {/* Collections Membership */}
          <div className="space-y-3 text-xs">
            <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
              {t.workDetail.memberOfFolios}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {collections.map((col) => {
                const inCol = col.workIds.includes(work.id);
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => onToggleWorkInCollection(col.id, work.id)}
                    className={`ink-link ${inCol ? 'ink-link-active' : ''}`}
                  >
                    {inCol ? `· ${col.name}` : `+ ${col.name}`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 9 Columns */}
        <div className="lg:col-span-9 space-y-16">
          <section className="space-y-4 max-w-3xl">
            <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
              {t.workDetail.synopsisAndNote}
            </h2>
            <p className="text-sm font-editorial font-light text-[#E7E2DD]/90 leading-[1.9]">
              {work.synopsis}
            </p>
            {work.curatorNote && (
              <p className="text-sm font-editorial font-light text-[#A88F76] italic leading-[1.85]">
                “{work.curatorNote}”
              </p>
            )}
            {workTags.length > 0 && (
              <div className="flex flex-wrap items-baseline gap-4 pt-1 text-xs text-[#9C948B]">
                {workTags.map((tItem) => (
                  <span key={tItem.id}>#{tItem.name}</span>
                ))}
              </div>
            )}
          </section>

          {/* Stills Gallery */}
          <section className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
                {t.workDetail.stills}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddStillForm(!showAddStillForm)}
                className="ink-link text-xs"
              >
                + {t.actions.addStill}
              </button>
            </div>

            {showAddStillForm && (
              <form onSubmit={handleSaveNewStill} className="space-y-4 max-w-xl text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="text"
                    required
                    value={stillTitle}
                    onChange={(e) => setStillTitle(e.target.value)}
                    placeholder={t.workDetail.stillTitlePlaceholder}
                    className="ink-input text-xs"
                  />
                  <label className="ink-link cursor-pointer">
                    <span>
                      {stillDataUrl ? t.actions.imageSelected : t.actions.uploadImage}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStillFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                {stillUploadError && <p className="text-xs text-[#A88F76]">{stillUploadError}</p>}
                <input
                  type="text"
                  value={stillNote}
                  onChange={(e) => setStillNote(e.target.value)}
                  placeholder={t.workDetail.visualNotePlaceholder}
                  className="ink-input w-full text-xs"
                />
                <div className="flex items-baseline gap-6">
                  <button type="submit" className="ink-link ink-link-active">
                    {t.actions.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddStillForm(false)}
                    className="ink-link"
                  >
                    {t.actions.cancel}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {workStills.length === 0 ? (
                <div
                  onClick={() =>
                    setLightboxStill({
                      id: 'default-backdrop',
                      workId: work.id,
                      imageUrl: work.backdropUrl,
                      title: work.title,
                      note: work.curatorNote || '',
                      createdAt: work.createdAt,
                    })
                  }
                  className="group cursor-pointer overflow-hidden"
                >
                  <img
                    src={work.backdropUrl}
                    alt={work.title}
                    className="archive-poster-img w-full aspect-video object-cover"
                  />
                </div>
              ) : (
                workStills.map((st, idx) => (
                  <div
                    key={st.id}
                    onClick={() => setLightboxStill(st)}
                    className={`group cursor-pointer space-y-2 ${idx % 2 === 1 ? 'sm:mt-5' : ''}`}
                  >
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={st.imageUrl}
                        alt={st.title}
                        className="archive-poster-img w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-baseline justify-between gap-2 text-[11px] font-light text-[#9C948B]">
                      <span className="text-[#E7E2DD]/85">{st.title}</span>
                      <span className="truncate max-w-[60%] text-[#9C948B]/60">{st.note}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Essayistic Screening Logs */}
          <section className="space-y-6 max-w-3xl">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
                {t.workDetail.screeningJournal} ({workEntries.length})
              </h2>
              <button
                type="button"
                onClick={() => onOpenAddWatchEntry(work.id)}
                className="ink-link text-xs"
              >
                + {t.actions.addLog}
              </button>
            </div>

            {workEntries.length === 0 ? (
              <p className="text-xs font-light text-[#9C948B]/60">{t.workDetail.emptyJournal}</p>
            ) : (
              <div className="space-y-10">
                {workEntries.map((entry) => (
                  <article key={entry.id} className="space-y-2">
                    <div className="flex items-baseline gap-4 text-[11px]">
                      <time className="font-mono tracking-[0.15em] text-[#9C948B]">
                        {entry.watchedAt}
                      </time>
                      <span className="text-[#9C948B]/65">{entry.version}</span>
                      {entry.isRewatch && <span className="text-[#A88F76]">· {t.workDetail.rewatch}</span>}
                      {entry.rating !== null && (
                        <LetterboxdRatingStars rating={entry.rating} size="xs" />
                      )}
                    </div>
                    <p className="text-sm font-editorial font-light text-[#E7E2DD]/85 leading-[1.9]">
                      {entry.review}
                      <span className="inline-flex items-baseline gap-3 ml-4 text-[11px] font-ui">
                        <button
                          type="button"
                          onClick={() => onOpenEditWatchEntry(entry)}
                          className="ink-link"
                        >
                          {t.actions.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteWatchEntry(entry.id)}
                          className="ink-link"
                        >
                          {t.actions.delete}
                        </button>
                      </span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Soundtrack & Apple Music */}
          <section className="space-y-5 max-w-3xl">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
                {t.workDetail.originalScore}
              </h2>
              <div className="flex items-baseline gap-6 text-xs">
                <a
                  href={defaultAppleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ink-link ink-link-active"
                >
                  {t.actions.appleMusicSearch} ↗
                </a>
                <button
                  type="button"
                  onClick={() => setShowAddOstForm(!showAddOstForm)}
                  className="ink-link"
                >
                  + {t.actions.addScore}
                </button>
              </div>
            </div>

            {showAddOstForm && (
              <form onSubmit={handleSaveNewOst} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <input
                    type="text"
                    required
                    value={ostTitle}
                    onChange={(e) => setOstTitle(e.target.value)}
                    placeholder={t.workDetail.trackTitlePlaceholder}
                    className="ink-input"
                  />
                  <input
                    type="text"
                    value={ostArtist}
                    onChange={(e) => setOstArtist(e.target.value)}
                    placeholder={t.workDetail.composerPlaceholder}
                    className="ink-input"
                  />
                  <input
                    type="text"
                    value={ostAlbum}
                    onChange={(e) => setOstAlbum(e.target.value)}
                    placeholder={t.workDetail.albumPlaceholder}
                    className="ink-input"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <input
                    type="url"
                    value={ostAppleUrl}
                    onChange={(e) => setOstAppleUrl(e.target.value)}
                    placeholder={t.workDetail.appleMusicPlaceholder}
                    className="ink-input"
                  />
                  <input
                    type="text"
                    value={ostNote}
                    onChange={(e) => setOstNote(e.target.value)}
                    placeholder={t.workDetail.listeningNotePlaceholder}
                    className="ink-input"
                  />
                </div>
                <div className="flex items-baseline gap-6">
                  <button type="submit" className="ink-link ink-link-active">
                    {t.actions.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddOstForm(false)}
                    className="ink-link"
                  >
                    {t.actions.cancel}
                  </button>
                </div>
              </form>
            )}

            {workOst.length > 0 && (
              <div className="space-y-4">
                {workOst.map((track) => {
                  const appleHref =
                    track.appleMusicUrl ||
                    `https://music.apple.com/us/search?term=${encodeURIComponent(
                      `${track.title} ${track.artist}`
                    )}`;
                  return (
                    <div
                      key={track.id}
                      className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div>
                          <span className="text-[#E7E2DD]">{track.title}</span>
                          <span className="text-[#9C948B]"> · {track.artist}</span>
                        </div>
                        {track.note && (
                          <p className="text-[11px] text-[#9C948B]/70">{track.note}</p>
                        )}
                      </div>

                      <div className="flex items-baseline gap-4 shrink-0 text-[11px]">
                        <a
                          href={appleHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ink-link ink-link-active"
                        >
                          Apple Music ↗
                        </a>
                        {track.externalUrl &&
                          (track.externalUrl.startsWith('http://') ||
                            track.externalUrl.startsWith('https://')) && (
                            <a
                              href={track.externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ink-link"
                            >
                              Spotify ↗
                            </a>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Related Works */}
          {relatedWorks.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-xs font-editorial font-light tracking-[0.15em] text-[#9C948B]">
                {t.workDetail.lineage}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-start">
                {relatedWorks.map((rw, idx) => (
                  <div
                    key={rw.id}
                    onClick={() => onSelectWork(rw.id)}
                    className={`group cursor-pointer space-y-2 ${
                      idx % 2 === 1 ? 'sm:mt-4' : ''
                    }`}
                  >
                    <img
                      src={rw.posterUrl}
                      alt={rw.title}
                      className="archive-poster-img w-full aspect-[2/3] object-cover"
                    />
                    <div className="flex items-baseline justify-between text-[11px] font-light text-[#9C948B]">
                      <span className="truncate text-[#E7E2DD]/85">{rw.title}</span>
                      <span className="font-mono text-[10px] text-[#9C948B]/60">{rw.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Fullscreen Still Viewer */}
      {lightboxStill && (
        <div
          onClick={() => setLightboxStill(null)}
          className="fixed inset-0 z-50 bg-[#171412]/95 flex flex-col items-center justify-center p-4 sm:p-10"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-5xl w-full space-y-3">
            <div className="flex items-baseline justify-between text-xs text-[#9C948B]">
              <span>
                {work.title} ({work.year}) — {lightboxStill.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxStill(null)}
                className="ink-link text-xs"
              >
                {t.actions.close}
              </button>
            </div>
            <img
              src={lightboxStill.imageUrl}
              alt={lightboxStill.title}
              className="w-full max-h-[80vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
