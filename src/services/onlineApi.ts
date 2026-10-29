import { LyricLine, Track } from '../types/music';
import { parseLrcLyrics } from '../utils/musicLogic';
import { ARTWORK } from '../data/catalog';

interface ITunesResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  primaryGenreName?: string;
}

interface DeezerResult {
  id: number;
  title: string;
  duration?: number;
  preview?: string;
  artist?: { name?: string };
  album?: { title?: string; cover_big?: string; cover_medium?: string };
}

interface SaavnDownloadUrl {
  quality?: string;
  url?: string;
  link?: string;
}

interface SaavnSongResult {
  id?: string;
  name?: string;
  title?: string;
  duration?: number | string;
  album?: { name?: string; title?: string };
  primaryArtists?: string;
  artists?: {
    primary?: Array<{ name?: string }>;
  };
  image?: Array<{ quality?: string; url?: string; link?: string }>;
  downloadUrl?: SaavnDownloadUrl[] | string;
}

// Verified live JioSaavn endpoint (returns 200 OK in ~200ms with CORS enabled)
const JIOSAAVN_API_URL = 'https://saavn.sumit.co/api/search/songs';

// In-memory cache of resolved full-length stream URLs by normalized "title|artist"
const resolvedStreamCache = new Map<string, string>();

export function getTrackCacheKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()}|${artist.split(',')[0].trim().toLowerCase()}`;
}

export function getCachedFullLengthUrl(title: string, artist: string): string | undefined {
  return resolvedStreamCache.get(getTrackCacheKey(title, artist));
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function extractBestSaavnDownloadUrl(downloadUrl?: SaavnDownloadUrl[] | string): string | null {
  if (!downloadUrl) return null;
  if (typeof downloadUrl === 'string') return downloadUrl;
  if (!Array.isArray(downloadUrl) || downloadUrl.length === 0) return null;

  const preferredQualities = ['320kbps', '160kbps', '96kbps', '48kbps'];
  for (const q of preferredQualities) {
    const match = downloadUrl.find((d) => d.quality === q && (d.url || d.link));
    if (match) return (match.url || match.link) ?? null;
  }
  const last = downloadUrl[downloadUrl.length - 1];
  return (last?.url || last?.link) ?? null;
}

function extractSaavnArtist(item: SaavnSongResult): string {
  if (item.primaryArtists && typeof item.primaryArtists === 'string') {
    return item.primaryArtists;
  }
  const primary = item.artists?.primary;
  if (Array.isArray(primary) && primary.length > 0) {
    return primary
      .map((a) => a.name)
      .filter(Boolean)
      .join(', ');
  }
  return 'Unknown Artist';
}

function extractSaavnCover(item: SaavnSongResult): string {
  if (Array.isArray(item.image) && item.image.length > 0) {
    const last = item.image[item.image.length - 1];
    return last?.url || last?.link || ARTWORK.chillVibesMoon;
  }
  return ARTWORK.chillVibesMoon;
}

/**
 * Engine 1: JioSaavn Full-Track API (320kbps / 160kbps .mp4/.m4a)
 */
export async function searchJioSaavnFullTrack(
  title: string,
  artist: string
): Promise<{ url: string; duration?: number } | null> {
  const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
  const cleanArtist = artist.split(',')[0].split('&')[0].trim();
  const query = `${cleanTitle} ${cleanArtist}`.trim();
  const titleWords = normalizeWords(cleanTitle);
  const artistWords = normalizeWords(cleanArtist);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1800);
    const res = await fetch(`${JIOSAAVN_API_URL}?query=${encodeURIComponent(query)}&limit=6`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = await res.json();
    const results: SaavnSongResult[] = json?.data?.results || json?.results || [];
    if (!Array.isArray(results) || results.length === 0) return null;

    const best = results.find((item) => {
      const itemTitle = (item.name || item.title || '').toLowerCase();
      const itemArtist = extractSaavnArtist(item).toLowerCase();
      const dur = Number(item.duration || 0);
      if (dur > 0 && dur < 75) return false;
      if (itemTitle.includes('karaoke') || itemArtist.includes('karaoke')) return false;

      const titleMatches =
        titleWords.length > 0 && titleWords.every((w) => itemTitle.includes(w));
      const artistMatches =
        artistWords.length === 0 || artistWords.some((w) => itemArtist.includes(w));
      return titleMatches && artistMatches && Boolean(extractBestSaavnDownloadUrl(item.downloadUrl));
    });

    if (best) {
      const streamUrl = extractBestSaavnDownloadUrl(best.downloadUrl);
      if (streamUrl) {
        return {
          url: streamUrl,
          duration: Number(best.duration) || undefined,
        };
      }
    }
  } catch {
    // Ignore network timeout
  }
  return null;
}

/**
 * Engine 2: Internet Archive Full-Track MP3 Resolver (fast parallel metadata check)
 */
export async function searchInternetArchiveFullMp3(
  title: string,
  artist: string
): Promise<{ url: string; duration?: number } | null> {
  try {
    const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
    const cleanArtist = artist.split(',')[0].split('&')[0].trim();
    const titleWords = normalizeWords(cleanTitle);
    if (titleWords.length === 0) return null;

    const q = `(${cleanTitle}) AND (${cleanArtist}) AND mediatype:audio`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}&fl[]=identifier,title&rows=3&output=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const docs: Array<{ identifier: string; title?: string }> = data.response?.docs || [];
    if (docs.length === 0) return null;

    const metaResults = await Promise.all(
      docs.map(async (doc) => {
        try {
          const metaCtrl = new AbortController();
          const metaTimeout = setTimeout(() => metaCtrl.abort(), 1800);
          const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}`, {
            signal: metaCtrl.signal,
          });
          clearTimeout(metaTimeout);
          if (!metaRes.ok) return null;
          const meta = await metaRes.json();
          return { doc, files: meta.files || [] };
        } catch {
          return null;
        }
      })
    );

    for (const item of metaResults) {
      if (!item) continue;
      const mp3Files: Array<{ name?: string; length?: string; size?: string }> = item.files.filter(
        (f: { name?: string }) => f.name && f.name.toLowerCase().endsWith('.mp3')
      );

      const match = mp3Files.find((f) => {
        const len = parseFloat(f.length || '0');
        const size = parseInt(f.size || '0', 10);
        if (len > 0 && (len < 75 || len > 650)) return false;
        if (size > 0 && size < 500000) return false;
        const targetText =
          mp3Files.length === 1
            ? `${item.doc.title || ''} ${f.name || ''}`.toLowerCase()
            : (f.name || '').toLowerCase();
        return titleWords.every((w) => targetText.includes(w));
      });

      if (match?.name) {
        return {
          url: `https://archive.org/download/${item.doc.identifier}/${encodeURIComponent(
            match.name
          )}`,
          duration: Math.round(parseFloat(match.length || '0')) || undefined,
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a FULL-LENGTH audio stream URL (from 0:00 intro to end) in parallel
 */
export async function resolveFullLengthAudioUrl(
  title: string,
  artist: string
): Promise<string | null> {
  const key = getTrackCacheKey(title, artist);
  const cached = resolvedStreamCache.get(key);
  if (cached) return cached;

  const [saavn, archive] = await Promise.all([
    searchJioSaavnFullTrack(title, artist),
    searchInternetArchiveFullMp3(title, artist),
  ]);

  if (saavn?.url) {
    resolvedStreamCache.set(key, saavn.url);
    return saavn.url;
  }

  if (archive?.url) {
    resolvedStreamCache.set(key, archive.url);
    return archive.url;
  }

  return null;
}

/**
 * Helper to execute JSONP requests in browser environments where CORS may be restricted
 * by mobile carriers, Safari ITP, or static hosts like Netlify.
 */
function fetchJsonp<T>(url: string, callbackParam = 'callback', timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('No document available for JSONP'));
      return;
    }

    const callbackName = `__musee_jsonp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const script = document.createElement('script');
    const win = window as unknown as Record<string, unknown>;

    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP request timed out'));
    }, timeoutMs);

    function cleanup() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      delete win[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }

    win[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}${callbackParam}=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP script error'));
    };

    document.head.appendChild(script);
  });
}

function mapITunesItemsToMetadataTracks(results: ITunesResult[]): Track[] {
  return results
    .filter((item) => item.trackName && item.artistName)
    .map((item) => {
      const highResCover = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : ARTWORK.chillVibesMoon;
      const durationSec = item.trackTimeMillis
        ? Math.round(item.trackTimeMillis / 1000)
        : 210;

      const cachedFullUrl = resolvedStreamCache.get(
        getTrackCacheKey(item.trackName, item.artistName)
      );

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        duration: durationSec,
        coverUrl: highResCover,
        audioUrl: cachedFullUrl || item.previewUrl,
        fallbackPreviewUrl: item.previewUrl,
        genre: mapGenre(item.primaryGenreName),
        lyrics: [
          { time: 0, text: `${item.trackName} — ${item.artistName}` },
          { time: 6, text: 'Tap Lyrics to load full synchronized lyrics' },
          { time: 14, text: 'Available for 1-click Offline Download' },
          { time: 22, text: 'Music for a brighter day • Musee' },
        ],
      };
    });
}

function mapDeezerItemsToMetadataTracks(results: DeezerResult[]): Track[] {
  return results
    .filter((item) => item.title && item.artist?.name)
    .map((item) => {
      const artistName = item.artist?.name || 'Unknown Artist';
      const cachedFullUrl = resolvedStreamCache.get(getTrackCacheKey(item.title, artistName));

      return {
        id: `deezer-${item.id}`,
        title: item.title,
        artist: artistName,
        album: item.album?.title || 'Single',
        duration: item.duration || 210,
        coverUrl: item.album?.cover_big || item.album?.cover_medium || ARTWORK.chillVibesMoon,
        audioUrl: cachedFullUrl || item.preview,
        fallbackPreviewUrl: item.preview,
        genre: 'Pop',
        lyrics: [
          { time: 0, text: `${item.title} — ${artistName}` },
          { time: 6, text: 'Tap Lyrics to load full synchronized lyrics' },
          { time: 14, text: 'Available for 1-click Offline Download' },
          { time: 22, text: 'Music for a brighter day • Musee' },
        ],
      };
    });
}

function mapSaavnItemsToTracks(results: SaavnSongResult[]): Track[] {
  return results
    .filter((item) => {
      const title = (item.name || item.title || '').toLowerCase();
      const artist = extractSaavnArtist(item).toLowerCase();
      const dur = Number(item.duration || 0);
      if (dur > 0 && dur < 75) return false;
      if (title.includes('karaoke') || artist.includes('karaoke')) return false;
      return Boolean((item.name || item.title) && extractBestSaavnDownloadUrl(item.downloadUrl));
    })
    .map((item, idx) => {
      const title = (item.name || item.title || 'Untitled').replace(/&quot;/g, '"');
      const artist = extractSaavnArtist(item);
      const streamUrl = extractBestSaavnDownloadUrl(item.downloadUrl) || undefined;
      if (streamUrl) {
        resolvedStreamCache.set(getTrackCacheKey(title, artist), streamUrl);
      }
      return {
        id: `saavn-${item.id || idx}`,
        title,
        artist,
        album: item.album?.name || item.album?.title || 'Single',
        duration: Number(item.duration) || 210,
        coverUrl: extractSaavnCover(item),
        audioUrl: streamUrl,
        genre: 'Pop' as const,
        lyrics: [
          { time: 0, text: `${title} — ${artist}` },
          { time: 6, text: 'Tap Lyrics to load full synchronized lyrics' },
          { time: 14, text: 'Available for 1-click Offline Download' },
          { time: 22, text: 'Music for a brighter day • Musee' },
        ],
      };
    });
}

/**
 * Searches real songs with instant playback readiness and parallel full-length stream resolution.
 */
export async function searchOnlineTracks(query: string, limit = 15): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const encoded = encodeURIComponent(trimmed);

  const [catalogTracks, saavnTracks] = await Promise.all([
    (async (): Promise<Track[]> => {
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
        );
        if (res.ok) {
          const data = await res.json();
          const mapped = mapITunesItemsToMetadataTracks(data.results || []);
          if (mapped.length > 0) return mapped;
        }
      } catch {
        // Fallback to JSONP
      }

      try {
        const data = await fetchJsonp<{ results?: ITunesResult[] }>(
          `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
        );
        const mapped = mapITunesItemsToMetadataTracks(data?.results || []);
        if (mapped.length > 0) return mapped;
      } catch {
        // Fallback to Deezer JSONP
      }

      try {
        const deezerData = await fetchJsonp<{ data?: DeezerResult[] }>(
          `https://api.deezer.com/search?q=${encoded}&limit=${limit}&output=jsonp`
        );
        return mapDeezerItemsToMetadataTracks(deezerData?.data || []);
      } catch {
        return [];
      }
    })(),
    (async (): Promise<Track[]> => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1600);
        const res = await fetch(`${JIOSAAVN_API_URL}?query=${encoded}&limit=${limit}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (res.ok) {
          const json = await res.json();
          return mapSaavnItemsToTracks(json?.data?.results || json?.results || []);
        }
      } catch {
        // Ignore
      }
      return [];
    })(),
  ]);

  let finalTracks = catalogTracks.length > 0 ? catalogTracks : saavnTracks;

  if (catalogTracks.length > 0 && saavnTracks.length > 0) {
    finalTracks = catalogTracks.map((t) => {
      const cached = resolvedStreamCache.get(getTrackCacheKey(t.title, t.artist));
      return cached ? { ...t, audioUrl: cached } : t;
    });
  }

  // Pre-warm full-length stream resolution for top 2 results in background
  finalTracks.slice(0, 2).forEach((t) => {
    resolveFullLengthAudioUrl(t.title, t.artist).catch(() => {});
  });

  return finalTracks;
}

function mapGenre(raw?: string): Track['genre'] {
  if (!raw) return 'Pop';
  const g = raw.toLowerCase();
  if (g.includes('indie') || g.includes('alternative')) return 'Indie';
  if (g.includes('k-pop') || g.includes('korean')) return 'K-Pop';
  if (g.includes('rock') || g.includes('metal')) return 'Rock';
  if (g.includes('chill') || g.includes('jazz') || g.includes('lo-fi') || g.includes('r&b'))
    return 'Chill';
  return 'Pop';
}

export function isShortPreviewUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('apple.com') || url.includes('dzcdn.net');
}

/**
 * Pre-loads and attaches working full-length audio streams on startup for all default tracks
 */
export async function hydrateDefaultTracksAudio(tracks: Track[]): Promise<Track[]> {
  const updated = await Promise.all(
    tracks.map(async (track) => {
      if (track.audioUrl && !isShortPreviewUrl(track.audioUrl)) {
        resolvedStreamCache.set(getTrackCacheKey(track.title, track.artist), track.audioUrl);
        return track;
      }
      try {
        const fullUrl = await resolveFullLengthAudioUrl(track.title, track.artist);
        if (fullUrl) {
          return {
            ...track,
            audioUrl: fullUrl,
          };
        }
      } catch {
        // Keep existing audioUrl or procedural fallback
      }
      return track;
    })
  );
  return updated;
}

/**
 * Fetches synchronized or plain lyrics from LRCLIB API for any song
 */
export async function fetchLyricsFromLrclib(
  title: string,
  artist: string,
  duration = 210
): Promise<LyricLine[] | null> {
  try {
    const q = encodeURIComponent(`${title} ${artist.split(',')[0]}`);
    const res = await fetch(`https://lrclib.net/api/search?q=${q}`);
    if (!res.ok) return null;
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;

    const best = list.find((item) => item.syncedLyrics) || list.find((item) => item.plainLyrics);
    if (!best) return null;

    const raw = best.syncedLyrics || best.plainLyrics;
    if (!raw) return null;
    return parseLrcLyrics(raw, duration);
  } catch {
    return null;
  }
}
