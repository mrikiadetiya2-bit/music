export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type GenreFilter = 'All' | 'Pop' | 'Indie' | 'Chill' | 'K-Pop' | 'Rock';

export type LibraryFilter = 'Playlists' | 'Songs' | 'Artists' | 'Albums' | 'Downloaded';

export type MainTab = 'home' | 'search' | 'library' | 'profile';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl?: string;
  fallbackPreviewUrl?: string;
  genre: GenreFilter;
  lyrics: LyricLine[];
  isOffline?: boolean;
  isImported?: boolean;
  sizeBytes?: number;
  addedAt?: number;
}

export interface Playlist {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string;
  badgeText?: string;
  trackIds: string[];
  displayCount?: number;
  gradient?: string;
  iconType?: 'heart' | 'moon' | 'leaves' | 'tower' | 'runner' | 'road' | 'ocean' | 'download';
}

export interface UserProfile {
  name: string;
  fullName: string;
  handle: string;
  avatarUrl: string;
  audioQuality: 'Lossless (24-bit)' | 'High (320 kbps)' | 'Data Saver (128 kbps)';
  autoDownloadLikes: boolean;
}

export interface OfflineTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  savedAt: number;
  sizeBytes: number;
}
