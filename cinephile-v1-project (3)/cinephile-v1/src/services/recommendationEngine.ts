import { Tag, Work } from '../types';

export interface RecommendationItem {
  work: Work;
  score: number;
  reasonCategory:
    | 'high-rated-affinity'
    | 'director-match'
    | 'actor-match'
    | 'genre-match'
    | 'tag-match'
    | 'exploratory';
  reasonLabel: string;
  reasonDetail: string;
}

export interface RecommendationSections {
  topPicksForYou: RecommendationItem[];
  byAuteurAndCast: RecommendationItem[];
  byGenreAndTag: RecommendationItem[];
  exploratoryHorizon: RecommendationItem[];
}

/**
 * Local deterministic recommendation engine grounded strictly in the user's actual
 * archive data (ratings >= 9.0, favorite works, directors, actors, genres, and custom tags).
 */
export function buildRecommendations(
  works: Work[],
  tags: Tag[],
  dismissedIds: string[]
): RecommendationSections {
  const dismissedSet = new Set(dismissedIds);
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));

  // Find high-affinity anchor works (watched or rated >= 9.2 or favorited)
  const highRatedAnchors = works
    .filter((w) => (w.personalRating !== null && w.personalRating >= 9.2) || w.favorite)
    .sort((a, b) => (b.personalRating ?? 0) - (a.personalRating ?? 0));

  const preferredDirectors = new Map<string, Work>();
  const preferredActors = new Map<string, Work>();
  const preferredGenres = new Map<string, number>();
  const preferredTags = new Map<string, Work>();

  highRatedAnchors.forEach((anchor) => {
    anchor.director.forEach((d) => {
      if (!preferredDirectors.has(d)) preferredDirectors.set(d, anchor);
    });
    anchor.cast.forEach((c) => {
      if (!preferredActors.has(c)) preferredActors.set(c, anchor);
    });
    anchor.genres.forEach((g) => {
      preferredGenres.set(g, (preferredGenres.get(g) ?? 0) + 1);
    });
    anchor.tags.forEach((tId) => {
      if (!preferredTags.has(tId)) preferredTags.set(tId, anchor);
    });
  });

  // Candidate pool: prioritize works not yet marked 'Watched' first, then unwatched/paused/high-value rewatches
  const candidates = works.filter((w) => !dismissedSet.has(w.id));

  const scoredPool: RecommendationItem[] = candidates.map((candidate) => {
    let score = 0;
    const isUnwatched = candidate.watchStatus !== 'Watched';
    if (isUnwatched) {
      score += 35; // Priority boost for works not yet marked Watched
    }

    // 1. Check direct relation to a high-rated work
    const relatedAnchor = highRatedAnchors.find(
      (anchor) =>
        anchor.id !== candidate.id &&
        (anchor.relatedWorkIds?.includes(candidate.id) || candidate.relatedWorkIds?.includes(anchor.id))
    );

    // 2. Check director overlap
    let matchedDirector: { name: string; anchor: Work } | null = null;
    for (const d of candidate.director) {
      const anchor = preferredDirectors.get(d);
      if (anchor && anchor.id !== candidate.id) {
        matchedDirector = { name: d, anchor };
        score += 24;
        break;
      }
    }

    // 3. Check actor overlap
    let matchedActor: { name: string; anchor: Work } | null = null;
    for (const c of candidate.cast) {
      const anchor = preferredActors.get(c);
      if (anchor && anchor.id !== candidate.id) {
        matchedActor = { name: c, anchor };
        score += 18;
        break;
      }
    }

    // 4. Check tag overlap
    let matchedTag: { tagName: string; anchor: Work } | null = null;
    for (const tId of candidate.tags) {
      const anchor = preferredTags.get(tId);
      const tName = tagMap.get(tId);
      if (anchor && anchor.id !== candidate.id && tName) {
        matchedTag = { tagName: tName, anchor };
        score += 15;
        break;
      }
    }

    // 5. Check genre overlap
    const sharedGenres = candidate.genres.filter((g) => (preferredGenres.get(g) ?? 0) > 0);
    score += sharedGenres.length * 8;

    if (relatedAnchor) {
      score += 22;
    }

    if (candidate.personalRating) {
      score += candidate.personalRating;
    }

    // Determine primary grounded reason
    if (relatedAnchor && isUnwatched) {
      return {
        work: candidate,
        score,
        reasonCategory: 'high-rated-affinity',
        reasonLabel: `高分收藏《${relatedAnchor.title}》关联推荐`,
        reasonDetail: `与你打出 ${relatedAnchor.personalRating ?? '高'} 分的《${relatedAnchor.title}》共享核心母题与视听气质（状态：${candidate.watchStatus}）`,
      };
    }

    if (matchedDirector) {
      return {
        work: candidate,
        score,
        reasonCategory: 'director-match',
        reasonLabel: `同导演作品 · ${matchedDirector.name}`,
        reasonDetail: `由你喜爱的《${matchedDirector.anchor.title}》导演 ${matchedDirector.name} 执导（${candidate.year} · ${candidate.genres.join('/')}）`,
      };
    }

    if (matchedActor) {
      return {
        work: candidate,
        score,
        reasonCategory: 'actor-match',
        reasonLabel: `同演员作品 · ${matchedActor.name}`,
        reasonDetail: `《${matchedActor.anchor.title}》主演 ${matchedActor.name} 参演的代表作（${candidate.year}）`,
      };
    }

    if (matchedTag) {
      return {
        work: candidate,
        score,
        reasonCategory: 'tag-match',
        reasonLabel: `同标签共鸣 · #${matchedTag.tagName}`,
        reasonDetail: `与《${matchedTag.anchor.title}》同样带有「${matchedTag.tagName}」审美印记`,
      };
    }

    if (sharedGenres.length > 0 && highRatedAnchors.length > 0) {
      return {
        work: candidate,
        score,
        reasonCategory: 'genre-match',
        reasonLabel: `同类型偏好 · ${sharedGenres.slice(0, 2).join(' / ')}`,
        reasonDetail: `契合你在「${sharedGenres.slice(0, 2).join('、')}」领域的长期高分收藏偏好`,
      };
    }

    return {
      work: candidate,
      score,
      reasonCategory: 'exploratory',
      reasonLabel: `跨类型视野探索 · ${candidate.type}`,
      reasonDetail: `${candidate.year} 年 ${candidate.director.join('/')} 执导的 ${candidate.genres.join('/')} 代表作，拓展馆藏维度`,
    };
  });

  // Sort by score descending, ensuring unwatched items surface first
  const sorted = [...scoredPool].sort((a, b) => b.score - a.score);

  const usedInSection = new Set<string>();
  const pickUnique = (filterFn: (item: RecommendationItem) => boolean, limit: number): RecommendationItem[] => {
    const out: RecommendationItem[] = [];
    for (const item of sorted) {
      if (out.length >= limit) break;
      if (!usedInSection.has(item.work.id) && filterFn(item)) {
        out.push(item);
        usedInSection.add(item.work.id);
      }
    }
    return out;
  };

  // Priority 1: Unwatched & High-Affinity
  const topPicksForYou = pickUnique(
    (item) => item.work.watchStatus !== 'Watched' || item.reasonCategory === 'high-rated-affinity',
    4
  );

  // Priority 2: Same Director / Same Actor
  const byAuteurAndCast = pickUnique(
    (item) => item.reasonCategory === 'director-match' || item.reasonCategory === 'actor-match',
    4
  );

  // Priority 3: Same Tag / Genre
  const byGenreAndTag = pickUnique(
    (item) => item.reasonCategory === 'tag-match' || item.reasonCategory === 'genre-match',
    4
  );

  // Priority 4: Exploratory / Diverse Types (Documentaries, Anime, Paused/Want to Watch)
  const exploratoryHorizon = pickUnique(() => true, 4);

  return {
    topPicksForYou,
    byAuteurAndCast,
    byGenreAndTag,
    exploratoryHorizon,
  };
}

export interface LocalAdvisorResponse {
  promptId: string;
  promptTitle: string;
  explanation: string;
  items: RecommendationItem[];
}

export function runLocalAdvisorRule(
  promptId: 'high-rated' | 'cross-genre' | 'auteur-focus' | 'late-night',
  works: Work[],
  tags: Tag[],
  dismissedIds: string[]
): LocalAdvisorResponse {
  const dismissedSet = new Set(dismissedIds);
  const available = works.filter((w) => !dismissedSet.has(w.id));
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));

  if (promptId === 'high-rated') {
    const unwatchedFirst = [...available].sort((a, b) => {
      const aUnwatched = a.watchStatus !== 'Watched' ? 1 : 0;
      const bUnwatched = b.watchStatus !== 'Watched' ? 1 : 0;
      if (aUnwatched !== bUnwatched) return bUnwatched - aUnwatched;
      return (b.personalRating ?? 8.8) - (a.personalRating ?? 8.8);
    });
    return {
      promptId,
      promptTitle: '根据我的高分收藏推荐优先观看的作品',
      explanation:
        '【本地规则引擎说明】已检索你评分 ≥ 9.3 的核心馆藏（如《一一》《花样年华》《银翼杀手 2049》），优先筛选尚未标记为 Watched 的待看与在看作品，以及关联度最高的馆藏杰作：',
      items: unwatchedFirst.slice(0, 4).map((w) => ({
        work: w,
        score: 95,
        reasonCategory: 'high-rated-affinity',
        reasonLabel: w.watchStatus === 'Watched' ? '高分重温候选' : `优先待看 · ${w.watchStatus}`,
        reasonDetail: `${w.director.join('/')} 执导（${w.year}），类型涵盖 ${w.genres.join(' / ')}`,
      })),
    };
  }

  if (promptId === 'cross-genre') {
    const seenTypes = new Set<string>();
    const diverse: Work[] = [];
    for (const w of available) {
      if (!seenTypes.has(w.type)) {
        seenTypes.add(w.type);
        diverse.push(w);
      }
    }
    for (const w of available) {
      if (diverse.length >= 4) break;
      if (!diverse.some((d) => d.id === w.id)) diverse.push(w);
    }
    return {
      promptId,
      promptTitle: '推荐跨越不同媒介与类型的探索片单',
      explanation:
        '【本地规则引擎说明】已从电影（Movie）、剧集（TV Series）、动画（Anime）与纪录片（Documentary）四个媒介维度各选取一部代表作，打破单一类型审美疲劳：',
      items: diverse.slice(0, 4).map((w) => ({
        work: w,
        score: 90,
        reasonCategory: 'exploratory',
        reasonLabel: `跨媒介探索 · ${w.type}`,
        reasonDetail: `${w.year} 年 ${w.genres.join('/')} 作品，导演：${w.director.join(' / ')}`,
      })),
    };
  }

  if (promptId === 'auteur-focus') {
    const auteurWorks = available.filter((w) =>
      ['王家卫', '丹尼斯·维伦纽瓦', '奉俊昊', '杨德昌', '安德烈·塔可夫斯基', '押井守'].some((d) =>
        w.director.includes(d)
      )
    );
    return {
      promptId,
      promptTitle: '根据我偏爱的作者导演梳理脉络作品',
      explanation:
        '【本地规则引擎说明】基于你馆藏中出现频次与平均分最高的作者导演（王家卫、维伦纽瓦、奉俊昊、塔可夫斯基等），按作者谱系匹配出的代表作：',
      items: auteurWorks.slice(0, 4).map((w) => ({
        work: w,
        score: 92,
        reasonCategory: 'director-match',
        reasonLabel: `作者谱系 · ${w.director.join(' / ')}`,
        reasonDetail: `${w.originalTitle} (${w.year}) · ${w.genres.join(' / ')}`,
      })),
    };
  }

  // late-night
  const lateNightWorks = available.filter(
    (w) => w.tags.includes('tag-latenight') || w.tags.includes('tag-soundtrack')
  );
  return {
    promptId,
    promptTitle: '适合深夜独处与沉浸配乐的私人片单',
    explanation:
      '【本地规则引擎说明】通过匹配自定义标签「#深夜独处必看」与「#殿堂级配乐」，筛选出视听氛围深邃、适合夜晚静心观赏的作品：',
    items: lateNightWorks.slice(0, 4).map((w) => ({
      work: w,
      score: 91,
      reasonCategory: 'tag-match',
      reasonLabel: `标签匹配 · ${w.tags
        .map((id) => tagMap.get(id))
        .filter(Boolean)
        .slice(0, 2)
        .join(' / ')}`,
      reasonDetail: `${w.director.join('/')} 执导（${w.runtime} 分钟），${w.curatorNote || w.synopsis.slice(0, 36)}`,
    })),
  };
}
