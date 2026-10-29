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

const JIOSAAVN_SEARCH_ENDPOINTS = [
  'https://saavn.dev/api/search/songs',
  'https://saavn.sumit.co/api/search/songs',
  'https://jiosaavn-api-privatecvc2.vercel.app/search/songs',
];

const PIPED_API_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.private.coffee',
  'https://pipedapi.ducks.party',
  'https://pipedapi-libre.kavin.rocks',
];

// In-memory cache of resolved full-length stream URLs by normalized "title|artist"
const resolvedStreamCache = new Map<string, string>();

function getCacheKey(title: string, artist: string): string {
  return `${title.trim().toLowerCase()}|${artist.split(',')[0].trim().toLowerCase()}`;
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
 * Engine 1: JioSaavn Full-Track API
 * Queries saavn.dev / saavn.sumit.co / jiosaavn-api-privatecvc2.vercel.app
 * and extracts the highest quality full-length 320kbps/160kbps MP4/M4A stream.
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

  for (const endpoint of JIOSAAVN_SEARCH_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}&limit=8`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) continue;

      const json = await res.json();
      const results: SaavnSongResult[] = json?.data?.results || json?.results || [];
      if (!Array.isArray(results) || results.length === 0) continue;

      // Find best matching full-length song (avoiding karaoke/unrelated tracks)
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
      // Try next JioSaavn mirror
    }
  }
  return null;
}

/**
 * Engine 2: Piped / Invidious YouTube Music Audio Resolver
 * Searches public Piped API instances with filter=music_songs and resolves /streams/:videoId
 */
export async function searchPipedYouTubeAudio(
  title: string,
  artist: string
): Promise<{ url: string; duration?: number } | null> {
  const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
  const cleanArtist = artist.split(',')[0].split('&')[0].trim();
  const q = `${cleanTitle} ${cleanArtist} official audio`.trim();

  for (const instance of PIPED_API_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const searchRes = await fetch(
        `${instance}/search?q=${encodeURIComponent(q)}&filter=music_songs`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const items: Array<{ url?: string; duration?: number; title?: string }> =
        searchData?.items || [];
      const first = items.find((i) => i.url && i.url.includes('v='));
      if (!first?.url) continue;

      const videoId = first.url.split('v=')[1]?.split('&')[0];
      if (!videoId) continue;

      const streamCtrl = new AbortController();
      const streamTimeout = setTimeout(() => streamCtrl.abort(), 3500);
      const streamRes = await fetch(`${instance}/streams/${videoId}`, {
        signal: streamCtrl.signal,
      });
      clearTimeout(streamTimeout);
      if (!streamRes.ok) continue;

      const streamData = await streamRes.json();
      const audioStreams: Array<{ url?: string; mimeType?: string; bitrate?: number }> =
        streamData?.audioStreams || [];
      if (!Array.isArray(audioStreams) || audioStreams.length === 0) continue;

      // Prefer m4a/mp4 stream for iOS Safari compatibility, sorted by highest bitrate
      const sorted = [...audioStreams]
        .filter((s) => Boolean(s.url))
        .sort((a, b) => {
          const aIsMp4 = (a.mimeType || '').includes('mp4') ? 1 : 0;
          const bIsMp4 = (b.mimeType || '').includes('mp4') ? 1 : 0;
          if (aIsMp4 !== bIsMp4) return bIsMp4 - aIsMp4;
          return (b.bitrate || 0) - (a.bitrate || 0);
        });

      if (sorted[0]?.url) {
        return {
          url: sorted[0].url,
          duration: Number(streamData?.duration || first.duration) || undefined,
        };
      }
    } catch {
      // Try next Piped instance
    }
  }
  return null;
}

/**
 * Engine 3: Internet Archive Full-Track MP3 Resolver (archive.org)
 * Finds verified full-length (75s - 650s) MP3 recordings starting from 0:00 intro.
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
    )}&fl[]=identifier,title&rows=5&output=json`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const data = await res.json();
    const docs: Array<{ identifier: string; title?: string }> = data.response?.docs || [];

    for (const doc of docs) {
      const metaCtrl = new AbortController();
      const metaTimeout = setTimeout(() => metaCtrl.abort(), 3500);
      const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}`, {
        signal: metaCtrl.signal,
      });
      clearTimeout(metaTimeout);
      if (!metaRes.ok) continue;

      const meta = await metaRes.json();
      const mp3Files: Array<{ name?: string; length?: string; size?: string }> = (
        meta.files || []
      ).filter((f: { name?: string }) => f.name && f.name.toLowerCase().endsWith('.mp3'));

      const match = mp3Files.find((f) => {
        const len = parseFloat(f.length || '0');
        const size = parseInt(f.size || '0', 10);
        if (len > 0 && (len < 75 || len > 650)) return false;
        if (size > 0 && size < 500000) return false;
        const targetText =
          mp3Files.length === 1
            ? `${doc.title || ''} ${f.name || ''}`.toLowerCase()
            : (f.name || '').toLowerCase();
        return titleWords.every((w) => targetText.includes(w));
      });

      if (match?.name) {
        return {
          url: `https://archive.org/download/${doc.identifier}/${encodeURIComponent(match.name)}`,
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
 * Resolves a FULL-LENGTH audio stream URL (from 0:00 intro to end, 3-5 minutes)
 * using the 3-tier full-track engine:
 * 1. JioSaavn Full-Track API (320kbps/160kbps .mp4/.m4a)
 * 2. Piped / Invidious YouTube Music Audio API (/streams/:videoId)
 * 3. Internet Archive Full-Track Audio Engine (archive.org MP3)
 */
export async function resolveFullLengthAudioUrl(
  title: string,
  artist: string
): Promise<string | null> {
  const key = getCacheKey(title, artist);
  const cached = resolvedStreamCache.get(key);
  if (cached) return cached;

  // 1. Primary: JioSaavn Full-Track API
  const saavn = await searchJioSaavnFullTrack(title, artist);
  if (saavn?.url) {
    resolvedStreamCache.set(key, saavn.url);
    return saavn.url;
  }

  // 2. Secondary: Piped / Invidious YouTube Music Audio API
  const piped = await searchPipedYouTubeAudio(title, artist);
  if (piped?.url) {
    resolvedStreamCache.set(key, piped.url);
    return piped.url;
  }

  // 3. Tertiary: Internet Archive Full-Length MP3 Engine
  const archive = await searchInternetArchiveFullMp3(title, artist);
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
function fetchJsonp<T>(url: string, callbackParam = 'callback', timeoutMs = 6500): Promise<T> {
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

/**
 * Maps iTunes metadata & high-res 600x600 cover art WITHOUT using previewUrl as primary audioUrl!
 */
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
        getCacheKey(item.trackName, item.artistName)
      );

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        duration: durationSec,
        coverUrl: highResCover,
        // Never use iTunes 30s previewUrl as primary audioUrl; keep it only in fallbackPreviewUrl
        audioUrl: cachedFullUrl,
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
      const cachedFullUrl = resolvedStreamCache.get(getCacheKey(item.title, artistName));

      return {
        id: `deezer-${item.id}`,
        title: item.title,
        artist: artistName,
        album: item.album?.title || 'Single',
        duration: item.duration || 210,
        coverUrl: item.album?.cover_big || item.album?.cover_medium || ARTWORK.chillVibesMoon,
        audioUrl: cachedFullUrl,
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
        resolvedStreamCache.set(getCacheKey(title, artist), streamUrl);
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
 * Searches real songs and attaches full-length audio streams (JioSaavn / Piped / Archive.org).
 * iTunes/Deezer are used ONLY for high-res album art & catalog metadata, NEVER as primary audio source.
 */
export async function searchOnlineTracks(query: string, limit = 15): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const encoded = encodeURIComponent(trimmed);

  let metadataTracks: Track[] = [];

  // 1. Fetch high-res metadata & catalog list (iTunes Fetch -> iTunes JSONP -> Deezer JSONP)
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
    );
    if (response.ok) {
      const data = await response.json();
      metadataTracks = mapITunesItemsToMetadataTracks(data.results || []);
    }
  } catch {
    // Fallback to JSONP if CORS blocks standard fetch
  }

  if (metadataTracks.length === 0) {
    try {
      const data = await fetchJsonp<{ results?: ITunesResult[] }>(
        `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
      );
      metadataTracks = mapITunesItemsToMetadataTracks(data?.results || []);
    } catch {
      // Fallback to Deezer JSONP
    }
  }

  if (metadataTracks.length === 0) {
    try {
      const deezerData = await fetchJsonp<{ data?: DeezerResult[] }>(
        `https://api.deezer.com/search?q=${encoded}&limit=${limit}&output=jsonp`
      );
      metadataTracks = mapDeezerItemsToMetadataTracks(deezerData?.data || []);
    } catch {
      // Ignore
    }
  }

  // 2. Also query JioSaavn directly for full-length 320kbps streams
  for (const endpoint of JIOSAAVN_SEARCH_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${endpoint}?query=${encoded}&limit=${limit}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        const saavnTracks = mapSaavnItemsToTracks(json?.data?.results || json?.results || []);
        if (metadataTracks.length === 0 && saavnTracks.length > 0) {
          return saavnTracks;
        }
        // Attach any matched JioSaavn full-length audioUrl onto metadataTracks
        if (saavnTracks.length > 0) {
          metadataTracks = metadataTracks.map((t) => {
            const cached = resolvedStreamCache.get(getCacheKey(t.title, t.artist));
            return cached ? { ...t, audioUrl: cached } : t;
          });
        }
        break;
      }
    } catch {
      // Continue
    }
  }

  // Pre-warm full-length stream resolution for the top 3 results in the background
  metadataTracks.slice(0, 3).forEach((t) => {
    if (!t.audioUrl) {
      resolveFullLengthAudioUrl(t.title, t.artist).catch(() => {});
    }
  });

  return metadataTracks;
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

function isShortPreviewUrl(url?: string): boolean {
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
        resolvedStreamCache.set(getCacheKey(track.title, track.artist), track.audioUrl);
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
