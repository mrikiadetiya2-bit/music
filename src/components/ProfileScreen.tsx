import React, { useRef, useState } from 'react';
import {
  Pencil,
  Crown,
  User,
  Download,
  Clock,
  Settings,
  HelpCircle,
  ChevronRight,
  FolderUp,
  Trash2,
  Play,
  X,
  Smartphone,
  Share,
  PlusSquare,
  CheckCircle2,
} from 'lucide-react';
import { Track, UserProfile } from '../types/music';
import { formatBytes } from '../utils/musicLogic';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ProfileScreenProps {
  userProfile: UserProfile;
  offlineTracks: Track[];
  historyTracks: Track[];
  allTracks: Track[];
  onUpdateProfile: (profile: UserProfile) => void;
  onPlayTrack: (track: Track) => void;
  onRemoveOfflineTrack: (trackId: string) => void;
  onClearAllOffline: () => void;
  onDownloadAllCatalog: () => void;
  onImportFiles: (files: FileList) => void;
}

type ActiveModal =
  | null
  | 'account'
  | 'downloaded'
  | 'history'
  | 'settings'
  | 'support';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  offlineTracks,
  historyTracks,
  allTracks,
  onUpdateProfile,
  onPlayTrack,
  onRemoveOfflineTrack,
  onClearAllOffline,
  onDownloadAllCatalog,
  onImportFiles,
}) => {
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editName, setEditName] = useState(userProfile.name);
  const [editFull, setEditFull] = useState(userProfile.fullName);
  const [editHandle, setEditHandle] = useState(userProfile.handle);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { isInstallable, isInstalled, install } = usePWAInstall();

  const totalBytes = offlineTracks.reduce((sum, t) => sum + (t.sizeBytes || 380000), 0);

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...userProfile,
      name: editName.trim() || 'Riki',
      fullName: editFull.trim() || 'Riki Pratama',
      handle: editHandle.trim() || '@riki',
    });
    setActiveModal(null);
  };

  return (
    <div className="pb-28 pt-5 px-5 select-none">
      {/* Hidden File Input for Quick MP3 Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav,.flac"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onImportFiles(e.target.files);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* User Header: Avatar, Full Name, @handle, and Edit Profile button */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-15 h-15 rounded-full overflow-hidden border-2 border-white shadow-md shrink-0">
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.fullName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-[18px] font-extrabold text-[#0F172A] truncate">
              {userProfile.fullName}
            </h1>
            <p className="text-xs font-medium text-[#64748B] truncate mt-0.5">
              {userProfile.handle}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditName(userProfile.name);
            setEditFull(userProfile.fullName);
            setEditHandle(userProfile.handle);
            setActiveModal('account');
          }}
          aria-label="Edit Profile"
          className="w-10 h-10 rounded-full bg-white/85 backdrop-blur-md border border-white flex items-center justify-center text-[#0F172A] shadow-xs hover:bg-white cursor-pointer shrink-0"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Musee Premium Banner: Soft gold/peach gradient card with Crown icon */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#FEF3C7] via-[#FDE68A]/70 to-[#F3E8FF] border border-white p-3.5 mb-4 shadow-[0_10px_24px_rgba(251,191,36,0.15)] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/25 flex items-center justify-center text-amber-600 shrink-0">
            <Crown className="w-5 h-5 fill-amber-500 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-extrabold text-[#0F172A]">Musee Premium</p>
            <p className="text-[10.5px] font-medium text-[#475569] leading-tight mt-0.5">
              Musee Offline Pro (Unlocked & Free Forever)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setActiveModal('downloaded')}
          className="px-3.5 py-1.5 rounded-full bg-[#0F172A] text-white text-[11px] font-bold shrink-0 shadow-sm hover:bg-slate-800 cursor-pointer"
        >
          Unlocked
        </button>
      </div>

      {/* Interactive Menu List matching Screen 8 */}
      <div className="space-y-1.5 mb-4">
        <button
          type="button"
          onClick={() => setActiveModal('account')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-[#475569]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">Account</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('downloaded')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Download className="w-4 h-4 text-[#475569]" />
            <div className="text-left">
              <span className="text-[13px] font-semibold text-[#0F172A] block">
                Downloaded Songs
              </span>
              <span className="text-[10px] font-medium text-[#64748B] tabular-nums">
                {offlineTracks.length} songs · {formatBytes(totalBytes)} stored in IndexedDB
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <FolderUp className="w-4 h-4 text-blue-600" />
            <div className="text-left">
              <span className="text-[13px] font-semibold text-[#0F172A] block">
                Import Local MP3s
              </span>
              <span className="text-[10px] font-medium text-[#64748B]">
                Upload audio from iPhone Files app
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('history')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-[#475569]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">
              Listening History
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('settings')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-[#475569]" />
            <span className="text-[13px] font-semibold text-[#0F172A]">Settings</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('support')}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-white/90 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-[#475569]" />
            <div className="text-left">
              <span className="text-[13px] font-semibold text-[#0F172A] block">
                Help & Support (Install on iPhone)
              </span>
              <span className="text-[10px] font-medium text-blue-600">
                iOS Safari Add to Home Screen Guide
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        </button>
      </div>

      {/* Bottom Banner Card: "Music tells your story — Keep listening, keep living." */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-r from-[#E0E7FF] via-[#EDE9FE] to-[#FCE7F3] border border-white p-5 shadow-xs">
        <svg
          viewBox="0 0 400 120"
          className="pointer-events-none absolute right-0 top-0 h-full w-48 opacity-80"
          aria-hidden="true"
        >
          <path
            d="M120,120 C170,40 240,100 310,20 C350,-10 380,40 410,10 L410,120 Z"
            fill="#C4B5FD"
            opacity="0.45"
          />
          <path
            d="M160,120 C210,60 270,80 340,30 C370,10 390,50 410,30"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="6"
          />
        </svg>
        <div className="relative z-10 max-w-[230px]">
          <p className="text-[14px] font-extrabold text-[#0F172A]">
            Music tells your story
          </p>
          <p className="text-xs font-medium text-[#64748B] mt-1">
            Keep listening, keep living.
          </p>
        </div>
      </div>

      {/* Sub-Modal: Downloaded Songs / Offline Storage Manager */}
      {activeModal === 'downloaded' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Offline Storage Manager"
        >
          <div className="w-full max-w-[430px] max-h-[82dvh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-extrabold text-[#0F172A]">
                  Offline Storage Manager
                </h3>
                <p className="text-xs text-[#64748B] tabular-nums">
                  {offlineTracks.length} songs saved · {formatBytes(totalBytes)} used in IndexedDB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={onDownloadAllCatalog}
                className="flex-1 h-10 rounded-full bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All ({allTracks.length})</span>
              </button>

              {offlineTracks.length > 0 && (
                <button
                  type="button"
                  onClick={onClearAllOffline}
                  className="px-4 h-10 rounded-full bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cache</span>
                </button>
              )}
            </div>

            {offlineTracks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-[#0F172A]">No Offline Tracks Saved</p>
                <p className="text-xs text-[#64748B] mt-1">
                  Tap &ldquo;Download All&rdquo; above or import local MP3s to listen offline in Airplane Mode.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {offlineTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div
                      onClick={() => {
                        onPlayTrack(track);
                        setActiveModal(null);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          onPlayTrack(track);
                          setActiveModal(null);
                        }
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-[#0F172A] truncate">
                            {track.title}
                          </p>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        </div>
                        <p className="text-[11px] text-[#64748B] truncate tabular-nums">
                          {track.artist} · {formatBytes(track.sizeBytes || 380000)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveOfflineTrack(track.id)}
                      aria-label={`Remove ${track.title} from offline storage`}
                      className="w-8 h-8 rounded-full hover:bg-rose-100 text-rose-500 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Modal: Listening History */}
      {activeModal === 'history' && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Listening History"
        >
          <div className="w-full max-w-[430px] max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-10 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-[#0F172A]">Listening History</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {historyTracks.map((track) => (
                <div
                  key={track.id}
                  onClick={() => {
                    onPlayTrack(track);
                    setActiveModal(null);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onPlayTrack(track);
                      setActiveModal(null);
                    }
                  }}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-11 h-11 rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate">
                        {track.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-[#0F172A] shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Account Edit */}
      {activeModal === 'account' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Account"
        >
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Edit Profile</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Display Greeting Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editFull}
                  onChange={(e) => setEditFull(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Handle
                </label>
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-100 border border-slate-200 text-sm text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 rounded-full bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Modal: Settings */}
      {activeModal === 'settings' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Audio and Offline Settings"
        >
          <div className="w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Audio & Offline Settings</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2">
                  Offline Audio Quality
                </label>
                {(
                  [
                    'Lossless (24-bit)',
                    'High (320 kbps)',
                    'Data Saver (128 kbps)',
                  ] as UserProfile['audioQuality'][]
                ).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onUpdateProfile({ ...userProfile, audioQuality: q })}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold mb-2 cursor-pointer ${
                      userProfile.audioQuality === q
                        ? 'bg-blue-50 border-blue-400 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-[#0F172A]'
                    }`}
                  >
                    <span>{q}</span>
                    {userProfile.audioQuality === q && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-[#0F172A]">Auto-Download Liked Songs</p>
                  <p className="text-[11px] text-[#64748B]">
                    Automatically cache liked tracks in IndexedDB
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={userProfile.autoDownloadLikes}
                  onChange={(e) =>
                    onUpdateProfile({
                      ...userProfile,
                      autoDownloadLikes: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#0F172A]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Modal: Help & Support (iOS Safari Add to Home Screen Guide + PWA Install) */}
      {activeModal === 'support' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Install Musee on iPhone"
        >
          <div className="w-full max-w-[380px] rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-[#0F172A]">
                  Install Musee on iPhone
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close"
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Install Musee as a standalone iOS app for full-screen display, Lock Screen & Dynamic Island audio controls, and 100% offline playback in Airplane Mode:
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#0F172A]">
                  <strong>Step 1:</strong> Tap the <strong>Share</strong> button at the bottom of Safari.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <p className="text-xs text-[#0F172A]">
                  <strong>Step 2:</strong> Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>

            {isInstallable && !isInstalled && (
              <button
                type="button"
                onClick={install}
                className="w-full h-11 rounded-full bg-blue-600 text-white text-xs font-bold mb-2.5 shadow-md cursor-pointer"
              >
                Install App Now
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full h-11 rounded-full bg-[#0F172A] text-white text-xs font-bold cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
