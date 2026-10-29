import React, { useState } from 'react';
import { ArrowRight, X, Check } from 'lucide-react';
import { UserProfile } from '../types/music';
import { ARTWORK } from '../data/catalog';

interface OnboardingScreenProps {
  userProfile: UserProfile;
  onGetStarted: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
}

const AVATAR_PRESETS = [
  ARTWORK.avatarNajwa,
  ARTWORK.satuBulan,
  ARTWORK.chillVibesMoon,
  ARTWORK.dailyMixHeart,
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  userProfile,
  onGetStarted,
  onUpdateProfile,
}) => {
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [handle, setHandle] = useState(userProfile.handle);
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl);

  const handleSaveSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'Riki';
    const cleanFull = fullName.trim() || cleanName;
    const cleanHandle = handle.trim().startsWith('@')
      ? handle.trim()
      : `@${(handle.trim() || cleanName).toLowerCase().replace(/\s+/g, '')}`;

    onUpdateProfile({
      ...userProfile,
      name: cleanName,
      fullName: cleanFull,
      handle: cleanHandle,
      avatarUrl,
    });
    setShowSignInModal(false);
    onGetStarted();
  };

  return (
    <div className="relative flex flex-col justify-between min-h-[100dvh] w-full overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] px-6 pt-14 pb-10 select-none">
      {/* Ambient glowing pastel blobs */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full bg-[#BAE6FD]/50 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-[#E9D5FF]/60 blur-3xl" />
      <div className="pointer-events-none absolute bottom-12 left-10 h-60 w-60 rounded-full bg-[#FBCFE8]/40 blur-3xl" />

      {/* Top Logo & Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center mt-8">
        {/* Glowing Blue Soundwave Equalizer Logo */}
        <div className="relative flex items-center justify-center gap-1.5 h-20 w-24 mb-4">
          <div className="absolute inset-0 rounded-full bg-blue-400/25 blur-xl" />
          <span className="h-6 w-2 rounded-full bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] shadow-sm" />
          <span className="h-12 w-2 rounded-full bg-gradient-to-b from-[#38BDF8] via-[#3B82F6] to-[#1D4ED8] shadow-sm" />
          <span className="h-3 w-3 rounded-full bg-[#2563EB] shadow-sm" />
          <span className="h-16 w-2.5 rounded-full bg-gradient-to-b from-[#60A5FA] via-[#2563EB] to-[#1E40AF] shadow-md" />
          <span className="h-10 w-2 rounded-full bg-gradient-to-b from-[#38BDF8] to-[#2563EB] shadow-sm" />
          <span className="h-5 w-2 rounded-full bg-gradient-to-b from-[#60A5FA] to-[#3B82F6] shadow-sm" />
        </div>

        <h1 className="text-[34px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
          Musee
        </h1>
        <p className="mt-1.5 text-[15px] font-medium text-[#64748B]">
          Music for a brighter day
        </p>
      </div>

      {/* Center 3D Silk/Pearl Iridescent Wave Graphic */}
      <div
        className="relative z-0 -mx-6 my-1 flex items-center justify-center [mask-image:linear-gradient(to_bottom,transparent_0%,black_18%,black_82%,transparent_100%)]"
      >
        <svg
          viewBox="0 0 800 560"
          className="w-full max-w-[430px] h-auto drop-shadow-[0_20px_35px_rgba(96,165,250,0.22)]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="silk1" x1="0%" y1="20%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#E0F2FE" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#C7D2FE" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="silk2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#BAE6FD" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="80%" stopColor="#DDD6FE" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#FBCFE8" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="silk3" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.98" />
              <stop offset="100%" stopColor="#FDE047" stopOpacity="0.45" />
            </linearGradient>
          </defs>
          {/* Ambient back fold */}
          <path
            d="M-60,360 C120,180 280,460 480,240 C620,90 740,220 860,140 L860,520 L-60,520 Z"
            fill="url(#silk1)"
          />
          {/* Main glossy pearl ribbon */}
          <path
            d="M-80,440 C110,240 250,210 410,330 C560,440 670,190 880,90 L880,390 C690,480 510,510 340,390 C190,285 60,450 -80,510 Z"
            fill="url(#silk2)"
          />
          {/* Specular highlight crest */}
          <path
            d="M-50,410 C130,250 280,260 430,350 C580,440 690,250 860,150"
            fill="none"
            stroke="url(#silk3)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M-40,320 C160,430 340,140 540,260 C680,340 760,210 860,240"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="10"
            strokeOpacity="0.85"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Bottom Action Pill Buttons */}
      <div className="relative z-10 flex flex-col gap-3.5 w-full mb-2">
        <button
          type="button"
          onClick={onGetStarted}
          className="w-full h-[54px] rounded-full bg-[#0F172A] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_12px_28px_rgba(15,23,42,0.25)] hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowSignInModal(true)}
          className="w-full h-[54px] rounded-full bg-white/80 backdrop-blur-xl border border-white/90 text-[#0F172A] font-semibold text-[15px] flex items-center justify-center shadow-[0_8px_20px_rgba(148,163,184,0.15)] hover:bg-white active:scale-[0.98] transition-all cursor-pointer"
        >
          Sign In
        </button>
      </div>

      {/* Sign In / Profile Customization Modal */}
      {showSignInModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Customize Profile"
        >
          <div className="w-full max-w-[380px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A]">Sign In to Musee</h2>
              <button
                type="button"
                onClick={() => setShowSignInModal(false)}
                aria-label="Close Sign In Modal"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Choose Avatar
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset)}
                      aria-label={`Select avatar ${idx + 1}`}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-transform ${
                        avatarUrl === preset
                          ? 'border-blue-500 scale-105 shadow-md'
                          : 'border-transparent opacity-75'
                      }`}
                    >
                      <img
                        src={preset}
                        alt={`Avatar option ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {avatarUrl === preset && (
                        <span className="absolute inset-0 bg-blue-600/25 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="signin-nickname"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  First Name (Greeting)
                </label>
                <input
                  id="signin-nickname"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Riki"
                  className="w-full h-11 px-4 rounded-xl bg-slate-100/90 border border-slate-200 text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-fullname"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="signin-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Riki Pratama"
                  className="w-full h-11 px-4 rounded-xl bg-slate-100/90 border border-slate-200 text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div>
                <label
                  htmlFor="signin-handle"
                  className="block text-xs font-semibold text-slate-600 mb-1"
                >
                  Username Handle
                </label>
                <input
                  id="signin-handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@riki"
                  className="w-full h-11 px-4 rounded-xl bg-slate-100/90 border border-slate-200 text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-full bg-[#0F172A] text-white font-semibold text-sm shadow-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Continue to Musee
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
