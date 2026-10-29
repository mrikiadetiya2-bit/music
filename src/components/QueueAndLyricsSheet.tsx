import React, { useEffect, useState } from 'react';
import { ChevronDown, X, MoreHorizontal, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { LyricLine, Track } from '../types/music';
import { getActiveLyricIndex } from '../utils/musicLogic';
import { fetchLyricsFromLrclib } from '../services/onlineApi';

interface QueueAndLyricsSheetProps {
  currentTrack: Track;
  queue: Track[];
  currentTime: number;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onSeekToLyric: (time: number) => void;
  onUpdateTrackLyrics: (trackId: string, lyrics: LyricLine[]) => void;
}

export const QueueAndLyricsSheet: React.FC<QueueAndLyricsSheetProps> = ({
  currentTrack,
  queue,
  currentTime,
  onClose,
  onPlayTrack,
  onRemoveFromQueue,
  onSeekToLyric,
  onUpdateTrackLyrics,
}) => {
  const [expandedLyrics, setExpandedLyrics] = useState(false);
  const [loadingOnlineLyrics, setLoadingOnlineLyrics] = useState(false);

  // Automatically fetch real lyrics from LRCLIB if track has placeholder/short lyrics
  useEffect(() => {
    let cancelled = false;
    if (currentTrack.lyrics.length <= 4 && !currentTrack.isImported) {
      setLoadingOnlineLyrics(true);
      fetchLyricsFromLrclib(currentTrack.title, currentTrack.artist, currentTrack.duration)
        .then((fetched) => {
          if (!cancelled && fetched && fetched.length > 0) {
            onUpdateTrackLyrics(currentTrack.id, fetched);
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingOnlineLyrics(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [currentTrack.id, currentTrack.title, currentTrack.artist, currentTrack.duration]);

  const activeIdx = getActiveLyricIndex(currentTrack.lyrics, currentTime);
  const upcomingTracks = queue.filter((t) => t.id !== currentTrack.id).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-slate-900/35 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Playing Next and Full Lyrics"
    >
      <div className="relative w-full max-w-[430px] h-[100dvh] overflow-y-auto no-scrollbar bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] px-5 pt-5 pb-32 select-none shadow-2xl">
        {/* Top Bar: Down Chevron (⌄), Drag Handle, and Close (✕) */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Minimize Queue and Lyrics"
            className="w-10 h-10 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-[#0F172A] cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div className="w-10 h-1.5 rounded-full bg-slate-300" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Queue and Lyrics"
            className="w-10 h-10 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-[#0F172A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* "Playing Next" Queue Section (Hidden when lyrics are expanded full-screen) */}
        {!expandedLyrics && (
          <section className="mb-6">
            <h2 className="text-[16px] font-extrabold text-[#0F172A] mb-3">
              Playing Next
            </h2>

            <div className="space-y-2.5">
              {upcomingTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-xs hover:bg-white transition-all"
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
                      className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#0F172A] truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] font-medium text-[#64748B] truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFromQueue(track.id)}
                    aria-label={`Remove ${track.title} from queue`}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-[#64748B] cursor-pointer"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* "Lyrics" Full View Card matching Screen 7 */}
        <section className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[16px] font-extrabold text-[#0F172A]">Lyrics</h2>
              {loadingOnlineLyrics && (
                <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={() => setExpandedLyrics((prev) => !prev)}
              aria-label={expandedLyrics ? 'Collapse full lyrics' : 'Expand full lyrics'}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#475569] cursor-pointer"
            >
              {expandedLyrics ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-3">
            {currentTrack.lyrics.map((line, idx) => {
              const isActive = idx === activeIdx || idx === activeIdx + 1;
              return (
                <button
                  key={`${line.time}-${idx}`}
                  type="button"
                  onClick={() => onSeekToLyric(line.time)}
                  className={`block w-full text-left transition-all cursor-pointer ${
                    idx === activeIdx
                      ? 'text-[20px] font-extrabold text-[#0F172A] leading-snug'
                      : isActive
                      ? 'text-[18px] font-bold text-[#1E293B] leading-snug'
                      : 'text-[16px] font-semibold text-[#94A3B8]/80 hover:text-[#64748B] leading-snug'
                  }`}
                >
                  {line.text}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
