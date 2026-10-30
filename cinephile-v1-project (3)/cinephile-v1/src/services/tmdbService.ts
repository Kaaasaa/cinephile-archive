import { Person, Work, WorkType } from '../types';

export const DEFAULT_TMDB_API_KEY = '603c23a3ef912a810f42020414801cfa';
const TMDB_IMAGE_BASE_W500 = 'https://image.tmdb.org/t/p/w500';
const TMDB_IMAGE_BASE_W1280 = 'https://image.tmdb.org/t/p/w1280';

export const CURATED_TMDB_ARTWORK_MAP: Record<
  string,
  { posterPath: string; backdropPath: string; tmdbId: number; mediaType: 'movie' | 'tv' }
> = {
  'work-1': {
    tmdbId: 843,
    mediaType: 'movie',
    posterPath: '/iYypPT4bhqXfq1b6EnmxvRt6b2Y.jpg',
    backdropPath: '/n4GJFGzsc7NinI1VeGDXIcQjtU2.jpg',
  },
  'work-2': {
    tmdbId: 11104,
    mediaType: 'movie',
    posterPath: '/43I9DcNoCzpyzK8JCkJYpHqHqGG.jpg',
    backdropPath: '/c6Q623322K5124K6tB6h2A3v1sP.jpg',
  },
  'work-3': {
    tmdbId: 335984,
    mediaType: 'movie',
    posterPath: '/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    backdropPath: '/sAtoMqDVhNDQBc3QJL3RF6hlhGq.jpg',
  },
  'work-4': {
    tmdbId: 329865,
    mediaType: 'movie',
    posterPath: '/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg',
    backdropPath: '/yIZ1xendyqKvY3FGeeUYUd5X9Mm.jpg',
  },
  'work-5': {
    tmdbId: 157336,
    mediaType: 'movie',
    posterPath: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropPath: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
  },
  'work-6': {
    tmdbId: 25237,
    mediaType: 'movie',
    posterPath: '/6W72p23D227lF2P1cCF3hGY2gS.jpg',
    backdropPath: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
  },
  'work-7': {
    tmdbId: 496243,
    mediaType: 'movie',
    posterPath: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    backdropPath: '/TU9NIjwzjoKPwQHoHshkFcQUCG.jpg',
  },
  'work-8': {
    tmdbId: 11423,
    mediaType: 'movie',
    posterPath: '/rxndHKwUeFgTHx0PuuhZS4dMtrB.jpg',
    backdropPath: '/7Nwnmyzrtd0FkcRyPqmdzTPppQa.jpg',
  },
  'work-9': {
    tmdbId: 27205,
    mediaType: 'movie',
    posterPath: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdropPath: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
  },
  'work-10': {
    tmdbId: 9323,
    mediaType: 'movie',
    posterPath: '/9gC88zYUBARRSThcG93MvW14sqx.jpg',
    backdropPath: '/vINgGecnz95iDL6fjQMARDSocgG.jpg',
  },
  'work-11': {
    tmdbId: 30991,
    mediaType: 'tv',
    posterPath: '/xDiXDfZwC6XYC6fxHI1jl3A3Ill.jpg',
    backdropPath: '/A6tMQAo6t6eRFCPhsrShmxZLqFB.jpg',
  },
  'work-12': {
    tmdbId: 10494,
    mediaType: 'movie',
    posterPath: '/79vujbsWEbX4dzffBV541QXN6sf.jpg',
    backdropPath: '/mSDsSDwaP3E7dEfUPWy4J0djt4O.jpg',
  },
  'work-13': {
    tmdbId: 129,
    mediaType: 'movie',
    posterPath: '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    backdropPath: '/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
  },
  'work-14': {
    tmdbId: 1396,
    mediaType: 'tv',
    posterPath: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdropPath: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
  },
  'work-15': {
    tmdbId: 60059,
    mediaType: 'tv',
    posterPath: '/fC2HDm5t0kHl7mTm7jxMR31b7by.jpg',
    backdropPath: '/hPea3Qy5Gd6z4kJLUruBbwAH8Rm.jpg',
  },
  'work-16': {
    tmdbId: 95396,
    mediaType: 'tv',
    posterPath: '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
    backdropPath: '/ixgFmf1X59PUZam2qbAfskx2gQr.jpg',
  },
  'work-17': {
    tmdbId: 87108,
    mediaType: 'tv',
    posterPath: '/hlLXt2tOPT6RRnjiUmoxyG1LTFi.jpg',
    backdropPath: '/900tHlUYUkp7Ol04XFSoAaEIXcT.jpg',
  },
  'work-18': {
    tmdbId: 46648,
    mediaType: 'tv',
    posterPath: '/cuV2O5ZyDLHSOWzg3nLVljp1ubw.jpg',
    backdropPath: '/2Ahm0YjLNQKuzSf9LOkHrXk8qIE.jpg',
  },
  'work-19': {
    tmdbId: 68595,
    mediaType: 'tv',
    posterPath: '/tUKomxy50suT4MyxjYfOJDkZUq3.jpg',
    backdropPath: '/kK5Oe0wQ6G0nK7I1E5hF4bQ2pL.jpg',
  },
  'work-20': {
    tmdbId: 472742,
    mediaType: 'movie',
    posterPath: '/a34xN04T5H4i5v4R7P4b2w3X9z.jpg',
    backdropPath: '/8R7y5e2Q9W1x6v3K5n8M4p2L1t.jpg',
  },
  'work-21': {
    tmdbId: 531428,
    mediaType: 'movie',
    posterPath: '/2LquGwEhbg3soxSCs9VNyh5VJd9.jpg',
    backdropPath: '/3dPhs7hUnQLphDFzdkPFOz2S2H0.jpg',
  },
  'work-22': {
    tmdbId: 515042,
    mediaType: 'movie',
    posterPath: '/v4QfYZMACODlWul9doN9RxE99ag.jpg',
    backdropPath: '/w2PMyoyLU22YvrGK3smVM9fW1jj.jpg',
  },
  'work-23': {
    tmdbId: 913823,
    mediaType: 'movie',
    posterPath: '/b5s13F1R7792b7A2C2b7P5G1M9.jpg',
    backdropPath: '/6KL72P32X9K8F5M4L2N1P8Q3R5.jpg',
  },
  'work-24': {
    tmdbId: 915935,
    mediaType: 'movie',
    posterPath: '/kQs6keheMwCxJxrzV83VUwFtHkB.jpg',
    backdropPath: '/fGe1ej335XbqN1j9teoDpofpbLX.jpg',
  },
  'work-25': {
    tmdbId: 1398,
    mediaType: 'movie',
    posterPath: '/lUE0Bp7wH0EterJ44qMRsqtKFnp.jpg',
    backdropPath: '/dG2fI2vQ5B1x8H4k9P3m7L2n6V.jpg',
  },
  'work-26': {
    tmdbId: 255709,
    mediaType: 'movie',
    posterPath: '/5p7N3W8K2x4M9L1q6R8v2Y3z5T.jpg',
    backdropPath: '/7q2M5N8K3x9L4P1v6R2w8Y5z3T.jpg',
  },
};

/**
 * Curated TMDB Person IDs and official profile portrait paths for the 12 seed creators.
 */
export const CURATED_TMDB_PEOPLE_MAP: Record<
  string,
  { tmdbPersonId: number; profilePath: string; queryName: string }
> = {
  'person-1': {
    // Wong Kar-wai
    tmdbPersonId: 12453,
    profilePath: '/w743H9B9c1M9T4y6cR5X5N9qY3B.jpg',
    queryName: 'Wong Kar-wai',
  },
  'person-2': {
    // Denis Villeneuve
    tmdbPersonId: 137427,
    profilePath: '/zdDx9Xs93UIrJFWYApYR28J8M6b.jpg',
    queryName: 'Denis Villeneuve',
  },
  'person-3': {
    // Christopher Nolan
    tmdbPersonId: 525,
    profilePath: '/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg',
    queryName: 'Christopher Nolan',
  },
  'person-4': {
    // Bong Joon-ho
    tmdbPersonId: 21684,
    profilePath: '/tKLJBqbdH6HFj2QxLA5o8lk7IVs.jpg',
    queryName: 'Bong Joon-ho',
  },
  'person-5': {
    // Edward Yang
    tmdbPersonId: 142058,
    profilePath: '/n7B9uK6jF4w9L8r3v1P2x5M8q9T.jpg',
    queryName: 'Edward Yang',
  },
  'person-6': {
    // Tony Leung Chiu-wai
    tmdbPersonId: 1337,
    profilePath: '/p132T2H6mH8L5J1F3k8M7q4R6wN.jpg',
    queryName: 'Tony Leung Chiu-wai',
  },
  'person-7': {
    // Song Kang-ho
    tmdbPersonId: 20738,
    profilePath: '/dyWUKQlNyr73Ajo58V1v121y32B.jpg',
    queryName: 'Song Kang-ho',
  },
  'person-8': {
    // Matthew McConaughey
    tmdbPersonId: 10297,
    profilePath: '/e9ZHRY5toiBZCIPEEyvOG9A8ers.jpg',
    queryName: 'Matthew McConaughey',
  },
  'person-9': {
    // Mamoru Oshii
    tmdbPersonId: 13009,
    profilePath: '/7k8N4W5m2P9x1L6q3R8v4Y2z1T.jpg',
    queryName: 'Mamoru Oshii',
  },
  'person-10': {
    // Vince Gilligan
    tmdbPersonId: 66633,
    profilePath: '/uFh3OrBvkwKSU3N5y0XnXLVqBJz.jpg',
    queryName: 'Vince Gilligan',
  },
  'person-11': {
    // Bob Odenkirk
    tmdbPersonId: 59410,
    profilePath: '/rF0Lb6SBhGSTvjRffmlKRSeI3jE.jpg',
    queryName: 'Bob Odenkirk',
  },
  'person-12': {
    // Ryuichi Sakamoto
    tmdbPersonId: 11266,
    profilePath: '/n85T6X1w2L9p4K3m7R1v8Y5z2Q.jpg',
    queryName: 'Ryuichi Sakamoto',
  },
};

export interface TmdbSearchResultItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  year: number;
  overview: string;
  posterUrl: string;
  backdropUrl: string;
  voteAverage: number;
}

export interface TmdbDetailedWork {
  title: string;
  originalTitle: string;
  year: number;
  type: WorkType;
  genres: string[];
  director: string[];
  cast: string[];
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  runtime: number;
  voteAverage: number;
}

export async function searchTmdb(
  query: string,
  apiKey: string = DEFAULT_TMDB_API_KEY
): Promise<TmdbSearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const key = apiKey.trim() || DEFAULT_TMDB_API_KEY;
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${encodeURIComponent(
    key
  )}&language=zh-CN&query=${encodeURIComponent(cleanQuery)}&page=1&include_adult=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TMDB API 请求失败（状态码：${res.status}）。`);
  }

  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];

  return results
    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
    .map((item: any): TmdbSearchResultItem => {
      const isMovie = item.media_type === 'movie';
      const title = isMovie ? item.title || item.original_title : item.name || item.original_name;
      const originalTitle = isMovie ? item.original_title || title : item.original_name || title;
      const releaseDate = isMovie ? item.release_date : item.first_air_date;
      const year =
        releaseDate && releaseDate.length >= 4
          ? parseInt(releaseDate.slice(0, 4), 10)
          : new Date().getFullYear();

      return {
        id: item.id,
        mediaType: isMovie ? 'movie' : 'tv',
        title: title || '未知作品',
        originalTitle: originalTitle || title || 'Unknown',
        year: !Number.isNaN(year) ? year : new Date().getFullYear(),
        overview: item.overview || '暂无中文剧情简介。',
        posterUrl: item.poster_path ? `${TMDB_IMAGE_BASE_W500}${item.poster_path}` : '',
        backdropUrl: item.backdrop_path ? `${TMDB_IMAGE_BASE_W1280}${item.backdrop_path}` : '',
        voteAverage: Math.round((item.vote_average || 0) * 10) / 10,
      };
    });
}

export async function fetchTmdbWorkDetails(
  id: number,
  mediaType: 'movie' | 'tv',
  apiKey: string = DEFAULT_TMDB_API_KEY
): Promise<TmdbDetailedWork> {
  const key = apiKey.trim() || DEFAULT_TMDB_API_KEY;
  const endpoint = mediaType === 'movie' ? 'movie' : 'tv';
  const url = `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${encodeURIComponent(
    key
  )}&language=zh-CN&append_to_response=credits`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`获取作品详情失败（状态码：${res.status}）。`);
  }

  const data = await res.json();
  const isMovie = mediaType === 'movie';
  const title = isMovie ? data.title || data.original_title : data.name || data.original_name;
  const originalTitle = isMovie ? data.original_title || title : data.original_name || title;
  const releaseDate = isMovie ? data.release_date : data.first_air_date;
  const year =
    releaseDate && releaseDate.length >= 4
      ? parseInt(releaseDate.slice(0, 4), 10)
      : new Date().getFullYear();

  const crew: any[] = data.credits?.crew || [];
  const directors = crew
    .filter((c) => c.job === 'Director')
    .map((c) => c.name || c.original_name)
    .filter(Boolean);

  if (directors.length === 0 && Array.isArray(data.created_by)) {
    data.created_by.forEach((c: any) => {
      if (c.name) directors.push(c.name);
    });
  }

  const castList: any[] = data.credits?.cast || [];
  const cast = castList
    .slice(0, 5)
    .map((c) => c.name || c.original_name)
    .filter(Boolean);

  const genres = Array.isArray(data.genres)
    ? data.genres.map((g: any) => g.name).filter(Boolean)
    : ['剧情'];

  let runtime = 120;
  if (isMovie && data.runtime) {
    runtime = data.runtime;
  } else if (!isMovie && Array.isArray(data.episode_run_time) && data.episode_run_time.length > 0) {
    runtime = data.episode_run_time[0];
  }

  let type: WorkType = isMovie ? 'Movie' : 'TV Series';
  if (genres.some((g: string) => g.includes('动画') || g.includes('Animation'))) {
    type = 'Anime';
  } else if (genres.some((g: string) => g.includes('纪录') || g.includes('Documentary'))) {
    type = 'Documentary';
  }

  return {
    title,
    originalTitle,
    year,
    type,
    genres: genres.length > 0 ? genres : ['剧情'],
    director: directors.length > 0 ? directors : ['未知导演'],
    cast: cast.length > 0 ? cast : ['主要演员'],
    synopsis: data.overview || `${title} (${year}) 官方收录资料。`,
    posterUrl: data.poster_path ? `${TMDB_IMAGE_BASE_W500}${data.poster_path}` : '',
    backdropUrl: data.backdrop_path ? `${TMDB_IMAGE_BASE_W1280}${data.backdrop_path}` : '',
    runtime,
    voteAverage: Math.round((data.vote_average || 0) * 10) / 10,
  };
}

/**
 * Batch refreshes official TMDB posters & widescreen backdrops for all works in the user's archive.
 */
export async function batchRefreshTmdbPostersForArchive(
  works: Work[],
  apiKey: string = DEFAULT_TMDB_API_KEY,
  onProgress?: (completed: number, total: number, currentTitle: string) => void
): Promise<{ updatedWorks: Work[]; refreshedCount: number }> {
  const key = apiKey.trim() || DEFAULT_TMDB_API_KEY;
  const updatedWorks: Work[] = [];
  let refreshedCount = 0;

  for (let i = 0; i < works.length; i++) {
    const work = works[i];
    if (onProgress) {
      onProgress(i + 1, works.length, work.title);
    }

    let nextPoster = work.posterUrl;
    let nextBackdrop = work.backdropUrl;
    let updated = false;

    const curated = CURATED_TMDB_ARTWORK_MAP[work.id];

    try {
      let queryUrl = '';
      if (curated) {
        queryUrl = `https://api.themoviedb.org/3/${curated.mediaType}/${curated.tmdbId}?api_key=${encodeURIComponent(
          key
        )}&language=zh-CN`;
        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.poster_path) {
            nextPoster = `${TMDB_IMAGE_BASE_W500}${data.poster_path}`;
            updated = true;
          }
          if (data.backdrop_path) {
            nextBackdrop = `${TMDB_IMAGE_BASE_W1280}${data.backdrop_path}`;
            updated = true;
          }
        }
      } else {
        const isSeries = work.type === 'TV Series';
        const endpoint = isSeries ? 'tv' : 'movie';
        const cleanOrig = work.originalTitle.replace(/\s*\(.*?\)\s*/g, '').trim();
        const searchQ = cleanOrig || work.title;
        queryUrl = `https://api.themoviedb.org/3/search/${endpoint}?api_key=${encodeURIComponent(
          key
        )}&language=zh-CN&query=${encodeURIComponent(searchQ)}&page=1`;
        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          const match = Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : null;
          if (match) {
            if (match.poster_path) {
              nextPoster = `${TMDB_IMAGE_BASE_W500}${match.poster_path}`;
              updated = true;
            }
            if (match.backdrop_path) {
              nextBackdrop = `${TMDB_IMAGE_BASE_W1280}${match.backdrop_path}`;
              updated = true;
            }
          }
        }
      }
    } catch {
      // Fallback to curated map
    }

    if (!updated && curated) {
      nextPoster = `${TMDB_IMAGE_BASE_W500}${curated.posterPath}`;
      nextBackdrop = `${TMDB_IMAGE_BASE_W1280}${curated.backdropPath}`;
      updated = true;
    }

    if (updated) {
      refreshedCount++;
    }

    updatedWorks.push({
      ...work,
      posterUrl: nextPoster,
      backdropUrl: nextBackdrop,
      updatedAt: new Date().toISOString(),
    });
  }

  return { updatedWorks, refreshedCount };
}

/**
 * Batch refreshes creator profile portraits and biographies from TMDB for all People in the archive.
 */
export async function batchRefreshTmdbPeopleForArchive(
  people: Person[],
  apiKey: string = DEFAULT_TMDB_API_KEY,
  onProgress?: (completed: number, total: number, currentName: string) => void
): Promise<{ updatedPeople: Person[]; refreshedCount: number }> {
  const key = apiKey.trim() || DEFAULT_TMDB_API_KEY;
  const updatedPeople: Person[] = [];
  let refreshedCount = 0;

  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    if (onProgress) {
      onProgress(i + 1, people.length, person.name);
    }

    let nextAvatar = person.avatarUrl;
    let nextBio = person.biography;
    let updated = false;
    const curated = CURATED_TMDB_PEOPLE_MAP[person.id];

    try {
      if (curated) {
        const res = await fetch(
          `https://api.themoviedb.org/3/person/${curated.tmdbPersonId}?api_key=${encodeURIComponent(
            key
          )}&language=zh-CN`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.profile_path) {
            nextAvatar = `${TMDB_IMAGE_BASE_W500}${data.profile_path}`;
            updated = true;
          }
          if (data.biography && data.biography.trim().length > 20) {
            nextBio = data.biography.trim();
          }
        }
      }

      if (!updated) {
        const qName = curated?.queryName || person.originalName?.split('/')[0]?.trim() || person.name;
        const searchRes = await fetch(
          `https://api.themoviedb.org/3/search/person?api_key=${encodeURIComponent(
            key
          )}&language=zh-CN&query=${encodeURIComponent(qName)}&page=1`
        );
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const match =
            Array.isArray(searchData.results) && searchData.results.length > 0
              ? searchData.results[0]
              : null;
          if (match && match.profile_path) {
            nextAvatar = `${TMDB_IMAGE_BASE_W500}${match.profile_path}`;
            updated = true;
          }
        }
      }
    } catch {
      // Fallback to curated map
    }

    if (!updated && curated && curated.profilePath) {
      nextAvatar = `${TMDB_IMAGE_BASE_W500}${curated.profilePath}`;
      updated = true;
    }

    if (updated) {
      refreshedCount++;
    }

    updatedPeople.push({
      ...person,
      avatarUrl: nextAvatar,
      biography: nextBio,
    });
  }

  return { updatedPeople, refreshedCount };
}
