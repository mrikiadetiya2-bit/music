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

function mapITunesItemsToTracks(results: ITunesResult[]): Track[] {
  return results
    .filter((item) => item.trackName && item.artistName && item.previewUrl)
    .map((item) => {
      const highResCover = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : ARTWORK.chillVibesMoon;
      const durationSec = item.trackTimeMillis
        ? Math.round(item.trackTimeMillis / 1000)
        : 210;

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        duration: durationSec,
        coverUrl: highResCover,
        audioUrl: item.previewUrl,
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

function mapDeezerItemsToTracks(results: DeezerResult[]): Track[] {
  return results
    .filter((item) => item.title && item.artist?.name && item.preview)
    .map((item) => ({
      id: `deezer-${item.id}`,
      title: item.title,
      artist: item.artist?.name || 'Unknown Artist',
      album: item.album?.title || 'Single',
      duration: item.duration || 210,
      coverUrl: item.album?.cover_big || item.album?.cover_medium || ARTWORK.chillVibesMoon,
      audioUrl: item.preview,
      genre: 'Pop',
      lyrics: [
        { time: 0, text: `${item.title} — ${item.artist?.name || ''}` },
        { time: 6, text: 'Tap Lyrics to load full synchronized lyrics' },
        { time: 14, text: 'Available for 1-click Offline Download' },
        { time: 22, text: 'Music for a brighter day • Musee' },
      ],
    }));
}

/**
 * Searches real songs from multiple online catalogs (iTunes Fetch -> iTunes JSONP -> Deezer JSONP)
 * so search always works reliably on mobile browsers, Safari, and Netlify deployments.
 */
export async function searchOnlineTracks(query: string, limit = 15): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const encoded = encodeURIComponent(trimmed);

  // 1. Primary: iTunes Search API via standard CORS fetch (prioritizing ID store for Indonesian + global hits)
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
    );
    if (response.ok) {
      const data = await response.json();
      const tracks = mapITunesItemsToTracks(data.results || []);
      if (tracks.length > 0) return tracks;
    }
  } catch {
    // Proceed to JSONP fallback if fetch is blocked by CORS or mobile network
  }

  // 2. Fallback A: iTunes Search API via JSONP (bypasses CORS blocks on mobile Safari/Chrome & Netlify)
  try {
    const data = await fetchJsonp<{ results?: ITunesResult[] }>(
      `https://itunes.apple.com/search?term=${encoded}&country=ID&media=music&entity=song&limit=${limit}`
    );
    const tracks = mapITunesItemsToTracks(data?.results || []);
    if (tracks.length > 0) return tracks;
  } catch {
    // Proceed to Deezer JSONP fallback
  }

  // 3. Fallback B: Deezer Public Search API via JSONP (millions of Indonesian & global tracks with MP3 previews)
  try {
    const deezerData = await fetchJsonp<{ data?: DeezerResult[] }>(
      `https://api.deezer.com/search?q=${encoded}&limit=${limit}&output=jsonp`
    );
    const tracks = mapDeezerItemsToTracks(deezerData?.data || []);
    if (tracks.length > 0) return tracks;
  } catch {
    // Ignore and return empty if completely offline
  }

  return [];
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

/**
 * Resolves real playable audio streams for any tracks that don't already have an audioUrl
 */
export async function hydrateDefaultTracksAudio(tracks: Track[]): Promise<Track[]> {
  const updated = await Promise.all(
    tracks.map(async (track) => {
      if (track.audioUrl) return track;
      try {
        const results = await searchOnlineTracks(`${track.title} ${track.artist.split(',')[0]}`, 1);
        if (results[0]?.audioUrl) {
          return {
            ...track,
            audioUrl: results[0].audioUrl,
          };
        }
      } catch {
        // Keep fallback procedural audio engine if offline
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
