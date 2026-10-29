import React from 'react';
import {
  Download,
  Trash2,
  Heart,
  ListPlus,
  MessageSquareQuote,
  X,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { Playlist, Track } from '../types/music';

interface TrackActionSheetProps {
  track: Track | null;
  isLiked: boolean;
  playlists: Playlist[];
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onDownloadOffline: (track: Track) => void;
  onRemoveOffline: (trackId: string) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onAddToPlaylist: (playlistId: string, trackId: string) => void;
  onOpenLyrics: (track: Track) => void;
}

export const TrackActionSheet: React.FC<TrackActionSheetProps> = ({
  track,
  isLiked,
  playlists,
  onClose,
  onPlayTrack,
  onDownloadOffline,
  onRemoveOffline,
  onToggleLike,
  onAddToQueue,
  onAddToPlaylist,
  onOpenLyrics,
}) => {
  if (!track) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Options for ${track.title}`}
    >
      <div className="w-full max-w-[430px] rounded-t-3xl bg-white/95 backdrop-blur-2xl border-t border-white p-6 pb-9 shadow-2xl">
        <div className="w-10 h-1.5 rounded-full bg-slate-300 mx-auto mb-4" />

        {/* Track Header */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-extrabold text-[#0F172A] truncate">
                  {track.title}
                </p>
                {track.isOffline && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
              </div>
              <p className="text-xs font-medium text-[#64748B] truncate">
                {track.artist}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close track menu"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Items */}
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => {
              onPlayTrack(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 text-left text-xs font-bold text-[#0F172A] cursor-pointer"
          >
            <Play className="w-4 h-4 text-blue-600" />
            <span>Play Now</span>
          </button>

          {track.isOffline ? (
            <button
              type="button"
              onClick={() => {
                onRemoveOffline(track.id);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-rose-50 text-left text-xs font-bold text-rose-600 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete from Offline Storage (IndexedDB)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onDownloadOffline(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 text-left text-xs font-bold text-blue-700 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Offline (Save to iPhone IndexedDB)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onToggleLike(track.id);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 text-left text-xs font-bold text-[#0F172A] cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
            />
            <span>{isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onAddToQueue(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 text-left text-xs font-bold text-[#0F172A] cursor-pointer"
          >
            <ListPlus className="w-4 h-4 text-slate-600" />
            <span>Add to Playing Next Queue</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenLyrics(track);
              onClose();
            }}
            className="w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-100 text-left text-xs font-bold text-[#0F172A] cursor-pointer"
          >
            <MessageSquareQuote className="w-4 h-4 text-slate-600" />
            <span>View Full Synchronized Lyrics</span>
          </button>

          {/* Quick Add to Playlist Pills */}
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-[#64748B] px-3 mb-2">
              Add to Playlist:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-3">
              {playlists.slice(0, 4).map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => {
                    onAddToPlaylist(pl.id, track.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-[#0F172A] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  + {pl.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
