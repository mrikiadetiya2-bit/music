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
 * Safely maps a desired track seek time to a valid position within the underlying
 * HTMLAudioElement buffer without wrapping/looping back to the start.
 */
export function computeAudioSeekTime(targetTrackTime: number, audioBufferDuration: number): number {
  if (!Number.isFinite(targetTrackTime) || targetTrackTime < 0) return 0;
  if (!Number.isFinite(audioBufferDuration) || audioBufferDuration <= 1) return targetTrackTime;

  return Math.min(targetTrackTime, Math.max(0, audioBufferDuration - 0.5));
}

/**
 * Normalizes track title and primary artist into a canonical cache key so metadata from
 * iTunes/Deezer matches full-length streams from JioSaavn and Archive.org reliably.
 */
export function normalizeTrackCacheKey(title: string, artist: string): string {
  const cleanTitle = title
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .replace(/\b(feat|ft|with)\b.*$/i, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const primaryArtist = artist
    .split(/,|&|\bfeat\b|\bft\b|\bwith\b|\bx\b/i)[0]
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return `${cleanTitle}|${primaryArtist}`;
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

const INDONESIAN_ARTIST_KEYWORDS = [
  'bernadya',
  'tulus',
  'mahalini',
  'hindia',
  'fiersa',
  'juicy luicy',
  'tiara andini',
  'lyodra',
  'ziva',
  'rizky febian',
  'sal priadi',
  'nadin amizah',
  'pamungkas',
  'sheila on 7',
  'dewa 19',
  'noah',
  'peterpan',
  'raisa',
  'isyana',
  'yura yunita',
  'kaleb j',
  'raim laode',
  'for revenge',
  'last child',
  '.feast',
  'reality club',
  'payung teduh',
  'fourtwnty',
  'virgoun',
  'budi doremi',
  'andmesh',
  'rossa',
  'afgan',
  'glenn fredly',
  'yovie',
  'maliq',
  'hivi',
  'vierratale',
  'nidji',
  'ungu',
  'slank',
  'kotak',
  'armada',
  'wali',
  'judika',
  'denny caknan',
  'ndx',
  'gildcoustic',
  'guyon waton',
  'nyoman paul',
  'rony parulian',
  'adrian khalif',
  'bilal indrajaya',
  'danilla',
  'ardhito',
  'kunto aji',
  'kahitna',
  'kerispatih',
  'samsons',
  'ada band',
  'dmasiv',
  "d'masiv",
  'geisha',
  'letto',
  'vierra',
];

const INDONESIAN_WORD_SET = new Set([
  'yang',
  'dan',
  'di',
  'ku',
  'mu',
  'aku',
  'kau',
  'kamu',
  'hati',
  'cinta',
  'jalan',
  'bulan',
  'waktu',
  'salah',
  'indah',
  'sedih',
  'kita',
  'rasa',
  'diri',
  'pulang',
  'malam',
  'pagi',
  'hujan',
  'pisah',
  'bersama',
  'tak',
  'bisa',
  'untuk',
  'dengan',
  'jangan',
  'kembali',
  'kenangan',
  'sendiri',
  'jatuh',
  'suka',
  'pamit',
  'sepatu',
  'sewindu',
  'monokrom',
  'interaksi',
  'sial',
  'evaluasi',
  'rumah',
  'cincin',
  'komang',
  'nanti',
  'bunga',
  'abadi',
  'penjaga',
  'satu',
  'dua',
  'tiga',
  'bukan',
  'masih',
  'sampai',
  'karena',
  'bila',
  'jika',
  'tanpa',
  'tentang',
  'usai',
  'luka',
  'bahagia',
  'jiwa',
  'raga',
  'langit',
  'abu',
  'teman',
  'hidup',
  'ruang',
  'cukup',
  'terlalu',
  'pergi',
  'hilang',
  'tunggu',
  'ingin',
  'mengapa',
  'kenapa',
  'semua',
  'dunia',
  'mimpi',
]);

const KPOP_ARTIST_KEYWORDS = [
  'illit',
  'newjeans',
  'jungkook',
  'bts',
  'blackpink',
  'aespa',
  'ive',
  'le sserafim',
  'twice',
  'seventeen',
  'stray kids',
  'exo',
  'nct',
  'enhypen',
  'txt',
  'babymonster',
  'kiss of life',
  'day6',
  'iu',
  'rosé',
  'jennie',
  'lisa',
  'jisoo',
  'zico',
  'bigbang',
  'red velvet',
  'itzy',
  'treasure',
  'riize',
  'boynextdoor',
  'stayc',
  'g-idle',
  '(g)i-dle',
];

const JPOP_ARTIST_KEYWORDS = [
  'yoasobi',
  'fujii kaze',
  'kenshi yonezu',
  'ado',
  'radwimps',
  'creepy nuts',
  'imase',
  'vaundy',
  'official hige dandism',
  'king gnu',
  'mrs. green apple',
];

/**
 * Detects the language/region of a track ('id' | 'ko' | 'ja' | 'en')
 * from its title, artist, album, and genre.
 */
export function detectTrackLanguage(
  track: Pick<Track, 'title' | 'artist' | 'album' | 'genre'>
): 'id' | 'ko' | 'ja' | 'en' {
  const combined = `${track.title} ${track.artist} ${track.album}`.toLowerCase();

  // Check Korean (Hangul characters, K-Pop genre, or K-Pop artists)
  if (
    track.genre === 'K-Pop' ||
    /[\uAC00-\uD7AF]/.test(combined) ||
    KPOP_ARTIST_KEYWORDS.some((k) => combined.includes(k))
  ) {
    return 'ko';
  }

  // Check Japanese (Hiragana/Katakana or J-Pop artists)
  if (/[\u3040-\u30FF]/.test(combined) || JPOP_ARTIST_KEYWORDS.some((k) => combined.includes(k))) {
    return 'ja';
  }

  // Check Indonesian (known Indonesian artists or Indonesian words in title/album)
  if (INDONESIAN_ARTIST_KEYWORDS.some((k) => combined.includes(k))) {
    return 'id';
  }

  const tokens = combined.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  const indoMatches = tokens.filter((w) => INDONESIAN_WORD_SET.has(w));
  if (indoMatches.length >= 1) {
    return 'id';
  }

  return 'en';
}

/**
 * Returns currently trending artist seeds matching the exact language AND genre of a track,
 * excluding the current track's primary artist so the auto-queue plays varied trending hits
 * in the same genre and language.
 */
export function getTrendingSeedArtistsForTrack(
  track: Pick<Track, 'title' | 'artist' | 'album' | 'genre'>
): string[] {
  const lang = detectTrackLanguage(track);
  const primaryArtist = track.artist.split(',')[0].split('&')[0].trim().toLowerCase();

  let pool: string[];

  if (lang === 'id') {
    switch (track.genre) {
      case 'Indie':
        pool = [
          'Bernadya',
          'Sal Priadi',
          'Hindia',
          'Nadin Amizah',
          'Juicy Luicy',
          'Fiersa Besari',
          'Fourtwnty',
          'Payung Teduh',
        ];
        break;
      case 'Chill':
        pool = [
          'Tulus',
          'Nadin Amizah',
          'Sal Priadi',
          'Kunto Aji',
          'Pamungkas',
          'Bernadya',
          'Ardhito Pramono',
        ];
        break;
      case 'Rock':
        pool = [
          'Sheila On 7',
          'For Revenge',
          'Dewa 19',
          'Noah',
          'Last Child',
          '.Feast',
          'Kotak',
        ];
        break;
      default:
        // Indonesian Pop Trending
        pool = [
          'Mahalini',
          'Tulus',
          'Juicy Luicy',
          'Lyodra',
          'Tiara Andini',
          'Rizky Febian',
          'Bernadya',
          'Yura Yunita',
          'Sal Priadi',
        ];
        break;
    }
  } else if (lang === 'ko') {
    pool = [
      'ILLIT',
      'NewJeans',
      'aespa',
      'BABYMONSTER',
      'JENNIE',
      'ROSÉ',
      'Jungkook',
      'LE SSERAFIM',
    ];
  } else if (lang === 'ja') {
    pool = ['YOASOBI', 'Fujii Kaze', 'Creepy Nuts', 'imase', 'Mrs. GREEN APPLE', 'Vaundy'];
  } else {
    switch (track.genre) {
      case 'Indie':
        pool = [
          'Wave to Earth',
          'beabadoobee',
          'Cigarettes After Sex',
          'Clairo',
          'd4vd',
          'Stephen Sanchez',
        ];
        break;
      case 'Chill':
        pool = [
          'Laufey',
          'Daniel Caesar',
          'keshi',
          'Joji',
          'Stephen Sanchez',
          'Bruno Major',
          'SZA',
        ];
        break;
      case 'Rock':
        pool = [
          'Arctic Monkeys',
          'Coldplay',
          'The Neighbourhood',
          'Tom Odell',
          'Linkin Park',
          'OneRepublic',
        ];
        break;
      default:
        // Global English Pop Trending
        pool = [
          'Bruno Mars',
          'Sabrina Carpenter',
          'Billie Eilish',
          'Lady Gaga',
          'Olivia Rodrigo',
          'Taylor Swift',
          'The Weeknd',
          'Ariana Grande',
        ];
        break;
    }
  }

  // Filter out the exact same artist first so the next songs are varied trending artists of the same genre/language
  const otherTrendingArtists = pool.filter((a) => !primaryArtist.includes(a.toLowerCase()));
  return otherTrendingArtists.length > 0 ? otherTrendingArtists : pool;
}

/**
 * Builds an immediate smart radio queue starting with `seedTrack`, followed by tracks
 * that match the same language and genre (prioritizing varied trending artists).
 */
export function buildImmediateSimilarQueue(
  seedTrack: Track,
  candidateTracks: Track[]
): Track[] {
  const targetLang = detectTrackLanguage(seedTrack);
  const seedArtist = seedTrack.artist.split(',')[0].trim().toLowerCase();

  const others = candidateTracks.filter(
    (t) =>
      t.id !== seedTrack.id &&
      !(
        t.title.toLowerCase() === seedTrack.title.toLowerCase() &&
        t.artist.toLowerCase() === seedTrack.artist.toLowerCase()
      )
  );

  // Tier 1: Same language AND same genre, different artist (varied trending)
  const tier1 = others.filter(
    (t) =>
      detectTrackLanguage(t) === targetLang &&
      t.genre === seedTrack.genre &&
      !t.artist.toLowerCase().includes(seedArtist)
  );

  // Tier 2: Same language AND same genre (including same artist)
  const tier2 = others.filter(
    (t) =>
      detectTrackLanguage(t) === targetLang &&
      t.genre === seedTrack.genre &&
      t.artist.toLowerCase().includes(seedArtist)
  );

  // Tier 3: Same language (any similar genre)
  const tier3 = others.filter(
    (t) => detectTrackLanguage(t) === targetLang && t.genre !== seedTrack.genre
  );

  // Tier 4: Same genre (fallback if candidate pool has very few same-language songs)
  const tier4 = others.filter(
    (t) => detectTrackLanguage(t) !== targetLang && t.genre === seedTrack.genre
  );

  const combined = [...tier1, ...tier2, ...tier3, ...tier4];
  const seen = new Set<string>([`${seedTrack.title.toLowerCase()}__${seedTrack.artist.toLowerCase()}`]);
  const deduped: Track[] = [seedTrack];

  for (const t of combined) {
    const key = `${t.title.toLowerCase()}__${t.artist.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(t);
    }
  }

  return deduped;
}
