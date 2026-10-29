import React, { useState } from 'react';
import {
  Bell,
  Search,
  Play,
  Pause,
  MoreHorizontal,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';
import { GenreFilter, Playlist, Track, UserProfile } from '../types/music';
import { ARTWORK } from '../data/catalog';
import { filterTracksByGenreAndQuery } from '../utils/musicLogic';

interface HomeScreenProps {
  userProfile: UserProfile;
  tracks: Track[];
  playlists: Playlist[];
  currentTrack: Track;
  isPlaying: boolean;
  selectedGenre: GenreFilter;
  onSelectGenre: (genre: GenreFilter) => void;
  onPlayTrack: (track: Track) => void;
  onOpenFullPlayer: () => void;
  onOpenPlaylist: (playlist: Playlist) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenProfile: () => void;
  onOpenTrackMenu: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  downloadingTrackIds: Record<string, boolean>;
}

const GENRE_PILLS: GenreFilter[] = ['All', 'Pop', 'Indie', 'Chill', 'K-Pop', 'Rock'];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  tracks,
  playlists,
  currentTrack,
  isPlaying,
  selectedGenre,
  onSelectGenre,
  onPlayTrack,
  onOpenFullPlayer,
  onOpenPlaylist,
  onOpenSearch,
  onOpenProfile,
  onOpenTrackMenu,
  onDownloadTrack,
  downloadingTrackIds,
}) => {
  const [inlineSearch, setInlineSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredTracks = filterTracksByGenreAndQuery(tracks, selectedGenre, inlineSearch);
  const madeForYouPlaylists = playlists.slice(0, 3);

  return (
    <div className="pb-24 pt-3 px-5 select-none">
      {/* Header Row: Good Morning, Name 👋, Bell Icon, User Avatar */}
      <header className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-[11px] font-medium text-[#64748B]">Good Morning</p>
          <h1 className="text-[21px] font-extrabold tracking-tight text-[#0F172A] flex items-center gap-1.5 leading-tight">
            <span>{userProfile.name}</span>
            <span role="img" aria-label="waving hand">
              👋
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification Bell Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/90 flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-100 shadow-xl p-4 z-40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#0F172A]">Musee Updates</span>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] font-semibold text-blue-600"
                  >
                    Dismiss
                  </button>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  Offline Engine active! Tap the download icon on any track to save lossless audio directly to your iPhone IndexedDB storage.
                </p>
              </div>
            )}
          </div>

          {/* Circular User Avatar -> navigates to Profile */}
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Open User Profile"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* Search Trigger Bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={inlineSearch}
          onChange={(e) => setInlineSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inlineSearch.trim()) {
              onOpenSearch(inlineSearch.trim());
            }
          }}
          placeholder="Search songs, artists, or playlists..."
          aria-label="Search songs, artists, or playlists"
          className="w-full h-10 pl-10 pr-16 rounded-full bg-white/80 backdrop-blur-xl border border-white/90 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] shadow-[0_4px_14px_rgba(148,163,184,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {inlineSearch ? (
          <button
            type="button"
            onClick={() => onOpenSearch(inlineSearch)}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-[#0F172A] text-white text-[10px] font-semibold cursor-pointer"
          >
            Online
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            Explore
          </button>
        )}
      </div>

      {/* Hero Banner Card: "Music for a Brighter Day" */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#DBEAFE] via-[#E0E7FF] to-[#F3E8FF] border border-white/90 shadow-[0_10px_24px_rgba(147,197,253,0.25)] mb-3.5 h-[134px] flex items-center">
        <img
          src={ARTWORK.heroGirl}
          alt="Music for a Brighter Day"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-10 pl-4 pr-36 py-3 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-[17px] font-extrabold text-[#0F172A] leading-tight">
              Music for
              <br />a Brighter Day
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-[#475569]">
              Feel the good vibes, anytime, anywhere.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onPlayTrack(tracks[0]);
              onOpenFullPlayer();
            }}
            aria-label="Play Featured Track Satu Bulan"
            className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-md hover:bg-slate-800 active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying && currentTrack.id === tracks[0]?.id ? (
              <Pause className="w-3.5 h-3.5 fill-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div
        role="tablist"
        aria-label="Genre Filter"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 mb-3.5"
      >
        {GENRE_PILLS.map((genre) => {
          const active = selectedGenre === genre;
          return (
            <button
              key={genre}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectGenre(genre)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                active
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'bg-white/75 text-[#64748B] border border-white/90 hover:bg-white hover:text-[#0F172A]'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* "Made for You" Section */}
      <section className="mb-3.5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-bold text-[#0F172A]">Made for You</h2>
          <button
            type="button"
            onClick={() => onOpenPlaylist(playlists[1])}
            className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            See All
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {madeForYouPlaylists.map((pl, idx) => {
            const homeCover = idx === 1 ? ARTWORK.leavesArt : pl.coverUrl;
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => onOpenPlaylist(pl)}
                className="group text-left rounded-2xl p-1.5 bg-white/75 backdrop-blur-lg border border-white/90 shadow-xs hover:bg-white transition-all cursor-pointer"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden mb-1.5 shadow-xs">
                  <img
                    src={homeCover}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="text-[11px] font-bold text-[#0F172A] truncate px-0.5">
                  {pl.title}
                </p>
                <p className="text-[9.5px] font-medium text-[#64748B] truncate px-0.5">
                  {pl.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* "Recently Played" Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[15px] font-bold text-[#0F172A]">
            {selectedGenre === 'All' ? 'Recently Played' : `${selectedGenre} Tracks`}
          </h2>
          <button
            type="button"
            onClick={() => onSelectGenre('All')}
            className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            See All
          </button>
        </div>

        <div className="space-y-2">
          {filteredTracks.map((track) => {
            const isTrackPlaying = currentTrack.id === track.id && isPlaying;
            const isDownloading = !!downloadingTrackIds[track.id];

            return (
              <div
                key={track.id}
                className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-white/78 backdrop-blur-lg border border-white/90 shadow-[0_3px_10px_rgba(148,163,184,0.07)] hover:bg-white transition-all"
              >
                <div
                  onClick={() => {
                    onPlayTrack(track);
                    onOpenFullPlayer();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayTrack(track);
                      onOpenFullPlayer();
                    }
                  }}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                >
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-bold text-[#0F172A] truncate">
                        {track.title}
                      </p>
                      {track.isOffline && (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                          aria-label="Downloaded for offline"
                        />
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[#64748B] truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!track.isOffline && (
                    <button
                      type="button"
                      onClick={() => onDownloadTrack(track)}
                      disabled={isDownloading}
                      aria-label={`Download ${track.title} for offline`}
                      className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-blue-50 text-[#64748B] hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isDownloading ? (
                        <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onPlayTrack(track)}
                    aria-label={isTrackPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {isTrackPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-[#0F172A]" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-[#0F172A] ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenTrackMenu(track)}
                    aria-label={`More options for ${track.title}`}
                    className="w-8 h-8 rounded-full hover:bg-slate-100 text-[#64748B] flex items-center justify-center cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
