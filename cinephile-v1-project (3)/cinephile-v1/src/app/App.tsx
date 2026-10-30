import { Language, translations, LanguageContext } from '../lib/i18n';
import React, { useEffect, useState } from 'react';
import {
  ArchiveDatabaseSchema,
  Collection,
  PrimaryPage,
  SortOption,
  SoundtrackItem,
  StillImage,
  Tag,
  WatchEntry,
  WatchStatus,
  Work,
} from '../types';
import {
  archiveRepository,
  CsvImportCandidate,
  generateWorkArtwork,
} from '../services/archiveRepository';
import { createInitialSeedDatabase } from '../data/seedData';
import {
  batchRefreshTmdbPeopleForArchive,
  batchRefreshTmdbPostersForArchive,
} from '../services/tmdbService';
import { HomePage } from '../features/home/HomePage';
import { LibraryPage } from '../features/library/LibraryPage';
import { WorkDetailPage } from '../features/library/WorkDetailPage';
import { DiscoverPage } from '../features/discovery/DiscoverPage';
import { PeoplePage } from '../features/people/PeoplePage';
import { JournalPage } from '../features/journal/JournalPage';
import {
  DataManagementModal,
  QuickRateModal,
  WatchEntryModal,
  WorkFormModal,
} from '../components/ArchiveModals';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('cinephile_lang');
      if (saved === 'en' || saved === 'zh') return saved;
    }
    return 'zh';
  });

  const t = translations[lang];

  const handleSetLanguage = (newLang: Language) => {
    setLang(newLang);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('cinephile_lang', newLang);
    }
  };

  const [archive, setArchive] = useState<ArchiveDatabaseSchema>(() => createInitialSeedDatabase());
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<PrimaryPage>('home');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const [libStatusPreset, setLibStatusPreset] = useState<WatchStatus | 'ALL'>('ALL');
  const [libFavPreset, setLibFavPreset] = useState<boolean>(false);
  const [libSortPreset, setLibSortPreset] = useState<SortOption>('createdAt-desc');
  const [libPresetKey, setLibPresetKey] = useState<number>(0);

  // Inline document-flow form drawers (zero popup modal boxes)
  const [quickRateWork, setQuickRateWork] = useState<Work | null>(null);
  const [isWorkFormOpen, setIsWorkFormOpen] = useState<boolean>(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [isWatchEntryModalOpen, setIsWatchEntryModalOpen] = useState<boolean>(false);
  const [watchEntryDefaultWorkId, setWatchEntryDefaultWorkId] = useState<string | undefined>(
    undefined
  );
  const [editingWatchEntry, setEditingWatchEntry] = useState<WatchEntry | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const deferredGlobalSearch = React.useDeferredValue(globalSearchQuery);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingTmdb, setIsSyncingTmdb] = useState<boolean>(false);
  const [tmdbSyncProgress, setTmdbSyncProgress] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3400);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const persistAndUpdate = (updater: (prev: ArchiveDatabaseSchema) => ArchiveDatabaseSchema) => {
    setArchive((prev) => {
      const next = updater(prev);
      archiveRepository.saveArchive(next);
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;
    archiveRepository.loadArchive().then((loaded) => {
      if (!mounted) return;
      setArchive(loaded);
      setIsLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSyncAllTmdbPostersAndPeople = async () => {
    if (isSyncingTmdb) return;
    setIsSyncingTmdb(true);
    setTmdbSyncProgress('posters…');
    try {
      const { updatedWorks, refreshedCount } = await batchRefreshTmdbPostersForArchive(
        archive.works,
        undefined,
        (done, total, title) => {
          setTmdbSyncProgress(`${done}/${total} · ${title}`);
        }
      );

      setTmdbSyncProgress('portraits…');
      const { updatedPeople, refreshedCount: peopleCount } =
        await batchRefreshTmdbPeopleForArchive(
          archive.people,
          undefined,
          (done, total, name) => {
            setTmdbSyncProgress(`${done}/${total} · ${name}`);
          }
        );

      persistAndUpdate((prev) => ({
        ...prev,
        works: updatedWorks,
        people: updatedPeople,
      }));
      triggerToast(t.toasts.syncSuccess(refreshedCount, peopleCount));
    } catch (err) {
      triggerToast(t.toasts.syncFailed(err instanceof Error ? err.message : 'Network error'));
    } finally {
      setIsSyncingTmdb(false);
      setTmdbSyncProgress('');
    }
  };

  const navigatePrimary = (page: PrimaryPage) => {
    setSelectedWorkId(null);
    if (page !== 'people') {
      setSelectedPersonId(null);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWork = (workId: string) => {
    setSelectedWorkId(workId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPerson = (personId: string | null) => {
    setSelectedWorkId(null);
    setSelectedPersonId(personId);
    setActivePage('people');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFavorite = (workId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let targetTitle = '';
    let nextFav = false;
    persistAndUpdate((prev) => ({
      ...prev,
      works: prev.works.map((w) => {
        if (w.id === workId) {
          targetTitle = w.title;
          nextFav = !w.favorite;
          return { ...w, favorite: nextFav, updatedAt: new Date().toISOString() };
        }
        return w;
      }),
    }));
    if (targetTitle) {
      triggerToast(nextFav ? t.toasts.favored(targetTitle) : t.toasts.unfavored(targetTitle));
    }
  };

  const handleSaveQuickRate = (
    workId: string,
    rating: number | null,
    status: WatchStatus,
    note: string
  ) => {
    persistAndUpdate((prev) => ({
      ...prev,
      works: prev.works.map((w) =>
        w.id === workId
          ? {
              ...w,
              personalRating: rating,
              watchStatus: status,
              curatorNote: note,
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }));
    triggerToast(t.toasts.scoreUpdated);
  };

  const handleUpdateWorkStatus = (workId: string, status: WatchStatus) => {
    persistAndUpdate((prev) => ({
      ...prev,
      works: prev.works.map((w) =>
        w.id === workId ? { ...w, watchStatus: status, updatedAt: new Date().toISOString() } : w
      ),
    }));
    triggerToast(t.toasts.statusUpdated(t.status[status] || status));
  };

  const handleSaveWork = (workData: Work, isUpdate: boolean) => {
    persistAndUpdate((prev) => {
      const exists = prev.works.some((w) => w.id === workData.id);
      const nextWorks = exists
        ? prev.works.map((w) => (w.id === workData.id ? workData : w))
        : [workData, ...prev.works];
      return {
        ...prev,
        works: nextWorks,
      };
    });
    triggerToast(isUpdate ? t.toasts.workUpdated(workData.title) : t.toasts.workInscribed(workData.title));
  };

  const handleDeleteWork = (workId: string) => {
    const target = archive.works.find((w) => w.id === workId);
    persistAndUpdate((prev) => ({
      ...prev,
      works: prev.works.filter((w) => w.id !== workId),
      watchEntries: prev.watchEntries.filter((e) => e.workId !== workId),
      collections: prev.collections.map((c) => ({
        ...c,
        workIds: c.workIds.filter((id) => id !== workId),
      })),
      people: prev.people.map((p) => ({
        ...p,
        workIds: p.workIds.filter((id) => id !== workId),
      })),
      stills: prev.stills.filter((s) => s.workId !== workId),
      soundtracks: prev.soundtracks.filter((s) => s.workId !== workId),
    }));
    if (selectedWorkId === workId) {
      setSelectedWorkId(null);
    }
    triggerToast(t.toasts.workDeleted(target?.title || (lang === 'zh' ? '作品' : 'work')));
  };

  const handleSaveWatchEntry = (entry: WatchEntry) => {
    persistAndUpdate((prev) => {
      const exists = prev.watchEntries.some((e) => e.id === entry.id);
      const nextEntries = exists
        ? prev.watchEntries.map((e) => (e.id === entry.id ? entry : e))
        : [entry, ...prev.watchEntries];
      const nextWorks = prev.works.map((w) =>
        w.id === entry.workId
          ? {
              ...w,
              watchStatus: 'Watched' as WatchStatus,
              personalRating: entry.rating !== null ? entry.rating : w.personalRating,
              updatedAt: new Date().toISOString(),
            }
          : w
      );
      return {
        ...prev,
        watchEntries: nextEntries,
        works: nextWorks,
      };
    });
    triggerToast(t.toasts.logSaved);
  };

  const handleDeleteWatchEntry = (entryId: string) => {
    persistAndUpdate((prev) => ({
      ...prev,
      watchEntries: prev.watchEntries.filter((e) => e.id !== entryId),
    }));
    triggerToast(t.toasts.logDeleted);
  };

  const handleCreateCollection = (name: string, description: string, initialWorkIds: string[]) => {
    const now = new Date().toISOString();
    const newCol: Collection = {
      id: `col-${Date.now()}`,
      name,
      description: description || '私人主题片单',
      coverWorkId: initialWorkIds[0] || null,
      workIds: initialWorkIds,
      createdAt: now,
      updatedAt: now,
    };
    persistAndUpdate((prev) => ({
      ...prev,
      collections: [newCol, ...prev.collections],
    }));
    triggerToast(t.toasts.collectionCreated(name));
  };

  const handleUpdateCollection = (updated: Collection) => {
    persistAndUpdate((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : c
      ),
    }));
    triggerToast(t.toasts.collectionUpdated(updated.name));
  };

  const handleDeleteCollection = (collectionId: string) => {
    persistAndUpdate((prev) => ({
      ...prev,
      collections: prev.collections.filter((c) => c.id !== collectionId),
    }));
    triggerToast(t.toasts.collectionDeleted);
  };

  const handleToggleWorkInCollection = (collectionId: string, workId: string) => {
    persistAndUpdate((prev) => ({
      ...prev,
      collections: prev.collections.map((c) => {
        if (c.id !== collectionId) return c;
        const exists = c.workIds.includes(workId);
        return {
          ...c,
          workIds: exists ? c.workIds.filter((id) => id !== workId) : [...c.workIds, workId],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
    triggerToast(t.toasts.collectionMembershipUpdated);
  };

  const handleCreateTag = (name: string, color: string) => {
    const newTag: Tag = {
      id: `tag-${Date.now()}`,
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    persistAndUpdate((prev) => ({
      ...prev,
      tags: [...prev.tags, newTag],
    }));
    triggerToast(t.toasts.tagCreated(name));
  };

  const handleUpdateTag = (tagId: string, name: string, color: string) => {
    persistAndUpdate((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === tagId ? { ...t, name, color } : t)),
    }));
    triggerToast(t.toasts.tagUpdated(name));
  };

  const handleDeleteTag = (tagId: string) => {
    persistAndUpdate((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tagId),
      works: prev.works.map((w) => ({
        ...w,
        tags: w.tags.filter((id) => id !== tagId),
      })),
    }));
    triggerToast(t.toasts.tagDeleted);
  };

  const handleAddStill = (still: StillImage) => {
    persistAndUpdate((prev) => ({
      ...prev,
      stills: [still, ...prev.stills],
    }));
    triggerToast(t.toasts.stillSaved(still.title || (lang === 'zh' ? '剧照' : 'still')));
  };

  const handleAddSoundtrack = (track: SoundtrackItem) => {
    persistAndUpdate((prev) => ({
      ...prev,
      soundtracks: [track, ...prev.soundtracks],
    }));
    triggerToast(t.toasts.soundtrackSaved(track.title));
  };

  const handleImportCsvRows = (rows: CsvImportCandidate[], skipDuplicates: boolean) => {
    let importedCount = 0;
    let updatedCount = 0;

    persistAndUpdate((prev) => {
      const nextWorks = [...prev.works];
      const nextTags = [...prev.tags];
      const nextEntries = [...prev.watchEntries];
      const now = new Date().toISOString();

      rows.forEach((row, idx) => {
        if (row.error || !row.title) return;

        const resolvedTagIds: string[] = [];
        row.tags.forEach((tName) => {
          let existingTag = nextTags.find((t) => t.name.toLowerCase() === tName.toLowerCase());
          if (!existingTag) {
            existingTag = {
              id: `tag-csv-${Date.now()}-${idx}-${resolvedTagIds.length}`,
              name: tName,
              color: '#A88F76',
              createdAt: now,
            };
            nextTags.push(existingTag);
          }
          resolvedTagIds.push(existingTag.id);
        });

        if (row.isDuplicate && row.existingWorkId) {
          if (skipDuplicates) return;
          const targetIdx = nextWorks.findIndex((w) => w.id === row.existingWorkId);
          if (targetIdx >= 0) {
            nextWorks[targetIdx] = {
              ...nextWorks[targetIdx],
              watchStatus: row.watchStatus,
              personalRating:
                row.personalRating !== null ? row.personalRating : nextWorks[targetIdx].personalRating,
              tags: Array.from(new Set([...nextWorks[targetIdx].tags, ...resolvedTagIds])),
              curatorNote: row.review || nextWorks[targetIdx].curatorNote,
              updatedAt: now,
            };
            updatedCount++;
          }
          return;
        }

        const art = generateWorkArtwork(
          row.title,
          row.originalTitle,
          row.year,
          row.director,
          nextWorks.length + idx + 1
        );
        const newWorkId = `work-csv-${Date.now()}-${idx}`;
        nextWorks.unshift({
          id: newWorkId,
          title: row.title,
          originalTitle: row.originalTitle || row.title,
          year: row.year,
          type: row.type,
          genres: row.genres,
          director: row.director,
          cast: ['演员'],
          synopsis: row.review || `${row.year} 年收录的 ${row.type} 作品。`,
          posterUrl: art.posterUrl,
          backdropUrl: art.backdropUrl,
          runtime: 120,
          personalRating: row.personalRating,
          watchStatus: row.watchStatus,
          tags: resolvedTagIds,
          favorite: (row.personalRating ?? 0) >= 9.5,
          curatorNote: row.review,
          createdAt: now,
          updatedAt: now,
        });
        importedCount++;

        if (row.review) {
          nextEntries.unshift({
            id: `entry-csv-${Date.now()}-${idx}`,
            workId: newWorkId,
            watchedAt: now.slice(0, 10),
            rating: row.personalRating,
            review: row.review,
            isRewatch: false,
            version: 'CSV Archive',
            createdAt: now,
          });
        }
      });

      return {
        ...prev,
        works: nextWorks,
        tags: nextTags,
        watchEntries: nextEntries,
      };
    });

    triggerToast(t.toasts.importSuccess(importedCount, updatedCount));
  };

  const handleRestoreBackup = (backup: ArchiveDatabaseSchema, mode: 'overwrite' | 'merge') => {
    if (mode === 'overwrite') {
      persistAndUpdate(() => backup);
      triggerToast(t.toasts.restoreSuccess(backup.works.length));
      return;
    }

    persistAndUpdate((prev) => {
      const mergeById = <T extends { id: string }>(existing: T[], incoming: T[]): T[] => {
        const map = new Map(existing.map((item) => [item.id, item]));
        incoming.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      };
      return {
        version: backup.version || prev.version,
        exportedAt: new Date().toISOString(),
        works: mergeById(prev.works, backup.works),
        watchEntries: mergeById(prev.watchEntries, backup.watchEntries),
        collections: mergeById(prev.collections, backup.collections),
        tags: mergeById(prev.tags, backup.tags),
        people: mergeById(prev.people, backup.people),
        stills: mergeById(prev.stills, backup.stills),
        soundtracks: mergeById(prev.soundtracks, backup.soundtracks),
        dismissedRecommendationIds: Array.from(
          new Set([...prev.dismissedRecommendationIds, ...backup.dismissedRecommendationIds])
        ),
      };
    });
    triggerToast(lang === 'zh' ? '已合并备份数据' : 'Backup merged');
  };

  const handleResetDemoData = async () => {
    const seed = await archiveRepository.resetToDemoSeed();
    setArchive(seed);
    setSelectedWorkId(null);
    triggerToast(t.toasts.resetSuccess);
  };

  const handleClearAllData = async () => {
    const empty = await archiveRepository.clearAllData();
    setArchive(empty);
    setSelectedWorkId(null);
    triggerToast(t.toasts.clearSuccess);
  };

  const activeWork = selectedWorkId
    ? archive.works.find((w) => w.id === selectedWorkId) || null
    : null;

  const quickSearchResults = deferredGlobalSearch.trim()
    ? archive.works
        .filter((w) => {
          const q = deferredGlobalSearch.toLowerCase();
          return (
            w.title.toLowerCase().includes(q) ||
            w.originalTitle.toLowerCase().includes(q) ||
            w.director.some((d) => d.toLowerCase().includes(q)) ||
            w.cast.some((c) => c.toLowerCase().includes(q))
          );
        })
        .slice(0, 6)
    : [];

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLanguage, t }}>
      <div className="min-h-screen bg-[#171412] text-[#E7E2DD] flex flex-col">
      <style>{`
:root {
  color-scheme: dark;
  --bg-primary: #171412;
  --bg-secondary: #211D1A;
  --text-primary: #E7E2DD;
  --text-secondary: #9C948B;
  --text-camel: #A88F76;
  --ease-power2-out: cubic-bezier(0.22, 0.61, 0.36, 1);
}

body {
  background-color: #171412;
  /* Ultra-subtle organic linen weave texture overlay */
  background-image:
    radial-gradient(rgba(231, 226, 221, 0.018) 1px, transparent 0),
    radial-gradient(rgba(168, 143, 118, 0.012) 1px, transparent 0);
  background-size: 24px 24px;
  background-position: 0 0, 12px 12px;
  color: #E7E2DD;
  font-family: "Charter", "Iowan Old Style", "Palatino Linotype", "Georgia", "Noto Serif SC", "Source Han Serif SC", "Songti SC", serif;
  font-weight: 300;
  line-height: 1.75;
  letter-spacing: 0.025em;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

.font-editorial {
  font-family: "Charter", "Iowan Old Style", "Palatino Linotype", "Georgia", "Noto Serif SC", "Songti SC", serif;
  font-weight: 300;
  letter-spacing: 0.06em;
}

.font-ui {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", sans-serif;
  font-weight: 350;
  letter-spacing: 0.03em;
}

/* GSAP power2.out style ink-spread transitions (0.55s–0.65s, zero scale or bounce) */
.ink-link {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  color: #9C948B;
  font-weight: 350;
  background: transparent !important;
  border: none !important;
  padding: 0;
  transition: color 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.ink-link::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 100%;
  height: 1px;
  background-color: #A88F76;
  opacity: 0;
  transform: scaleX(0.35);
  transform-origin: left center;
  transition:
    opacity 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
    transform 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.ink-link:hover,
.ink-link-active {
  color: #A88F76;
  font-weight: 420;
}

.ink-link:hover::after,
.ink-link-active::after {
  opacity: 0.85;
  transform: scaleX(1);
}

/* Frameless inline text input: no box, no background, short bottom line only when focused */
.ink-input {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid transparent !important;
  outline: none !important;
  box-shadow: none !important;
  color: #E7E2DD;
  font-weight: 350;
  padding: 2px 0;
  transition:
    border-color 0.6s cubic-bezier(0.22, 0.61, 0.36, 1),
    color 0.6s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.ink-input::placeholder {
  color: #9C948B;
  opacity: 0.6;
}

.ink-input:focus {
  border-bottom-color: #A88F76 !important;
}

/* Poster soft brightness transition (no scale, no lift, no border glow) */
.archive-poster-img {
  filter: brightness(0.88) contrast(0.98);
  transition: filter 0.65s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.65s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.group:hover .archive-poster-img {
  filter: brightness(1.03) contrast(1.01);
}

::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(156, 148, 139, 0.2);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(168, 143, 118, 0.4);
}

@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`}</style>
      {/* 1. Boxless Running-Header Navigation & Borderless Inline Search */}
      <header className="max-w-[1360px] w-full mx-auto px-6 sm:px-12 pt-8 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-6">
          {/* Left: Brand Title & Pure Text Tab Navigation */}
          <div className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
            <button
              type="button"
              onClick={() => navigatePrimary('home')}
              className="font-editorial text-lg font-light tracking-[0.22em] text-[#E7E2DD] hover:text-[#A88F76] transition-colors duration-600"
            >
              CINEPHILE
            </button>

            <nav aria-label="主导航" className="flex flex-wrap items-baseline gap-7 text-xs">
              {[
                { id: 'home', label: t.nav.home },
                { id: 'library', label: t.nav.library },
                { id: 'discover', label: t.nav.discover },
                { id: 'people', label: t.nav.people },
                { id: 'journal', label: t.nav.journal },
              ].map((item) => {
                const isActive = activePage === item.id && !selectedWorkId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigatePrimary(item.id as PrimaryPage)}
                    className={`ink-link ${isActive ? 'ink-link-active' : ''}`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Borderless Inline Search & Flowing Text Links (Zero button boxes) */}
          <div className="flex flex-wrap items-baseline gap-6 text-xs">
            {/* Borderless inline search input */}
            <div className="inline-flex items-baseline gap-2">
              <input
                type="text"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                placeholder={t.actions.searchPlaceholder}
                className="ink-input w-36 sm:w-44 text-xs"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchQuery('')}
                  className="ink-link text-[11px]"
                >
                  clear
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={isSyncingTmdb}
              onClick={handleSyncAllTmdbPostersAndPeople}
              className="ink-link text-xs"
            >
              {isSyncingTmdb ? tmdbSyncProgress || t.actions.syncing : t.actions.syncTmdb}
            </button>

            <button
              type="button"
              onClick={() => setIsDataModalOpen(!isDataModalOpen)}
              className={`ink-link text-xs ${isDataModalOpen ? 'ink-link-active' : ''}`}
            >
              {t.actions.folioData}
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingWork(null);
                setIsWorkFormOpen(!isWorkFormOpen);
              }}
              className={`ink-link ink-link-active text-xs`}
            >
              + {t.actions.inscribe}
            </button>

            {/* Language Switch: Pure inline text link, no box, no background, hover fine underline */}
            <div className="flex items-baseline gap-1.5 text-xs text-[#9C948B]">
              <button
                type="button"
                onClick={() => handleSetLanguage('zh')}
                className={`ink-link ${lang === 'zh' ? 'ink-link-active' : ''}`}
              >
                中文
              </button>
              <span className="text-[#9C948B]/35 select-none">/</span>
              <button
                type="button"
                onClick={() => handleSetLanguage('en')}
                className={`ink-link ${lang === 'en' ? 'ink-link-active' : ''}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Inline Search Results Stream (Flows naturally below header when typing) */}
        {globalSearchQuery.trim() && (
          <div className="pt-6 pb-2 space-y-2.5 text-xs">
            {quickSearchResults.length === 0 ? (
              <div className="flex items-baseline gap-6 text-[#9C948B]">
                <span>{lang === 'zh' ? `未检索到「${globalSearchQuery}」` : `No records found for "${globalSearchQuery}"`}</span>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearchQuery('');
                    setEditingWork(null);
                    setIsWorkFormOpen(true);
                  }}
                  className="ink-link ink-link-active"
                >
                  + {lang === 'zh' ? '立即收录该作品 →' : 'Inscribe work now →'}
                </button>
              </div>
            ) : (
              quickSearchResults.map((w) => (
                <div key={w.id} className="flex items-baseline justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectWork(w.id);
                      setGlobalSearchQuery('');
                    }}
                    className="ink-link text-left text-[#E7E2DD]"
                  >
                    <span>{w.title}</span>
                    <span className="text-[#9C948B] ml-2">
                      ({w.originalTitle}, {w.year}) · {w.director.join('/')}
                    </span>
                  </button>
                  <span className="font-mono text-[#A88F76]">
                    {w.personalRating !== null ? w.personalRating.toFixed(1) : w.watchStatus}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </header>

      {/* Inline Document-Flow Forms (Expand naturally downward without modal boxes) */}
      <QuickRateModal
        work={quickRateWork}
        onClose={() => setQuickRateWork(null)}
        onSave={handleSaveQuickRate}
      />

      <WorkFormModal
        isOpen={isWorkFormOpen}
        editingWork={editingWork}
        existingWorks={archive.works}
        tags={archive.tags}
        onClose={() => {
          setIsWorkFormOpen(false);
          setEditingWork(null);
        }}
        onSaveWork={handleSaveWork}
      />

      <WatchEntryModal
        isOpen={isWatchEntryModalOpen}
        works={archive.works}
        defaultWorkId={watchEntryDefaultWorkId}
        editingEntry={editingWatchEntry}
        onClose={() => {
          setIsWatchEntryModalOpen(false);
          setEditingWatchEntry(null);
        }}
        onSaveEntry={handleSaveWatchEntry}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        archive={archive}
        isSyncingTmdb={isSyncingTmdb}
        tmdbSyncProgress={tmdbSyncProgress}
        onSyncAllTmdbPosters={handleSyncAllTmdbPostersAndPeople}
        onClose={() => setIsDataModalOpen(false)}
        onImportCsvRows={handleImportCsvRows}
        onRestoreBackup={handleRestoreBackup}
        onResetDemoData={handleResetDemoData}
        onClearAllData={handleClearAllData}
      />

      {/* Main Folio Content Stream */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 sm:px-12 pt-6 pb-24">
        {!isLoaded ? (
          <div className="py-24 text-xs text-[#9C948B] font-mono">{lang === 'zh' ? '正在打开馆藏…' : 'opening archive…'}</div>
        ) : selectedWorkId !== null ? (
          <WorkDetailPage
            work={activeWork}
            allWorks={archive.works}
            tags={archive.tags}
            collections={archive.collections}
            people={archive.people}
            watchEntries={archive.watchEntries}
            stills={archive.stills}
            soundtracks={archive.soundtracks}
            onBack={() => setSelectedWorkId(null)}
            onSelectWork={handleSelectWork}
            onSelectPerson={(pid) => handleSelectPerson(pid)}
            onToggleFavorite={handleToggleFavorite}
            onUpdateStatus={handleUpdateWorkStatus}
            onOpenQuickRate={(w) => {
              setQuickRateWork(w);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEditWork={(w) => {
              setEditingWork(w);
              setIsWorkFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteWork={handleDeleteWork}
            onOpenAddWatchEntry={(wId) => {
              setEditingWatchEntry(null);
              setWatchEntryDefaultWorkId(wId);
              setIsWatchEntryModalOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEditWatchEntry={(entry) => {
              setEditingWatchEntry(entry);
              setIsWatchEntryModalOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteWatchEntry={handleDeleteWatchEntry}
            onToggleWorkInCollection={handleToggleWorkInCollection}
            onAddStill={handleAddStill}
            onAddSoundtrack={handleAddSoundtrack}
          />
        ) : activePage === 'home' ? (
          <HomePage
            works={archive.works}
            tags={archive.tags}
            dismissedRecIds={archive.dismissedRecommendationIds}
            isSyncingTmdb={isSyncingTmdb}
            tmdbSyncProgress={tmdbSyncProgress}
            onSyncAllTmdbPosters={handleSyncAllTmdbPostersAndPeople}
            onSelectWork={handleSelectWork}
            onToggleFavorite={handleToggleFavorite}
            onQuickRate={(w) => {
              setQuickRateWork(w);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToLibraryFilter={(preset) => {
              setLibStatusPreset(preset.status || 'ALL');
              setLibFavPreset(Boolean(preset.favoriteOnly));
              setLibSortPreset(preset.sort || 'createdAt-desc');
              setLibPresetKey((k) => k + 1);
              setActivePage('library');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToDiscover={() => navigatePrimary('discover')}
            onOpenQuickAdd={() => {
              setEditingWork(null);
              setIsWorkFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onRestoreDemoSeed={handleResetDemoData}
          />
        ) : activePage === 'library' ? (
          <LibraryPage
            key={libPresetKey}
            works={archive.works}
            tags={archive.tags}
            collections={archive.collections}
            initialStatusFilter={libStatusPreset}
            initialFavoriteOnly={libFavPreset}
            initialSort={libSortPreset}
            isSyncingTmdb={isSyncingTmdb}
            onSyncAllTmdbPosters={handleSyncAllTmdbPostersAndPeople}
            onSelectWork={handleSelectWork}
            onToggleFavorite={handleToggleFavorite}
            onQuickRate={(w) => {
              setQuickRateWork(w);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAddWork={() => {
              setEditingWork(null);
              setIsWorkFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEditWork={(w) => {
              setEditingWork(w);
              setIsWorkFormOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteWork={handleDeleteWork}
            onCreateCollection={handleCreateCollection}
            onUpdateCollection={handleUpdateCollection}
            onDeleteCollection={handleDeleteCollection}
            onToggleWorkInCollection={handleToggleWorkInCollection}
            onCreateTag={handleCreateTag}
            onUpdateTag={handleUpdateTag}
            onDeleteTag={handleDeleteTag}
          />
        ) : activePage === 'discover' ? (
          <DiscoverPage
            works={archive.works}
            tags={archive.tags}
            dismissedIds={archive.dismissedRecommendationIds}
            onSelectWork={handleSelectWork}
            onToggleFavorite={handleToggleFavorite}
            onDismissRecommendation={(wId) => {
              persistAndUpdate((prev) => ({
                ...prev,
                dismissedRecommendationIds: [...prev.dismissedRecommendationIds, wId],
              }));
              triggerToast(t.toasts.dismissed);
            }}
            onResetDismissed={() => {
              persistAndUpdate((prev) => ({
                ...prev,
                dismissedRecommendationIds: [],
              }));
              triggerToast(t.toasts.restoredRecs);
            }}
          />
        ) : activePage === 'people' ? (
          <PeoplePage
            people={archive.people}
            works={archive.works}
            selectedPersonId={selectedPersonId}
            isSyncingPeople={isSyncingTmdb}
            onSyncAllPeople={handleSyncAllTmdbPostersAndPeople}
            onSelectPerson={setSelectedPersonId}
            onSelectWork={handleSelectWork}
            onToggleFavorite={handleToggleFavorite}
            onQuickRate={(w) => {
              setQuickRateWork(w);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : (
          <JournalPage
            watchEntries={archive.watchEntries}
            works={archive.works}
            onSelectWork={handleSelectWork}
            onOpenAddEntry={() => {
              setEditingWatchEntry(null);
              setWatchEntryDefaultWorkId(archive.works[0]?.id);
              setIsWatchEntryModalOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenEditEntry={(entry) => {
              setEditingWatchEntry(entry);
              setIsWatchEntryModalOpen(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDeleteEntry={handleDeleteWatchEntry}
          />
        )}
      </main>

      {/* Quiet Marginalia Toast (Pure text whisper in bottom right, no loud box) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-8 z-50 text-xs font-editorial italic text-[#A88F76] tracking-wide transition-opacity duration-600">
          — {toastMessage}
        </div>
      )}
      </div>
    </LanguageContext.Provider>
  );
};

export default App;
