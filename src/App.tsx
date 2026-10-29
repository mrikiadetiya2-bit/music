/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ARTWORK,
  DEFAULT_USER_PROFILE,
  INITIAL_PLAYLISTS,
  INITIAL_TRACKS,
  VERIFIED_FULL_LENGTH_CATALOG,
} from './data/catalog';
import {
  GenreFilter,
  LyricLine,
  MainTab,
  Playlist,
  Track,
  UserProfile,
} from './types/music';
import {
  clearAllOfflineTracks,
  getAllOfflineTrackRecords,
  getOfflineTrackRecord,
  getStoredPlaylists,
  importLocalAudioFiles,
  removeTrackOffline,
  saveCustomPlaylists,
  saveTrackOffline,
} from './services/offlineDb';
import {
  fetchTrendingRadioQueue,
  getCachedFullLengthUrl,
  getVerifiedFullLengthFallbackUrl,
  hydrateDefaultTracksAudio,
  isShortPreviewUrl,
  resolveFullLengthAudioUrl,
} from './services/onlineApi';
import {
  buildImmediateSimilarQueue,
  computeAudioSeekTime,
  generateProceduralWavBlob,
  getNextTrackIndex,
} from './utils/musicLogic';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { FullPlayerModal } from './components/FullPlayerModal';
import { PlaylistDetailScreen } from './components/PlaylistDetailScreen';
import { SearchScreen } from './components/SearchScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { QueueAndLyricsSheet } from './components/QueueAndLyricsSheet';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNavBar } from './components/BottomNavBar';
import { TrackActionSheet } from './components/TrackActionSheet';
import { WifiOff, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Check onboarding state or ?autostart=1 query param
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') return false;
    return localStorage.getItem('musee_onboarded') !== '1';
  });

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [showQueueAndLyrics, setShowQueueAndLyrics] = useState(false);
  const [searchQueryTrigger, setSearchQueryTrigger] = useState('');

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('musee_profile');
      return saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  // Catalog & Offline state
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [downloadingTrackIds, setDownloadingTrackIds] = useState<Record<string, boolean>>({});
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(
    () => new Set(['track-satu-bulan', 'track-die-with-a-smile', 'track-until-i-found-you'])
  );

  // Playback & Queue state
  const [currentTrack, setCurrentTrack] = useState<Track>(INITIAL_TRACKS[0]);
  const [queue, setQueue] = useState<Track[]>(INITIAL_TRACKS);
  const [historyTracks, setHistoryTracks] = useState<Track[]>(INITIAL_TRACKS.slice(0, 4));
  const [isPlaying, setIsPlaying] = useState(false);
  // Start at 0:00 (beginning of the song)
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(INITIAL_TRACKS[0].duration);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('All');

  // Action sheet & Toast feedback
  const [menuTrack, setMenuTrack] = useState<Track | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeObjectUrlRef = useRef<string | null>(null);
  const playRequestIdRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(INITIAL_TRACKS[0].duration);
  const lastAudioTimeRef = useRef<number>(0);
  const lastAdvanceTimeRef = useRef<number>(0);
  const handleNextTrackRef = useRef<() => void>(() => {});
  const tracksRef = useRef<Track[]>(INITIAL_TRACKS);
  const currentTrackRef = useRef<Track>(INITIAL_TRACKS[0]);
  const queueRef = useRef<Track[]>(INITIAL_TRACKS);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Load offline tracks & pre-load working full-length audio on startup
  useEffect(() => {
    let mounted = true;

    async function initApp() {
      const records = await getAllOfflineTrackRecords();
      const storedPlaylists = await getStoredPlaylists();

      const savedIds = new Set(records.map((r) => r.id));
      const offlineTracksMap = new Map(records.map((r) => [r.id, r.track]));

      if (!mounted) return;
      setOfflineTrackIds(savedIds);

      const mergedInitial = INITIAL_TRACKS.map((t) =>
        savedIds.has(t.id)
          ? { ...t, isOffline: true, sizeBytes: offlineTracksMap.get(t.id)?.sizeBytes }
          : t
      );
      const customImported = records
        .map((r) => r.track)
        .filter((t) => !INITIAL_TRACKS.some((init) => init.id === t.id));

      const allCombined = [...customImported, ...mergedInitial];
      setTracks(allCombined);
      setQueue(allCombined);
      queueRef.current = allCombined;
      if (savedIds.has(INITIAL_TRACKS[0].id)) {
        setCurrentTrack((prev) => ({ ...prev, isOffline: true }));
      }

      if (storedPlaylists.length > 0) {
        setPlaylists((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...storedPlaylists.filter((p) => !existingIds.has(p.id))];
        });
      }

      // Pre-load full-length audio URLs for default tracks
      const hydrated = await hydrateDefaultTracksAudio(allCombined);
      if (mounted) {
        const hydratedMap = new Map(hydrated.map((h) => [h.id, h]));
        setTracks((prev) =>
          prev.map((t) => {
            const h = hydratedMap.get(t.id);
            return h ? { ...t, audioUrl: h.audioUrl || t.audioUrl } : t;
          })
        );
        setQueue((prev) =>
          prev.map((t) => {
            const h = hydratedMap.get(t.id);
            return h ? { ...t, audioUrl: h.audioUrl || t.audioUrl } : t;
          })
        );
        setCurrentTrack((prev) => {
          const h = hydratedMap.get(prev.id);
          return h ? { ...prev, audioUrl: h.audioUrl || prev.audioUrl } : prev;
        });
      }
    }

    initApp();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper that plays the audio element and retries once when cross-origin full-length stream finishes buffering
  const playAudioWithCanPlayRetry = useCallback(
    async (audio: HTMLAudioElement, requestId: number): Promise<boolean> => {
      try {
        await audio.play();
        return true;
      } catch {
        if (requestId !== playRequestIdRef.current) return false;
        return new Promise<boolean>((resolve) => {
          let settled = false;
          const finish = (ok: boolean) => {
            if (settled) return;
            settled = true;
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            clearTimeout(timer);
            resolve(ok);
          };
          const onCanPlay = async () => {
            if (requestId !== playRequestIdRef.current) {
              finish(false);
              return;
            }
            try {
              await audio.play();
              finish(true);
            } catch {
              finish(false);
            }
          };
          const onError = () => finish(false);
          const timer = setTimeout(() => finish(false), 3500);
          audio.addEventListener('canplay', onCanPlay, { once: true });
          audio.addEventListener('error', onError, { once: true });
        });
      }
    },
    []
  );

  // Instant, full-length playback handler that always plays from 0:00 intro to the end
  const loadAndPlayTrack = useCallback(
    async (track: Track, autoPlay = true, fromSearch = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      const requestId = ++playRequestIdRef.current;

      // Immediately pause previous playback and reset timer to 0:00 (beginning of track)
      audio.pause();
      lastAudioTimeRef.current = 0;
      currentTrackRef.current = track;
      setCurrentTrack(track);
      const targetDuration = track.duration && track.duration >= 60 ? track.duration : 210;
      setDuration(targetDuration);
      durationRef.current = targetDuration;
      setCurrentTime(0);
      currentTimeRef.current = 0;

      // Update Listening History
      setHistoryTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 15));

      // Add to tracks catalog
      setTracks((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));

      if (fromSearch) {
        // Immediately build queue from verified full-length catalog matching the searched track's language & genre
        const immediateQueue = buildImmediateSimilarQueue(track, [
          ...VERIFIED_FULL_LENGTH_CATALOG,
          ...tracksRef.current,
          ...queueRef.current,
        ]);
        queueRef.current = immediateQueue;
        setQueue(immediateQueue);

        // In the background, fetch varied trending full-length songs of the exact same language & genre
        if (navigator.onLine) {
          fetchTrendingRadioQueue(track, tracksRef.current)
            .then((trendingQueue) => {
              if (requestId !== playRequestIdRef.current || trendingQueue.length === 0) return;
              queueRef.current = trendingQueue;
              setQueue(trendingQueue);
              setTracks((prev) => {
                const existingIds = new Set(prev.map((t) => t.id));
                const newTrending = trendingQueue.filter((t) => !existingIds.has(t.id));
                return newTrending.length > 0 ? [...prev, ...newTrending] : prev;
              });
            })
            .catch(() => {});
        }
      } else {
        setQueue((prev) => {
          const updated = prev.some((t) => t.id === track.id) ? prev : [track, ...prev];
          queueRef.current = updated;
          return updated;
        });
      }

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }

      const playProceduralFallback = async () => {
        if (requestId !== playRequestIdRef.current) return;
        audio.muted = false;
        const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
        const wavBlob = generateProceduralWavBlob(freqs[hash % freqs.length], 24);
        const blobUrl = URL.createObjectURL(wavBlob);
        activeObjectUrlRef.current = blobUrl;
        audio.src = blobUrl;
        lastAudioTimeRef.current = 0;
        if (autoPlay) {
          try {
            await audio.play();
            if (requestId === playRequestIdRef.current) setIsPlaying(true);
          } catch {
            if (requestId === playRequestIdRef.current) setIsPlaying(false);
          }
        }
      };

      // 1. Check if track is already saved offline in IndexedDB
      if (track.isOffline || offlineTrackIds.has(track.id)) {
        const offlineRecord = await getOfflineTrackRecord(track.id);
        if (requestId !== playRequestIdRef.current) return;
        if (offlineRecord?.audioBlob) {
          audio.muted = false;
          const blobUrl = URL.createObjectURL(offlineRecord.audioBlob);
          activeObjectUrlRef.current = blobUrl;
          audio.src = blobUrl;
          lastAudioTimeRef.current = 0;
          if (autoPlay) {
            const ok = await playAudioWithCanPlayRetry(audio, requestId);
            if (ok && requestId === playRequestIdRef.current) {
              setIsPlaying(true);
              return;
            }
          } else {
            return;
          }
        }
      }

      // 2. Online Playback: ALWAYS resolve and play a FULL-LENGTH stream starting from 0:00 (never a 30s chorus preview)
      if (navigator.onLine) {
        const cachedFull = getCachedFullLengthUrl(track.title, track.artist);
        const existingFull =
          track.audioUrl && !isShortPreviewUrl(track.audioUrl) ? track.audioUrl : undefined;
        let fullUrl = cachedFull || existingFull;

        if (!fullUrl) {
          const resolved = await resolveFullLengthAudioUrl(track.title, track.artist);
          if (requestId !== playRequestIdRef.current) return;
          if (resolved) {
            fullUrl = resolved;
          }
        }

        if (!fullUrl) {
          fullUrl = getVerifiedFullLengthFallbackUrl(track.title, track.artist);
        }

        // Persist the resolved full-length stream on the track object in state and refs
        setTracks((prev) =>
          prev.map((t) => (t.id === track.id ? { ...t, audioUrl: fullUrl } : t))
        );
        setQueue((prev) => {
          const updated = prev.map((t) => (t.id === track.id ? { ...t, audioUrl: fullUrl } : t));
          queueRef.current = updated;
          return updated;
        });
        setCurrentTrack((prev) => (prev.id === track.id ? { ...prev, audioUrl: fullUrl } : prev));

        // Pre-resolve the next 2 tracks in queue in the background so auto-advance has 0ms wait
        const nextIdx1 = getNextTrackIndex(queueRef.current, track.id);
        const nextTrack1 = queueRef.current[nextIdx1];
        if (nextTrack1 && nextTrack1.id !== track.id) {
          resolveFullLengthAudioUrl(nextTrack1.title, nextTrack1.artist).catch(() => {});
        }

        audio.muted = false;
        audio.src = fullUrl;
        lastAudioTimeRef.current = 0;
        setCurrentTime(0);
        currentTimeRef.current = 0;

        if (autoPlay) {
          const playedPrimary = await playAudioWithCanPlayRetry(audio, requestId);
          if (requestId !== playRequestIdRef.current) return;
          if (playedPrimary) {
            setIsPlaying(true);
            return;
          }

          // If the primary Archive.org/Saavn CDN node timed out, try a verified full-length fallback track
          const backupFullUrl = getVerifiedFullLengthFallbackUrl(track.title, track.artist);
          if (backupFullUrl && backupFullUrl !== fullUrl) {
            audio.muted = false;
            audio.src = backupFullUrl;
            lastAudioTimeRef.current = 0;
            setCurrentTime(0);
            currentTimeRef.current = 0;
            const playedBackup = await playAudioWithCanPlayRetry(audio, requestId);
            if (requestId !== playRequestIdRef.current) return;
            if (playedBackup) {
              setIsPlaying(true);
              return;
            }
          }

          await playProceduralFallback();
          return;
        }
        return;
      }

      // 3. Offline procedural harmonic chord WAV fallback
      await playProceduralFallback();
    },
    [offlineTrackIds, playAudioWithCanPlayRetry]
  );

  // Toggle Play/Pause on current track
  const handleTogglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (!audio.src) {
        await loadAndPlayTrack(currentTrackRef.current, true);
      } else {
        try {
          audio.muted = false;
          await audio.play();
          setIsPlaying(true);
        } catch {
          await loadAndPlayTrack(currentTrackRef.current, true);
        }
      }
    }
  }, [isPlaying, loadAndPlayTrack]);

  const handleNextTrack = useCallback(() => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;
    if (activeQueue.length === 0) return;

    if (isRepeat) {
      loadAndPlayTrack(activeTrack, true);
      return;
    }
    if (isShuffle && activeQueue.length > 1) {
      const others = activeQueue.filter((t) => t.id !== activeTrack.id);
      const randomNext = others[Math.floor(Math.random() * others.length)];
      loadAndPlayTrack(randomNext, true);
      return;
    }
    const nextIdx = getNextTrackIndex(activeQueue, activeTrack.id);
    const nextTrack = activeQueue[nextIdx];
    if (nextTrack) {
      loadAndPlayTrack(nextTrack, true);
    }
  }, [isRepeat, isShuffle, loadAndPlayTrack]);

  // Keep handleNextTrackRef always pointing to the latest closure!
  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  const handlePrevTrack = useCallback(() => {
    const activeQueue = queueRef.current;
    const activeTrack = currentTrackRef.current;
    if (activeQueue.length === 0) return;
    if (currentTime > 5 && audioRef.current) {
      audioRef.current.currentTime = 0;
      lastAudioTimeRef.current = 0;
      setCurrentTime(0);
      currentTimeRef.current = 0;
      return;
    }
    const idx = activeQueue.findIndex((t) => t.id === activeTrack.id);
    const prevIdx = idx === -1 ? 0 : (idx - 1 + activeQueue.length) % activeQueue.length;
    loadAndPlayTrack(activeQueue[prevIdx], true);
  }, [currentTime, loadAndPlayTrack]);

  const handleSeek = useCallback((newTime: number) => {
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
    const audio = audioRef.current;
    if (audio && audio.src) {
      const safeAudioTime = computeAudioSeekTime(newTime, audio.duration);
      lastAudioTimeRef.current = safeAudioTime;
      audio.currentTime = safeAudioTime;
    }
  }, []);

  // Initialize HTML5 Audio Element once and bind real full-length playback position
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const triggerSafeAutoAdvance = () => {
      const now = Date.now();
      if (now - lastAdvanceTimeRef.current < 1200) return;
      lastAdvanceTimeRef.current = now;
      handleNextTrackRef.current();
    };

    const handleTimeUpdate = () => {
      if (audio.muted) return;
      const nowAudio = audio.currentTime;
      if (!Number.isFinite(nowAudio) || nowAudio < 0) return;
      lastAudioTimeRef.current = nowAudio;

      // Only force early track transition when playing a multi-song album file (>540s)
      // that has reached the first track's duration; single-song streams finish via `ended`.
      if (
        durationRef.current > 0 &&
        nowAudio >= durationRef.current &&
        Number.isFinite(audio.duration) &&
        audio.duration > 540
      ) {
        triggerSafeAutoAdvance();
        return;
      }
      currentTimeRef.current = nowAudio;
      setCurrentTime(nowAudio);
    };

    const handleLoadedMetadata = () => {
      if (audio.muted) return;
      if (Number.isFinite(audio.duration) && audio.duration > 1) {
        const realDuration = Math.round(audio.duration);
        // Sync duration to actual playable full-length song duration (60s - 540s),
        // while keeping track.duration for multi-song album files (>540s)
        if (realDuration >= 60 && realDuration <= 540) {
          durationRef.current = realDuration;
          setDuration(realDuration);
        }
      }
    };

    const handleEnded = () => {
      if (audio.muted) return;
      triggerSafeAutoAdvance();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
      }
    };
  }, []);


  // Configure iOS Lock Screen & Dynamic Island MediaSession API
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album,
        artwork: [
          { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        handleTogglePlay();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        handleTogglePlay();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        handlePrevTrack();
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        handleNextTrack();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          handleSeek(details.seekTime);
        }
      });
    } catch {
      // Ignore unsupported MediaSession properties
    }
  }, [currentTrack, handleTogglePlay, handlePrevTrack, handleNextTrack, handleSeek]);

  // Download single track into IndexedDB for offline playback
  const handleDownloadOffline = useCallback(
    async (track: Track) => {
      if (downloadingTrackIds[track.id]) return;
      setDownloadingTrackIds((prev) => ({ ...prev, [track.id]: true }));

      try {
        const record = await saveTrackOffline(track);
        setOfflineTrackIds((prev) => new Set(prev).add(track.id));
        setTracks((prev) => {
          const exists = prev.some((t) => t.id === track.id);
          if (!exists) return [record.track, ...prev];
          return prev.map((t) =>
            t.id === track.id ? { ...t, isOffline: true, sizeBytes: record.sizeBytes } : t
          );
        });
        if (currentTrack.id === track.id) {
          setCurrentTrack((prev) => ({
            ...prev,
            isOffline: true,
            sizeBytes: record.sizeBytes,
          }));
        }
        showToast(`Saved "${track.title}" to Offline IndexedDB ✓`);
      } finally {
        setDownloadingTrackIds((prev) => ({ ...prev, [track.id]: false }));
      }
    },
    [downloadingTrackIds, currentTrack.id, showToast]
  );

  // Download all tracks in a playlist or catalog
  const handleDownloadBatch = useCallback(
    async (batch: Track[]) => {
      const pending = batch.filter((t) => !t.isOffline && !offlineTrackIds.has(t.id));
      if (pending.length === 0) {
        showToast('All tracks in this list are already saved offline ✓');
        return;
      }
      showToast(`Downloading ${pending.length} songs for offline playback...`);
      for (const t of pending) {
        await handleDownloadOffline(t);
      }
      showToast(`All ${batch.length} songs saved to iPhone IndexedDB ✓`);
    },
    [offlineTrackIds, handleDownloadOffline, showToast]
  );

  // Remove track from IndexedDB offline storage
  const handleRemoveOfflineTrack = useCallback(
    async (trackId: string) => {
      await removeTrackOffline(trackId);
      setOfflineTrackIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, isOffline: false } : t))
      );
      if (currentTrack.id === trackId) {
        setCurrentTrack((prev) => ({ ...prev, isOffline: false }));
      }
      showToast('Removed track from Offline Storage');
    },
    [currentTrack.id, showToast]
  );

  const handleClearAllOffline = useCallback(async () => {
    await clearAllOfflineTracks();
    setOfflineTrackIds(new Set());
    setTracks((prev) => prev.map((t) => ({ ...t, isOffline: false })));
    setCurrentTrack((prev) => ({ ...prev, isOffline: false }));
    showToast('Cleared all offline audio cache');
  }, [showToast]);

  // Import local MP3/M4A/WAV/FLAC files from iPhone
  const handleImportLocalFiles = useCallback(
    async (files: FileList) => {
      showToast(`Importing ${files.length} audio file(s) into IndexedDB...`);
      const imported = await importLocalAudioFiles(files);
      if (imported.length > 0) {
        setOfflineTrackIds((prev) => {
          const next = new Set(prev);
          imported.forEach((t) => next.add(t.id));
          return next;
        });
        setTracks((prev) => [...imported, ...prev]);
        setQueue((prev) => [...imported, ...prev]);
        loadAndPlayTrack(imported[0], true);
        showToast(`Imported ${imported.length} track(s) for 100% offline playback ✓`);
      }
    },
    [loadAndPlayTrack, showToast]
  );

  // Toggle Like + Auto-Download if enabled in user settings
  const handleToggleLike = useCallback(
    (trackId: string) => {
      setLikedTrackIds((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
          showToast('Removed from Liked Songs');
        } else {
          next.add(trackId);
          showToast('Added to Liked Songs ♥');
          const target = tracks.find((t) => t.id === trackId);
          if (target && userProfile.autoDownloadLikes && !target.isOffline) {
            handleDownloadOffline(target);
          }
        }
        return next;
      });
    },
    [tracks, userProfile.autoDownloadLikes, handleDownloadOffline, showToast]
  );

  const handleCreatePlaylist = useCallback(
    async (title: string, subtitle: string) => {
      const newPl: Playlist = {
        id: `playlist-custom-${Date.now()}`,
        title,
        subtitle,
        coverUrl: ARTWORK.chillVibesMoon,
        displayCount: 2,
        trackIds: [INITIAL_TRACKS[0].id, INITIAL_TRACKS[1].id],
      };
      const updated = [...playlists, newPl];
      setPlaylists(updated);
      await saveCustomPlaylists([newPl]);
      showToast(`Created playlist "${title}"`);
    },
    [playlists, showToast]
  );

  const handleAddToPlaylist = useCallback(
    (playlistId: string, trackId: string) => {
      setPlaylists((prev) =>
        prev.map((pl) => {
          if (pl.id !== playlistId) return pl;
          if (pl.trackIds.includes(trackId)) return pl;
          return {
            ...pl,
            trackIds: [...pl.trackIds, trackId],
            displayCount: (pl.displayCount || pl.trackIds.length) + 1,
          };
        })
      );
      const plName = playlists.find((p) => p.id === playlistId)?.title || 'Playlist';
      showToast(`Added to ${plName}`);
    },
    [playlists, showToast]
  );

  const handleUpdateProfile = useCallback(
    (updated: UserProfile) => {
      setUserProfile(updated);
      try {
        localStorage.setItem('musee_profile', JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      showToast('Profile updated');
    },
    [showToast]
  );

  const handleGetStarted = useCallback(() => {
    try {
      localStorage.setItem('musee_onboarded', '1');
    } catch {
      // Ignore
    }
    setShowOnboarding(false);
  }, []);

  const handleUpdateTrackLyrics = useCallback((trackId: string, lyrics: LyricLine[]) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, lyrics } : t)));
    setCurrentTrack((prev) => (prev.id === trackId ? { ...prev, lyrics } : prev));
  }, []);

  const offlineTracksList = tracks.filter(
    (t) => t.isOffline || offlineTrackIds.has(t.id)
  );

  // Resolve tracks for the active Playlist Detail view
  const playlistDetailTracks = selectedPlaylist
    ? selectedPlaylist.trackIds
        .map((id) => tracks.find((t) => t.id === id))
        .filter((t): t is Track => Boolean(t))
    : [];

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#E2E8F0] via-[#EEF2FF] to-[#E0E7FF] flex justify-center items-start">
      {/* Main iPhone Mobile-First Container (max-width: 430px centered on desktop, 100vw/100dvh on mobile) */}
      <main className="relative w-full max-w-[430px] min-h-[100dvh] bg-gradient-to-b from-[#F8FAFC] via-[#EEF2FF] to-[#E5E9F8] shadow-[0_20px_70px_rgba(15,23,42,0.14)] overflow-x-hidden">
        {/* Ambient Iridescent Pastel Blobs inside iPhone Canvas */}
        <div className="pointer-events-none fixed top-10 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-full overflow-hidden z-0">
          <div className="absolute -top-12 -left-12 w-60 h-60 rounded-full bg-[#BAE6FD]/40 blur-3xl" />
          <div className="absolute top-1/3 -right-16 w-64 h-64 rounded-full bg-[#E9D5FF]/45 blur-3xl" />
          <div className="absolute bottom-24 left-6 w-56 h-56 rounded-full bg-[#FBCFE8]/35 blur-3xl" />
        </div>

        {/* Non-Intrusive Offline Mode Indicator */}
        {!isOnline && (
          <div className="relative z-40 mx-4 mt-2 px-3.5 py-2 rounded-2xl bg-amber-500/95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md">
            <WifiOff className="w-3.5 h-3.5 shrink-0" />
            <span>Offline Mode — Playing from iPhone IndexedDB</span>
          </div>
        )}

        {/* Floating Feedback Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[390px] px-4 py-2.5 rounded-full bg-[#0F172A]/95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xl backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
        )}

        {/* Screen 1: Onboarding / Welcome Screen */}
        {showOnboarding ? (
          <OnboardingScreen
            userProfile={userProfile}
            onGetStarted={handleGetStarted}
            onUpdateProfile={handleUpdateProfile}
          />
        ) : (
          <div className="relative z-10">
            {/* Screen 4: Playlist Detail View (when a playlist is open) */}
            {selectedPlaylist ? (
              <PlaylistDetailScreen
                playlist={selectedPlaylist}
                tracks={
                  playlistDetailTracks.length > 0 ? playlistDetailTracks : tracks
                }
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onBack={() => setSelectedPlaylist(null)}
                onPlayTrack={(track) => loadAndPlayTrack(track, true)}
                onPlayAll={(list, shuffle) => {
                  if (list.length === 0) return;
                  setQueue(list);
                  setIsShuffle(Boolean(shuffle));
                  const first = shuffle
                    ? list[Math.floor(Math.random() * list.length)]
                    : list[0];
                  loadAndPlayTrack(first, true);
                }}
                onDownloadAll={handleDownloadBatch}
                onOpenTrackMenu={(track) => setMenuTrack(track)}
                downloadingTrackIds={downloadingTrackIds}
              />
            ) : (
              <>
                {/* Screen 2: Home Screen */}
                {activeTab === 'home' && (
                  <HomeScreen
                    userProfile={userProfile}
                    tracks={tracks}
                    playlists={playlists}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    selectedGenre={selectedGenre}
                    onSelectGenre={setSelectedGenre}
                    onPlayTrack={(track, isFromSearch) =>
                      loadAndPlayTrack(track, true, Boolean(isFromSearch))
                    }
                    onOpenFullPlayer={() => setShowFullPlayer(true)}
                    onOpenPlaylist={(pl) => setSelectedPlaylist(pl)}
                    onOpenSearch={(q) => {
                      setSearchQueryTrigger(q || '');
                      setActiveTab('search');
                    }}
                    onOpenProfile={() => setActiveTab('profile')}
                    onOpenTrackMenu={(track) => setMenuTrack(track)}
                    onDownloadTrack={handleDownloadOffline}
                    downloadingTrackIds={downloadingTrackIds}
                  />
                )}

                {/* Screen 5: Search Screen */}
                {activeTab === 'search' && (
                  <SearchScreen
                    initialQuery={searchQueryTrigger}
                    localTracks={tracks}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    offlineTrackIds={offlineTrackIds}
                    downloadingTrackIds={downloadingTrackIds}
                    onPlayTrack={(track) => loadAndPlayTrack(track, true, true)}
                    onDownloadTrack={handleDownloadOffline}
                    onOpenTrackMenu={(track) => setMenuTrack(track)}
                  />
                )}

                {/* Screen 6: Your Library Screen */}
                {activeTab === 'library' && (
                  <LibraryScreen
                    playlists={playlists}
                    tracks={tracks}
                    likedTrackIds={likedTrackIds}
                    offlineTracks={offlineTracksList}
                    onOpenPlaylist={(pl) => setSelectedPlaylist(pl)}
                    onPlayTrack={(track) => loadAndPlayTrack(track, true)}
                    onImportFiles={handleImportLocalFiles}
                    onCreatePlaylist={handleCreatePlaylist}
                    onOpenTrackMenu={(track) => setMenuTrack(track)}
                  />
                )}

                {/* Screen 8: Profile & Offline Manager Screen */}
                {activeTab === 'profile' && (
                  <ProfileScreen
                    userProfile={userProfile}
                    offlineTracks={offlineTracksList}
                    historyTracks={historyTracks}
                    allTracks={tracks}
                    onUpdateProfile={handleUpdateProfile}
                    onPlayTrack={(track) => loadAndPlayTrack(track, true)}
                    onRemoveOfflineTrack={handleRemoveOfflineTrack}
                    onClearAllOffline={handleClearAllOffline}
                    onDownloadAllCatalog={() => handleDownloadBatch(tracks)}
                    onImportFiles={handleImportLocalFiles}
                  />
                )}
              </>
            )}

            {/* Persistent Floating Frosted Bottom Navigation Bar with Center Play/Pause Orb */}
            <BottomNavBar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setSelectedPlaylist(null);
                setActiveTab(tab);
              }}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTogglePlay={handleTogglePlay}
              onOpenFullPlayer={() => setShowFullPlayer(true)}
            />
          </div>
        )}

        {/* Screen 3: Full Music Player (Slide-Up Modal) */}
        {showFullPlayer && (
          <FullPlayerModal
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            isLiked={likedTrackIds.has(currentTrack.id)}
            isShuffle={isShuffle}
            isRepeat={isRepeat}
            isDownloading={!!downloadingTrackIds[currentTrack.id]}
            onClose={() => setShowFullPlayer(false)}
            onTogglePlay={handleTogglePlay}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onSeek={handleSeek}
            onToggleLike={handleToggleLike}
            onToggleShuffle={() => setIsShuffle((prev) => !prev)}
            onToggleRepeat={() => setIsRepeat((prev) => !prev)}
            onDownloadOffline={handleDownloadOffline}
            onOpenQueueAndLyrics={() => setShowQueueAndLyrics(true)}
            onOpenTrackMenu={(track) => setMenuTrack(track)}
            onShareTrack={(track) => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href).catch(() => {});
              }
              showToast(`Copied link to "${track.title}"`);
            }}
          />
        )}

        {/* Screen 7: Playing Next & Full Lyrics Sheet */}
        {showQueueAndLyrics && (
          <QueueAndLyricsSheet
            currentTrack={currentTrack}
            queue={queue}
            currentTime={currentTime}
            onClose={() => setShowQueueAndLyrics(false)}
            onPlayTrack={(track) => loadAndPlayTrack(track, true)}
            onRemoveFromQueue={(trackId) => {
              setQueue((prev) => prev.filter((t) => t.id !== trackId));
              showToast('Removed from queue');
            }}
            onSeekToLyric={(time) => handleSeek(time)}
            onUpdateTrackLyrics={handleUpdateTrackLyrics}
          />
        )}

        {/* Universal ••• Track Action Sheet */}
        <TrackActionSheet
          track={menuTrack}
          isLiked={menuTrack ? likedTrackIds.has(menuTrack.id) : false}
          playlists={playlists}
          onClose={() => setMenuTrack(null)}
          onPlayTrack={(track) => loadAndPlayTrack(track, true)}
          onDownloadOffline={handleDownloadOffline}
          onRemoveOffline={handleRemoveOfflineTrack}
          onToggleLike={handleToggleLike}
          onAddToQueue={(track) => {
            setQueue((prev) =>
              prev.some((t) => t.id === track.id) ? prev : [...prev, track]
            );
            showToast(`Added "${track.title}" to Playing Next`);
          }}
          onAddToPlaylist={handleAddToPlaylist}
          onOpenLyrics={(track) => {
            setCurrentTrack(track);
            setShowQueueAndLyrics(true);
          }}
        />
      </main>
    </div>
  );
}
