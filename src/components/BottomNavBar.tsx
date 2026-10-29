import React from 'react';
import { Home, Search, Library, User, Play, Pause, Maximize2 } from 'lucide-react';
import { MainTab, Track } from '../types/music';

interface BottomNavBarProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  currentTrack: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenFullPlayer: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab,
  currentTrack,
  isPlaying,
  onTogglePlay,
  onOpenFullPlayer,
}) => {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-30 px-3.5 pb-2.5 pt-1 pointer-events-none">
      {/* Main Floating Frosted Glass Navigation Bar matching Reference UI 100% */}
      <nav
        aria-label="Primary Bottom Navigation"
        className="pointer-events-auto relative flex items-center justify-between h-[64px] px-4 rounded-[28px] bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_10px_30px_rgba(15,23,42,0.1)]"
      >
        {/* Home Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <Home
            className="w-5 h-5"
            strokeWidth={activeTab === 'home' ? 2.5 : 2}
          />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
        </button>

        {/* Search Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] transition-colors cursor-pointer ${
            activeTab === 'search' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <Search
            className="w-5 h-5"
            strokeWidth={activeTab === 'search' ? 2.5 : 2}
          />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'search' ? 'font-bold' : 'font-medium'}`}>
            Search
          </span>
        </button>

        {/* Centerpiece Floating Play/Pause Iridescent Blue Orb + Expand Full Player Trigger */}
        <div className="relative -mt-4 flex flex-col items-center justify-center">
          <div className="pointer-events-none absolute -inset-2.5 rounded-full bg-gradient-to-tr from-[#60A5FA]/55 via-[#818CF8]/50 to-[#3B82F6]/55 blur-lg" />
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-[#93C5FD] via-[#60A5FA] to-[#6366F1] text-white flex items-center justify-center shadow-[0_8px_22px_rgba(59,130,246,0.48)] border-2 border-white/85 active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white text-white" />
            ) : (
              <Play className="w-6 h-6 fill-white text-white ml-0.5" />
            )}
          </button>

          {/* Subtle mini pill right beneath orb to open Full Player Modal for current track */}
          <button
            type="button"
            onClick={onOpenFullPlayer}
            aria-label={`Open full music player for ${currentTrack.title} by ${currentTrack.artist}`}
            className="mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
          >
            <span className="truncate max-w-[68px]">{currentTrack.title}</span>
            <Maximize2 className="w-2.5 h-2.5 shrink-0" />
          </button>
        </div>

        {/* Library Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] transition-colors cursor-pointer ${
            activeTab === 'library' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <Library
            className="w-5 h-5"
            strokeWidth={activeTab === 'library' ? 2.5 : 2}
          />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'library' ? 'font-bold' : 'font-medium'}`}>
            Library
          </span>
        </button>

        {/* Profile Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center min-w-[50px] min-h-[46px] transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#64748B]'
          }`}
        >
          <User
            className="w-5 h-5"
            strokeWidth={activeTab === 'profile' ? 2.5 : 2}
          />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'profile' ? 'font-bold' : 'font-medium'}`}>
            Profile
          </span>
        </button>
      </nav>
    </div>
  );
};
