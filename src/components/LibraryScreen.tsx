import React, { useRef, useState } from 'react';
import {
  Plus,
  MoreVertical,
  FolderUp,
  ListPlus,
  X,
  CheckCircle2,
  Play,
  Music,
} from 'lucide-react';
import { LibraryFilter, Playlist, Track } from '../types/music';
import { ARTWORK } from '../data/catalog';

interface LibraryScreenProps {
  playlists: Playlist[];
  tracks: Track[];
  likedTrackIds: Set<string>;
  offlineTracks: Track[];
  onOpenPlaylist: (playlist: Playlist) => void;
  onPlayTrack: (track: Track) => void;
  onImportFiles: (files: FileList) => void;
  onCreatePlaylist: (title: string, subtitle: string) => void;
  onOpenTrackMenu: (track: Track) => void;
}

const LIBRARY_FILTERS: LibraryFilter[] = [
  'Playlists',
  'Songs',
  'Artists',
  'Albums',
  'Downloaded',
];

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  playlists,
  tracks,
  likedTrackIds,
  offlineTracks,
  onOpenPlaylist,
  onPlayTrack,
  onImportFiles,
  onCreatePlaylist,
  onOpenTrackMenu,
}) => {
  const [activeFilter, setActiveFilter] = useState<LibraryFilter>('Playlists');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
      setShowAddSheet(false);
      e.target.value = '';
    }
  };

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreatePlaylist(newTitle.trim(), newSubtitle.trim() || 'Custom Playlist');
    setNewTitle('');
    setNewSubtitle('');
    setShowCreateModal(false);
    setShowAddSheet(false);
  };

  // Virtual Liked Songs & Downloaded Offline playlists matching Screen 6
  const likedPlaylist: Playlist = {
    id: 'virtual-liked-songs',
    title: 'Liked Songs',
    subtitle: `${Math.max(320, likedTrackIds.size)} songs`,
    coverUrl: ARTWORK.dailyMixHeart,
    displayCount: Math.max(320, likedTrackIds.size),
    trackIds: tracks.filter((t) => likedTrackIds.has(t.id)).map((t) => t.id),
  };

  const downloadedPlaylist: Playlist = {
    id: 'virtual-downloaded-songs',
    title: 'Downloaded Offline',
    subtitle: `${offlineTracks.length} saved in IndexedDB`,
    coverUrl: ARTWORK.oceanBreeze,
    displayCount: offlineTracks.length,
    trackIds: offlineTracks.map((t) => t.id),
  };

  // Match exact 2-column grid cards from Screen 6 reference image
  const gridPlaylists: Playlist[] = [
    likedPlaylist,
    playlists.find((p) => p.id === 'playlist-chill-vibes') || playlists[1],
    {
      ...(playlists.find((p) => p.id === 'playlist-focus') || playlists[2]),
      coverUrl: ARTWORK.leavesArt, // Matches Screen 6 botanical leaves card for Focus
    },
    playlists.find((p) => p.id === 'playlist-workout') || playlists[3],
    playlists.find((p) => p.id === 'playlist-sunset-drive') || playlists[4],
    downloadedPlaylist,
    ...playlists.filter(
      (p) =>
        ![
          'playlist-daily-mix',
          'playlist-chill-vibes',
          'playlist-focus',
          'playlist-workout',
          'playlist-sunset-drive',
        ].includes(p.id)
    ),
  ];

  const uniqueArtists = Array.from(new Set(tracks.map((t) => t.artist)));
  const uniqueAlbums = Array.from(new Set(tracks.map((t) => t.album)));

  return (
    <div className="pb-40 pt-5 px-5 select-none">
      {/* Hidden File Input for iPhone Local MP3/M4A/WAV/FLAC Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.flac"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Import local audio files"
      />

      {/* Top Header: "Your Library" & "+" Action Button */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[24px] font-extrabold tracking-tight text-[#0F172A]">
          Your Library
        </h1>

        <button
          type="button"
          onClick={() => setShowAddSheet(true)}
          aria-label="Add local MP3 or create playlist"
          className="w-11 h-11 rounded-full bg-white/85 backdrop-blur-md border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Pills: Playlists, Songs, Artists, Albums, Downloaded */}
      <div
        role="tablist"
        aria-label="Library Filter"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-5"
      >
        {LIBRARY_FILTERS.map((filter) => {
          const active = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                active
                  ? 'bg-[#0F172A] text-white shadow-sm'
                  : 'bg-white/75 text-[#64748B] border border-white/90 hover:bg-white hover:text-[#0F172A]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* View 1: Playlists 2-Column Grid (Default matching Screen 6) */}
      {activeFilter === 'Playlists' && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[16px] font-bold text-[#0F172A]">Your Playlists</h2>
            <button
              type="button"
              onClick={() => setActiveFilter('Songs')}
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
            >
              See All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {gridPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => onOpenPlaylist(pl)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenPlaylist(pl);
                  }
                }}
                className="group rounded-[22px] p-2.5 bg-white/75 backdrop-blur-xl border border-white/90 shadow-[0_6px_18px_rgba(148,163,184,0.08)] hover:bg-white transition-all cursor-pointer"
              >
                <div className="aspect-square w-full rounded-[16px] overflow-hidden mb-2.5 shadow-xs">
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex items-start justify-between gap-1 px-0.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#0F172A] truncate">
                      {pl.title}
                    </p>
                    <p className="text-[11px] font-medium text-[#64748B] truncate mt-0.5 tabular-nums">
                      {pl.displayCount !== undefined
                        ? `${pl.displayCount} songs`
                        : pl.subtitle}
                    </p>
                  </div>
                  <MoreVertical className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* View 2: Songs or Downloaded Tracks */}
      {(activeFilter === 'Songs' || activeFilter === 'Downloaded') && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[16px] font-bold text-[#0F172A]">
              {activeFilter === 'Downloaded'
                ? `Offline Tracks (${offlineTracks.length})`
                : `All Songs (${tracks.length})`}
            </h2>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              + Import MP3
            </button>
          </div>

          {(activeFilter === 'Downloaded' ? offlineTracks : tracks).length === 0 ? (
            <div className="rounded-3xl bg-white/80 border border-white p-8 text-center">
              <Music className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">No Offline Songs Yet</p>
              <p className="text-xs text-[#64748B] mt-1 mb-4">
                Download any track or import MP3/M4A files from your iPhone.
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-full bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
              >
                Import MP3 from iPhone
              </button>
            </div>
          ) : (
            (activeFilter === 'Downloaded' ? offlineTracks : tracks).map((track) => (
              <div
                key={track.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/80 border border-white shadow-xs"
              >
                <div
                  onClick={() => onPlayTrack(track)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayTrack(track);
                    }
                  }}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[#0F172A] truncate">
                        {track.title}
                      </p>
                      {track.isOffline && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{track.artist}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenTrackMenu(track)}
                  aria-label={`Options for ${track.title}`}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#64748B] cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </section>
      )}

      {/* View 3: Artists or Albums */}
      {(activeFilter === 'Artists' || activeFilter === 'Albums') && (
        <section className="space-y-2.5">
          {(activeFilter === 'Artists' ? uniqueArtists : uniqueAlbums).map((item) => {
            const firstMatch = tracks.find((t) =>
              activeFilter === 'Artists' ? t.artist === item : t.album === item
            );
            return (
              <div
                key={item}
                onClick={() => firstMatch && onPlayTrack(firstMatch)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && firstMatch) {
                    e.preventDefault();
                    onPlayTrack(firstMatch);
                  }
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/80 border border-white cursor-pointer hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={firstMatch?.coverUrl || ARTWORK.chillVibesMoon}
                    alt={item}
                    className={`w-12 h-12 object-cover ${
                      activeFilter === 'Artists' ? 'rounded-full' : 'rounded-xl'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{item}</p>
                    <p className="text-xs text-[#64748B]">{activeFilter.slice(0, -1)}</p>
                  </div>
                </div>
                <Play className="w-4 h-4 text-[#0F172A]" />
              </div>
            );
          })}
        </section>
      )}

      {/* "+" Action Sheet: Import MP3 from iPhone OR Create New Playlist */}
      {showAddSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Library Actions"
        >
          <div className="w-full max-w-[430px] rounded-t-3xl bg-white/95 backdrop-blur-2xl border-t border-white p-6 pb-10 shadow-2xl">
            <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Add to Your Library</h3>
              <button
                type="button"
                onClick={() => setShowAddSheet(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 text-left transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FolderUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    Import MP3 / Audio from iPhone
                  </p>
                  <p className="text-xs text-[#64748B]">
                    Select .mp3, .m4a, .wav, or .flac files for 100% offline playback
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddSheet(false);
                  setShowCreateModal(true);
                }}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition-colors cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-[#0F172A] text-white flex items-center justify-center shrink-0">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">Create New Playlist</p>
                  <p className="text-xs text-[#64748B]">
                    Organize your favorite offline & online tracks
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Playlist Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Create New Playlist"
        >
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">New Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="playlist-title"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Playlist Title
                </label>
                <input
                  id="playlist-title"
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Late Night Study"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label
                  htmlFor="playlist-subtitle"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Subtitle / Mood
                </label>
                <input
                  id="playlist-subtitle"
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="e.g. Calm acoustic vibes"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
              >
                Create Playlist
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
