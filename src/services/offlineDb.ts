import { OfflineTrackRecord, Playlist, Track } from '../types/music';
import { generateProceduralWavBlob, parseAudioFilename } from '../utils/musicLogic';
import { ARTWORK } from '../data/catalog';
import { resolveFullLengthAudioUrl } from './onlineApi';

const DB_NAME = 'MuseeOfflineDB';
const DB_VERSION = 1;
const STORE_TRACKS = 'tracks';
const STORE_PLAYLISTS = 'playlists';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PLAYLISTS)) {
        db.createObjectStore(STORE_PLAYLISTS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllOfflineTrackRecords(): Promise<OfflineTrackRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getOfflineTrackRecord(id: string): Promise<OfflineTrackRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function saveTrackOffline(track: Track, explicitBlob?: Blob): Promise<OfflineTrackRecord> {
  let audioBlob = explicitBlob;
  let resolvedUrl = track.audioUrl;

  if (!audioBlob && !resolvedUrl) {
    resolvedUrl = (await resolveFullLengthAudioUrl(track.title, track.artist)) || track.fallbackPreviewUrl;
  }

  if (!audioBlob && resolvedUrl) {
    try {
      const response = await fetch(resolvedUrl);
      if (response.ok) {
        audioBlob = await response.blob();
      }
    } catch {
      // Fallback to procedural harmonic WAV blob if network/CORS blocks fetch
    }
  }

  if (!audioBlob) {
    // Generate unique harmonic chord progression WAV based on track ID hash
    const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
    const baseFreq = freqs[hash % freqs.length];
    audioBlob = generateProceduralWavBlob(baseFreq, 16);
  }

  const updatedTrack: Track = {
    ...track,
    isOffline: true,
    sizeBytes: audioBlob.size,
  };

  const record: OfflineTrackRecord = {
    id: track.id,
    track: updatedTrack,
    audioBlob,
    savedAt: Date.now(),
    sizeBytes: audioBlob.size,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore IndexedDB write error in restricted private contexts
  }

  return record;
}

export async function removeTrackOffline(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
}

export async function clearAllOfflineTracks(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRACKS, 'readwrite');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore
  }
}

/**
 * Imports local MP3/M4A/WAV/FLAC File objects from iPhone directly into IndexedDB
 */
export async function importLocalAudioFiles(files: FileList | File[]): Promise<Track[]> {
  const fileArray = Array.from(files);
  const importedTracks: Track[] = [];

  for (const file of fileArray) {
    const { title, artist, album } = parseAudioFilename(file.name);
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // Probe audio duration if possible
    const duration = await new Promise<number>((resolve) => {
      try {
        const tempUrl = URL.createObjectURL(file);
        const audio = new Audio();
        const timer = setTimeout(() => {
          URL.revokeObjectURL(tempUrl);
          resolve(215);
        }, 2500);
        audio.onloadedmetadata = () => {
          clearTimeout(timer);
          URL.revokeObjectURL(tempUrl);
          resolve(Number.isFinite(audio.duration) && audio.duration > 0 ? Math.round(audio.duration) : 215);
        };
        audio.onerror = () => {
          clearTimeout(timer);
          URL.revokeObjectURL(tempUrl);
          resolve(215);
        };
        audio.src = tempUrl;
      } catch {
        resolve(215);
      }
    });

    const newTrack: Track = {
      id,
      title,
      artist,
      album,
      duration,
      coverUrl: ARTWORK.chillVibesMoon,
      genre: 'Indie',
      isOffline: true,
      isImported: true,
      sizeBytes: file.size,
      addedAt: Date.now(),
      lyrics: [
        { time: 0, text: `${title} — ${artist}` },
        { time: 10, text: 'Imported from your iPhone local storage' },
        { time: 25, text: 'Playing 100% offline via Musee IndexedDB Engine' },
        { time: 45, text: 'Enjoy lossless offline playback anytime, anywhere' },
      ],
    };

    await saveTrackOffline(newTrack, file);
    importedTracks.push(newTrack);
  }

  return importedTracks;
}

export async function saveCustomPlaylists(playlists: Playlist[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYLISTS, 'readwrite');
      const store = tx.objectStore(STORE_PLAYLISTS);
      for (const pl of playlists) {
        store.put(pl);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

export async function getStoredPlaylists(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PLAYLISTS, 'readonly');
      const store = tx.objectStore(STORE_PLAYLISTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}
