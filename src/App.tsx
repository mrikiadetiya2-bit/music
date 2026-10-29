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
  hydrateDefaultTracksAudio,
  resolveFullLengthAudioUrl,
} from './services/onlineApi';
import {
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
  const handleNextTrackRef = useRef<() => void>(() => {});

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
        const audioMap = new Map(hydrated.map((h) => [h.id, h.audioUrl]));
        setTracks((prev) =>
          prev.map((t) => (audioMap.get(t.id) ? { ...t, audioUrl: audioMap.get(t.id) } : t))
        );
        setQueue((prev) =>
          prev.map((t) => (audioMap.get(t.id) ? { ...t, audioUrl: audioMap.get(t.id) } : t))
        );
        setCurrentTrack((prev) =>
          audioMap.get(prev.id) ? { ...prev, audioUrl: audioMap.get(prev.id) } : prev
        );
      }
    }

    initApp();
    return () => {
      mounted = false;
    };
  }, []);

  // Resolve full-length audio source and play a specific track from 0:00 (intro)
  const loadAndPlayTrack = useCallback(
    async (track: Track, autoPlay = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      const requestId = ++playRequestIdRef.current;

      // Immediately pause previous playback and reset timer to 0:00 (beginning of track)
      audio.pause();
      audio.currentTime = 0;
      setCurrentTrack(track);
      const targetDuration = track.duration || 210;
      setDuration(targetDuration);
      durationRef.current = targetDuration;
      setCurrentTime(0);
      currentTimeRef.current = 0;

      // Update Listening History
      setHistoryTracks((prev) => [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 15));

      // Add to tracks catalog & queue if from online search
      setTracks((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));
      setQueue((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));

      if (activeObjectUrlRef.current) {
        URL.revokeObjectURL(activeObjectUrlRef.current);
        activeObjectUrlRef.current = null;
      }

      // 1. Offline-First Resolver: Check IndexedDB first!
      const offlineRecord = await getOfflineTrackRecord(track.id);
      if (requestId !== playRequestIdRef.current) return;

      if (offlineRecord?.audioBlob) {
        const blobUrl = URL.createObjectURL(offlineRecord.audioBlob);
        activeObjectUrlRef.current = blobUrl;
        audio.src = blobUrl;
      } else if (navigator.onLine) {
        // 2. Full-Length Audio Stream Resolver (JioSaavn -> Piped YouTube Music -> Internet Archive)
        let streamUrl = track.audioUrl;
        const isShortPreview =
          streamUrl && (streamUrl.includes('apple.com') || streamUrl.includes('dzcdn.net'));

        if (!streamUrl || isShortPreview) {
          const fullTrackUrl = await resolveFullLengthAudioUrl(track.title, track.artist);
          if (requestId !== playRequestIdRef.current) return;
          if (fullTrackUrl) {
            streamUrl = fullTrackUrl;
            // Persist resolved full-length URL onto track state
            setTracks((prev) =>
              prev.map((t) => (t.id === track.id ? { ...t, audioUrl: fullTrackUrl } : t))
            );
            setQueue((prev) =>
              prev.map((t) => (t.id === track.id ? { ...t, audioUrl: fullTrackUrl } : t))
            );
            setCurrentTrack((prev) =>
              prev.id === track.id ? { ...prev, audioUrl: fullTrackUrl } : prev
            );
          } else {
            // Only use fallbackPreviewUrl if all full-track engines fail
            streamUrl = streamUrl || track.fallbackPreviewUrl;
          }
        }

        if (streamUrl) {
          audio.src = streamUrl;
        } else {
          const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
          const wavBlob = generateProceduralWavBlob(freqs[hash % freqs.length], 24);
          const blobUrl = URL.createObjectURL(wavBlob);
          activeObjectUrlRef.current = blobUrl;
          audio.src = blobUrl;
        }
      } else {
        // 3. Offline procedural harmonic chord WAV fallback
        const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
        const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
        const wavBlob = generateProceduralWavBlob(freqs[hash % freqs.length], 24);
        const blobUrl = URL.createObjectURL(wavBlob);
        activeObjectUrlRef.current = blobUrl;
        audio.src = blobUrl;
      }

      audio.currentTime = 0;

      if (autoPlay) {
        try {
          await audio.play();
          if (requestId === playRequestIdRef.current) {
            setIsPlaying(true);
          }
        } catch {
          if (requestId !== playRequestIdRef.current) return;
          // If primary stream failed to play, try fallbackPreviewUrl before procedural WAV
          if (track.fallbackPreviewUrl && audio.src !== track.fallbackPreviewUrl) {
            try {
              audio.src = track.fallbackPreviewUrl;
              audio.currentTime = 0;
              await audio.play();
              if (requestId === playRequestIdRef.current) {
                setIsPlaying(true);
                return;
              }
            } catch {
              // Fall through to procedural WAV
            }
          }
          if (requestId !== playRequestIdRef.current) return;
          const hash = track.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
          const freqs = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0];
          const wavBlob = generateProceduralWavBlob(freqs[hash % freqs.length], 24);
          const blobUrl = URL.createObjectURL(wavBlob);
          activeObjectUrlRef.current = blobUrl;
          audio.src = blobUrl;
          audio.currentTime = 0;
          try {
            await audio.play();
            if (requestId === playRequestIdRef.current) {
              setIsPlaying(true);
            }
          } catch {
            if (requestId === playRequestIdRef.current) {
              setIsPlaying(false);
            }
          }
        }
      }
    },
    []
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
        await loadAndPlayTrack(currentTrack, true);
      } else {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          await loadAndPlayTrack(currentTrack, true);
        }
      }
    }
  }, [isPlaying, currentTrack, loadAndPlayTrack]);

  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (isRepeat) {
      loadAndPlayTrack(currentTrack, true);
      return;
    }
    if (isShuffle && queue.length > 1) {
      const others = queue.filter((t) => t.id !== currentTrack.id);
      const randomNext = others[Math.floor(Math.random() * others.length)];
      loadAndPlayTrack(randomNext, true);
      return;
    }
    const nextIdx = getNextTrackIndex(queue, currentTrack.id);
    const nextTrack = queue[nextIdx];
    if (nextTrack) {
      loadAndPlayTrack(nextTrack, true);
    }
  }, [queue, currentTrack, isRepeat, isShuffle, loadAndPlayTrack]);

  // Keep handleNextTrackRef always pointing to the latest closure!
  useEffect(() => {
    handleNextTrackRef.current = handleNextTrack;
  }, [handleNextTrack]);

  const handlePrevTrack = useCallback(() => {
    if (queue.length === 0) return;
    if (currentTime > 5 && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      currentTimeRef.current = 0;
      return;
    }
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx === -1 ? 0 : (idx - 1 + queue.length) % queue.length;
    loadAndPlayTrack(queue[prevIdx], true);
  }, [queue, currentTrack.id, currentTime, loadAndPlayTrack]);

  const handleSeek = useCallback((newTime: number) => {
    setCurrentTime(newTime);
    currentTimeRef.current = newTime;
    const audio = audioRef.current;
    if (audio && audio.src) {
      const safeAudioTime = computeAudioSeekTime(newTime, audio.duration);
      audio.currentTime = safeAudioTime;
    }
  }, []);

  // Initialize HTML5 Audio Element once and bind currentTime and duration dynamically via events
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      const nowAudio = audio.currentTime;
      if (durationRef.current > 0 && nowAudio >= durationRef.current) {
        handleNextTrackRef.current();
        return;
      }
      currentTimeRef.current = nowAudio;
      setCurrentTime(nowAudio);
    };

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 1) {
        // Dynamically bind seekbar max duration to actual audio.duration for single-song streams
        const realDuration = Math.round(audio.duration);
        if (realDuration >= 60 && realDuration <= 540) {
          durationRef.current = realDuration;
          setDuration(realDuration);
        }
      }
    };

    const handleEnded = () => {
      handleNextTrackRef.current();
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
                    onPlayTrack={(track) => loadAndPlayTrack(track, true)}
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
                    onPlayTrack={(track) => loadAndPlayTrack(track, true)}
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
