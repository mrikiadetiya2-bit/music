import React from 'react';
import {
  ChevronDown,
  MoreHorizontal,
  Heart,
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Share2,
  ListMusic,
  MessageSquareQuote,
  Download,
  CheckCircle2,
  Sparkles,
  HardDriveDownload,
} from 'lucide-react';
import { Track } from '../types/music';
import { formatTime, getActiveLyricIndex } from '../utils/musicLogic';

interface FullPlayerModalProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLiked: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  isDownloading: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleLike: (trackId: string) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onDownloadOffline: (track: Track) => void;
  onOpenQueueAndLyrics: () => void;
  onOpenTrackMenu: (track: Track) => void;
  onShareTrack: (track: Track) => void;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  isLiked,
  isShuffle,
  isRepeat,
  isDownloading,
  onClose,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleLike,
  onToggleShuffle,
  onToggleRepeat,
  onDownloadOffline,
  onOpenQueueAndLyrics,
  onOpenTrackMenu,
  onShareTrack,
}) => {
  const effectiveDuration = duration > 0 ? duration : track.duration || 261;
  const activeLyricIdx = getActiveLyricIndex(track.lyrics, currentTime);

  // Extract 4 lines of synchronized lyrics centered on current active line matching Screen 3
  const startIdx = Math.max(0, Math.min(activeLyricIdx, Math.max(0, track.lyrics.length - 4)));
  const previewLines = track.lyrics.slice(startIdx, startIdx + 4);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-slate-900/30 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Full Music Player"
    >
      <div className="relative w-full max-w-[430px] h-[100dvh] overflow-y-auto no-scrollbar bg-gradient-to-b from-[#ECE9E2] via-[#F5F4F0] to-[#EAECEF] px-6 pt-5 pb-8 flex flex-col justify-between select-none shadow-2xl">
        {/* Top Header Row: Down Chevron, Center Wave Handle, More Icon */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Minimize player"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#475569] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="w-10 h-1.5 rounded-full bg-slate-400/40" />

          <button
            type="button"
            onClick={() => onOpenTrackMenu(track)}
            aria-label="Track options"
            className="w-11 h-11 rounded-full flex items-center justify-center text-[#475569] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Large Square Album Art with Soft Drop Shadow */}
        <div className="w-full aspect-square max-h-[310px] mx-auto rounded-[28px] overflow-hidden shadow-[0_24px_48px_rgba(15,23,42,0.18)] border border-white/60 mb-5">
          <img
            src={track.coverUrl}
            alt={track.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Track Title, Artist, Heart Toggle, Offline Download, & More */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-extrabold text-[#0F172A] truncate">
                {track.title}
              </h2>
              {track.isOffline && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </span>
              )}
            </div>
            <p className="text-[14px] font-medium text-[#64748B] truncate mt-0.5">
              {track.artist}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onToggleLike(track.id)}
              aria-label={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
              className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-md border border-white flex items-center justify-center shadow-xs hover:bg-white transition-all cursor-pointer"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isLiked ? 'fill-rose-500 text-rose-500' : 'text-[#0F172A]'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => onDownloadOffline(track)}
              disabled={isDownloading}
              aria-label={
                track.isOffline ? 'Downloaded for offline playback' : 'Download track for offline'
              }
              className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                track.isOffline
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white/80 border-white text-[#0F172A] hover:bg-white'
              }`}
            >
              {isDownloading ? (
                <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
              ) : track.isOffline ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Embedded 4-Line Synchronized Lyrics Preview (Matches Screen 3 Reference) */}
        <div
          onClick={onOpenQueueAndLyrics}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenQueueAndLyrics();
            }
          }}
          aria-label="Open full synchronized lyrics"
          className="mb-4 py-1 cursor-pointer group"
        >
          <div className="space-y-1">
            {previewLines.map((line, idx) => {
              const globalIdx = startIdx + idx;
              const isCurrent = globalIdx === activeLyricIdx;
              return (
                <p
                  key={`${line.time}-${idx}`}
                  className={`text-[14px] leading-snug transition-colors ${
                    isCurrent
                      ? 'font-bold text-[#0F172A]'
                      : 'font-medium text-[#64748B]/80 group-hover:text-[#475569]'
                  }`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>

        {/* Interactive Seek Bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={1}
            value={Math.min(currentTime, effectiveDuration)}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Seek time"
            className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
          />
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#64748B] tabular-nums mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Main Playback Controls: Shuffle, Prev, Dark Circle Play/Pause, Next, Repeat */}
        <div className="flex items-center justify-between px-2 mb-5">
          <button
            type="button"
            onClick={onToggleShuffle}
            aria-label="Toggle Shuffle"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isShuffle ? 'text-blue-600 bg-blue-50' : 'text-[#0F172A] hover:bg-black/5'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous Track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <SkipBack className="w-6 h-6 fill-[#0F172A]" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-[0_12px_28px_rgba(15,23,42,0.3)] hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            aria-label="Next Track"
            className="w-12 h-12 rounded-full flex items-center justify-center text-[#0F172A] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <SkipForward className="w-6 h-6 fill-[#0F172A]" />
          </button>

          <button
            type="button"
            onClick={onToggleRepeat}
            aria-label="Toggle Repeat"
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isRepeat ? 'text-blue-600 bg-blue-50' : 'text-[#0F172A] hover:bg-black/5'
            }`}
          >
            <Repeat className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Utility Bar: Share, Queue, Lyrics Pill, Offline Storage Indicator */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => onShareTrack(track)}
            aria-label="Share Track"
            className="w-11 h-11 rounded-full bg-white/75 border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenQueueAndLyrics}
            aria-label="Open Playing Next Queue"
            className="w-11 h-11 rounded-full bg-white/75 border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenQueueAndLyrics}
            className="h-11 px-5 rounded-full bg-white/85 border border-white flex items-center justify-center gap-2 text-xs font-bold text-[#0F172A] shadow-xs hover:bg-white cursor-pointer"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Lyrics</span>
          </button>

          <button
            type="button"
            onClick={() => onDownloadOffline(track)}
            aria-label="Offline Storage Status"
            className={`w-11 h-11 rounded-full border flex items-center justify-center shadow-xs cursor-pointer ${
              track.isOffline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-white/75 border-white text-[#0F172A] hover:bg-white'
            }`}
          >
            <HardDriveDownload className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
