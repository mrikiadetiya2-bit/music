import React from 'react';
import {
  ChevronLeft,
  MoreHorizontal,
  Play,
  Shuffle,
  CheckCircle2,
  Download,
  Sparkles,
} from 'lucide-react';
import { Playlist, Track } from '../types/music';

interface PlaylistDetailScreenProps {
  playlist: Playlist;
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], shuffle?: boolean) => void;
  onDownloadAll: (tracks: Track[]) => void;
  onOpenTrackMenu: (track: Track) => void;
  downloadingTrackIds: Record<string, boolean>;
}

export const PlaylistDetailScreen: React.FC<PlaylistDetailScreenProps> = ({
  playlist,
  tracks,
  currentTrack,
  isPlaying,
  onBack,
  onPlayTrack,
  onPlayAll,
  onDownloadAll,
  onOpenTrackMenu,
  downloadingTrackIds,
}) => {
  const allDownloaded = tracks.length > 0 && tracks.every((t) => t.isOffline);
  const anyDownloading = tracks.some((t) => downloadingTrackIds[t.id]);

  return (
    <div className="pb-40 pt-4 px-5 select-none">
      {/* Top Bar: Back Button (<) & More Menu (•••) */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onDownloadAll(tracks)}
          aria-label="Download All Offline"
          className="px-3.5 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center gap-1.5 text-xs font-semibold text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
        >
          {anyDownloading ? (
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : allDownloaded ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Download className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{allDownloaded ? 'Saved Offline' : 'Download All'}</span>
        </button>

        <button
          type="button"
          onClick={() => tracks[0] && onOpenTrackMenu(tracks[0])}
          aria-label="Playlist options"
          className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Centered Square Playlist Cover & Metadata */}
      <div className="flex flex-col items-center text-center mb-5">
        <div className="w-44 h-44 rounded-[26px] overflow-hidden shadow-[0_18px_36px_rgba(147,197,253,0.35)] border-2 border-white mb-4">
          <img
            src={playlist.coverUrl}
            alt={playlist.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight">
          {playlist.title}
        </h1>
        <p className="text-xs font-medium text-[#64748B] mt-0.5">{playlist.subtitle}</p>
        <p className="text-[11px] font-medium text-[#94A3B8] mt-0.5">
          {playlist.displayCount || tracks.length} songs · Public Playlist
        </p>
      </div>

      {/* Two Main Action Pills: Dark ▶ Play and Frosted White 🔀 Shuffle */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => onPlayAll(tracks, false)}
          className="h-12 rounded-full bg-[#0F172A] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(15,23,42,0.22)] hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Play</span>
        </button>

        <button
          type="button"
          onClick={() => onPlayAll(tracks, true)}
          className="h-12 rounded-full bg-white/85 backdrop-blur-xl border border-white text-[#0F172A] font-semibold text-sm flex items-center justify-center gap-2 shadow-xs hover:bg-white active:scale-95 transition-all cursor-pointer"
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Tracklist Rows */}
      <div className="space-y-2.5">
        {tracks.map((track) => {
          const isCurrent = currentTrack.id === track.id;
          return (
            <div
              key={track.id}
              className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-all ${
                isCurrent
                  ? 'bg-white border-blue-200 shadow-sm'
                  : 'bg-white/75 border-white/90 hover:bg-white'
              }`}
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
                  className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p
                      className={`text-[14px] font-bold truncate ${
                        isCurrent ? 'text-blue-600' : 'text-[#0F172A]'
                      }`}
                    >
                      {track.title}
                    </p>
                    {track.isOffline && (
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                        aria-label="Offline ready"
                      />
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#64748B] truncate mt-0.5">
                    {track.artist}
                    {isCurrent && isPlaying ? ' · Playing' : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenTrackMenu(track)}
                aria-label={`Options for ${track.title}`}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#64748B] cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
