import React, { useEffect, useState } from 'react';
import {
  Search,
  ArrowUpRight,
  Flame,
  Radio,
  MoreHorizontal,
  CheckCircle2,
  Download,
  Sparkles,
  X,
} from 'lucide-react';
import { Track } from '../types/music';
import { searchOnlineTracks } from '../services/onlineApi';
import { filterTracksByGenreAndQuery } from '../utils/musicLogic';

interface SearchScreenProps {
  initialQuery?: string;
  localTracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  offlineTrackIds: Set<string>;
  downloadingTrackIds: Record<string, boolean>;
  onPlayTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
  onOpenTrackMenu: (track: Track) => void;
}

const EXPLORE_CARDS = [
  {
    id: 'top-charts',
    title: 'Top Charts',
    query: 'Top Hits 2025',
    bgClass: 'bg-gradient-to-br from-[#FBCFE8] via-[#F9A8D4]/80 to-[#F472B6]/60',
    icon: ArrowUpRight,
  },
  {
    id: 'new-releases',
    title: 'New Releases',
    query: 'Bernadya Bruno Mars',
    bgClass: 'bg-gradient-to-br from-[#BAE6FD] via-[#93C5FD]/85 to-[#818CF8]/65',
    icon: Flame,
  },
  {
    id: 'mood-genre',
    title: 'Mood & Genre',
    query: 'Indie Chill Acoustic',
    bgClass: 'bg-gradient-to-br from-[#E9D5FF] via-[#C4B5FD]/85 to-[#A5B4FC]/70',
    icon: ArrowUpRight,
  },
  {
    id: 'podcasts',
    title: 'Podcasts',
    query: 'Lo-Fi Study Beats',
    bgClass: 'bg-gradient-to-br from-[#A7F3D0] via-[#6EE7B7]/80 to-[#38BDF8]/60',
    icon: Radio,
  },
];

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  localTracks,
  currentTrack,
  isPlaying,
  offlineTrackIds,
  downloadingTrackIds,
  onPlayTrack,
  onDownloadTrack,
  onOpenTrackMenu,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [onlineResults, setOnlineResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setOnlineResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchOnlineTracks(trimmed, 15);
      if (!cancelled) {
        setOnlineResults(
          results.map((t) => ({
            ...t,
            isOffline: offlineTrackIds.has(t.id),
          }))
        );
        setIsSearching(false);
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, offlineTrackIds]);

  const matchingLocal = query.trim()
    ? filterTracksByGenreAndQuery(localTracks, 'All', query)
    : localTracks;

  const combinedResults = query.trim()
    ? [
        ...matchingLocal,
        ...onlineResults.filter(
          (online) =>
            !matchingLocal.some(
              (local) =>
                local.title.toLowerCase() === online.title.toLowerCase() &&
                local.artist.toLowerCase() === online.artist.toLowerCase()
            )
        ),
      ]
    : localTracks;

  return (
    <div className="pb-40 pt-5 px-5 select-none">
      {/* Large Bold Header "Search" */}
      <h1 className="text-[26px] font-extrabold tracking-tight text-[#0F172A] mb-4">
        Search
      </h1>

      {/* Live Search Input */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artists, songs, lyrics..."
          aria-label="Artists, songs, lyrics"
          className="w-full h-12 pl-11 pr-10 rounded-full bg-white/85 backdrop-blur-xl border border-white text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] shadow-[0_4px_16px_rgba(148,163,184,0.12)] focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search query"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* "Explore" 2x2 Pastel Grid */}
      {!query.trim() && (
        <section className="mb-6">
          <h2 className="text-[16px] font-bold text-[#0F172A] mb-3">Explore</h2>
          <div className="grid grid-cols-2 gap-3">
            {EXPLORE_CARDS.map((card) => {
              const IconComponent = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setQuery(card.query)}
                  className={`relative h-[76px] rounded-2xl p-3.5 text-left overflow-hidden border border-white/80 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer ${card.bgClass}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-[#0F172A] leading-snug">
                      {card.title}
                    </span>
                    <IconComponent className="w-4 h-4 text-[#0F172A]/75 shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* "Popular Right Now" or Live Search Results */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[16px] font-bold text-[#0F172A]">
            {query.trim()
              ? isSearching
                ? 'Searching Online Catalog...'
                : `Results (${combinedResults.length})`
              : 'Popular Right Now'}
          </h2>
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Reset
            </button>
          ) : (
            <span className="text-xs font-semibold text-[#64748B]">See All</span>
          )}
        </div>

        <div className="space-y-2.5">
          {combinedResults.map((track, index) => {
            const isCurrent = currentTrack.id === track.id;
            const isSaved = track.isOffline || offlineTrackIds.has(track.id);
            const isDownloading = !!downloadingTrackIds[track.id];

            return (
              <div
                key={track.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-white/75 backdrop-blur-lg border border-white/90 shadow-[0_4px_12px_rgba(148,163,184,0.06)] hover:bg-white transition-all"
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
                  <span className="w-5 text-center text-xs font-bold text-[#0F172A] tabular-nums shrink-0">
                    {index + 1}
                  </span>
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
                      {isSaved && (
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-emerald-500 shrink-0"
                          aria-label="Downloaded offline"
                        />
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#64748B] truncate mt-0.5">
                      {track.artist}
                      {isCurrent && isPlaying ? ' · Playing' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isSaved && (
                    <button
                      type="button"
                      onClick={() => onDownloadTrack(track)}
                      disabled={isDownloading}
                      aria-label={`Download ${track.title} offline`}
                      className="w-9 h-9 rounded-full bg-slate-100/80 hover:bg-blue-50 text-[#64748B] hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      {isDownloading ? (
                        <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenTrackMenu(track)}
                    aria-label={`More options for ${track.title}`}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 text-[#64748B] flex items-center justify-center cursor-pointer"
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
