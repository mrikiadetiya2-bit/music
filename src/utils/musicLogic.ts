import { LyricLine, Track } from '../types/music';

/**
 * Formats seconds into M:SS (e.g., 84 -> "1:24", 261 -> "4:21")
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Formats byte size into human-readable KB / MB
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 MB';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parses an audio filename (e.g., "Bernadya - Satu Bulan.mp3") into artist and title
 */
export function parseAudioFilename(filename: string): { title: string; artist: string; album: string } {
  const withoutExt = filename.replace(/\.[^/.]+$/, '').trim();
  const clean = withoutExt.replace(/_/g, ' ').replace(/\s+/g, ' ');

  if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    const artist = parts[0].trim() || 'Local Artist';
    const title = parts.slice(1).join(' - ').trim() || 'Untitled Track';
    return { title, artist, album: 'iPhone Imported Audio' };
  }

  return {
    title: clean || 'Untitled Track',
    artist: 'iPhone Local Import',
    album: 'Offline Library',
  };
}

/**
 * Parses LRC format or plain multiline lyrics into synchronized LyricLine[]
 */
export function parseLrcLyrics(rawText: string, totalDuration = 210): LyricLine[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [{ time: 0, text: 'Instrumental / Lyrics unavailable' }];
  }

  const lrcRegex = /^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\](.*)$/;
  const parsedLrc: LyricLine[] = [];

  for (const line of lines) {
    const match = line.match(lrcRegex);
    if (match) {
      const mins = parseInt(match[1], 10);
      const secs = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;
      const text = match[4].trim();
      if (text) {
        parsedLrc.push({
          time: Number((mins * 60 + secs + ms / 1000).toFixed(2)),
          text,
        });
      }
    }
  }

  if (parsedLrc.length > 0) {
    return parsedLrc.sort((a, b) => a.time - b.time);
  }

  // Fallback: evenly space plain lines across duration
  const step = Math.max(4, Math.floor((totalDuration * 0.85) / lines.length));
  return lines.map((text, idx) => ({
    time: idx * step,
    text,
  }));
}

/**
 * Returns the active lyric line index for a given playback time
 */
export function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return 0;
  let activeIdx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime >= lyrics[i].time) {
      activeIdx = i;
    } else {
      break;
    }
  }
  return activeIdx;
}

/**
 * Filters tracks by genre and search query
 */
export function filterTracksByGenreAndQuery(
  tracks: Track[],
  genre: string,
  query: string
): Track[] {
  const normalizedQuery = query.trim().toLowerCase();
  return tracks.filter((track) => {
    const matchesGenre = genre === 'All' || track.genre.toLowerCase() === genre.toLowerCase();
    if (!matchesGenre) return false;
    if (!normalizedQuery) return true;
    const inTitle = track.title.toLowerCase().includes(normalizedQuery);
    const inArtist = track.artist.toLowerCase().includes(normalizedQuery);
    const inAlbum = track.album.toLowerCase().includes(normalizedQuery);
    const inLyrics = track.lyrics.some((l) => l.text.toLowerCase().includes(normalizedQuery));
    return inTitle || inArtist || inAlbum || inLyrics;
  });
}

/**
 * Generates a warm, pleasant polyphonic ambient chord progression WAV Blob in memory.
 * Used as an offline-ready audio stream fallback and for instant offline caching.
 */
export function generateProceduralWavBlob(baseFreq = 261.63, durationSeconds = 12): Blob {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // 4-chord warm progression ratios (I - V - vi - IV)
  const chordRoots = [1, 0.75, 0.8409, 0.6674];
  const chordLen = durationSeconds / 4;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.min(3, Math.floor(t / chordLen));
    const localT = t % chordLen;
    const root = baseFreq * chordRoots[chordIdx];

    // Major triad + warm octave pad + gentle melody note
    const f1 = root;
    const f2 = root * 1.2599; // Major 3rd
    const f3 = root * 1.4983; // Perfect 5th
    const f4 = root * 2.0 * (localT > chordLen / 2 ? 1.122 : 1.0);

    // Smooth envelope per chord
    const attack = Math.min(1, localT / 0.25);
    const release = Math.min(1, (chordLen - localT) / 0.35);
    const env = attack * release;

    const signal =
      (Math.sin(2 * Math.PI * f1 * t) * 0.35 +
        Math.sin(2 * Math.PI * f2 * t) * 0.25 +
        Math.sin(2 * Math.PI * f3 * t) * 0.22 +
        Math.sin(2 * Math.PI * f4 * t) * 0.12) *
      env;

    const sample = Math.max(-1, Math.min(1, signal * 0.65));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Safely maps a desired track seek time (e.g. 120s on a 261s song) to a valid position
 * within the underlying HTMLAudioElement buffer (e.g. 29.7s iTunes preview or 24s WAV),
 * preventing premature 'ended' events when seeking past the preview length.
 */
export function computeAudioSeekTime(targetTrackTime: number, audioBufferDuration: number): number {
  if (!Number.isFinite(targetTrackTime) || targetTrackTime < 0) return 0;
  if (!Number.isFinite(audioBufferDuration) || audioBufferDuration <= 1) return 0;

  // If the target time fits well inside the actual audio buffer, seek 1:1
  if (targetTrackTime < audioBufferDuration - 1) {
    return targetTrackTime;
  }

  // Otherwise wrap cleanly within the safe middle of the audio buffer so it never hits the end immediately
  const safeWindow = Math.max(1, audioBufferDuration - 2);
  return targetTrackTime % safeWindow;
}

/**
 * Resolves the next track index in a queue given the current track ID
 */
export function getNextTrackIndex(queue: Track[], currentTrackId: string): number {
  if (queue.length === 0) return -1;
  const idx = queue.findIndex((t) => t.id === currentTrackId);
  if (idx === -1) return 0;
  return (idx + 1) % queue.length;
}

