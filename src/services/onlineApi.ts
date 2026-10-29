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

/**
 * Searches real songs from the iTunes Search API with playable audio streams
 */
export async function searchOnlineTracks(query: string, limit = 15): Promise<Track[]> {
  if (!query.trim()) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&media=music&entity=song&limit=${limit}`
    );
    if (!response.ok) return [];
    const data = await response.json();
    const results: ITunesResult[] = data.results || [];

    return results
      .filter((item) => item.trackName && item.artistName)
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
  } catch {
    return [];
  }
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
 * Attempts to resolve a full-length MP3 stream from Internet Archive (0:00 intro to end)
 * for any searched song so it plays from the beginning instead of a 30s chorus snippet.
 */
export async function resolveFullLengthAudioUrl(
  title: string,
  artist: string
): Promise<string | null> {
  try {
    const cleanArtist = artist.split(',')[0].trim();
    const q = `title:(${title}) AND (${cleanArtist}) AND mediatype:audio`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(
      q
    )}&fl[]=identifier,title&rows=3&output=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const docs = data.response?.docs || [];

    for (const doc of docs) {
      const metaRes = await fetch(`https://archive.org/metadata/${doc.identifier}`);
      if (!metaRes.ok) continue;
      const meta = await metaRes.json();
      const mp3 = (meta.files || []).find(
        (f: { name?: string; length?: string }) =>
          f.name &&
          f.name.toLowerCase().endsWith('.mp3') &&
          (!f.length || parseFloat(f.length) < 900)
      );
      if (mp3?.name) {
        return `https://archive.org/download/${doc.identifier}/${encodeURIComponent(mp3.name)}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves real playable audio streams for any tracks that don't already have a full-length audioUrl
 */
export async function hydrateDefaultTracksAudio(tracks: Track[]): Promise<Track[]> {
  const updated = await Promise.all(
    tracks.map(async (track) => {
      if (track.audioUrl) return track;
      try {
        const fullUrl = await resolveFullLengthAudioUrl(track.title, track.artist);
        if (fullUrl) {
          return { ...track, audioUrl: fullUrl };
        }
        const q = encodeURIComponent(`${track.title} ${track.artist.split(',')[0]}`);
        const res = await fetch(
          `https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`
        );
        if (!res.ok) return track;
        const data = await res.json();
        const match: ITunesResult | undefined = data.results?.[0];
        if (match?.previewUrl) {
          return {
            ...track,
            audioUrl: match.previewUrl,
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
