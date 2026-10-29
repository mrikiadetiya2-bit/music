import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  formatBytes,
  parseAudioFilename,
  parseLrcLyrics,
  getActiveLyricIndex,
  filterTracksByGenreAndQuery,
  generateProceduralWavBlob,
  computeAudioSeekTime,
  normalizeTrackCacheKey,
  getNextTrackIndex,
  detectTrackLanguage,
  getTrendingSeedArtistsForTrack,
  buildImmediateSimilarQueue,
} from './musicLogic';
import { Track } from '../types/music';

test('formatTime formats seconds into M:SS accurately', () => {
  assert.equal(formatTime(84), '1:24');
  assert.equal(formatTime(261), '4:21');
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(-5), '0:00');
});

test('formatBytes formats byte counts into KB and MB', () => {
  assert.equal(formatBytes(0), '0.0 MB');
  assert.equal(formatBytes(512 * 1024), '512.0 KB');
  assert.equal(formatBytes(4.5 * 1024 * 1024), '4.5 MB');
});

test('parseAudioFilename extracts artist and title from filename', () => {
  const parsed = parseAudioFilename('Bernadya - Satu Bulan.mp3');
  assert.equal(parsed.artist, 'Bernadya');
  assert.equal(parsed.title, 'Satu Bulan');

  const simple = parseAudioFilename('My_Voice_Memo.m4a');
  assert.equal(simple.title, 'My Voice Memo');
  assert.equal(simple.artist, 'iPhone Local Import');
});

test('parseLrcLyrics and getActiveLyricIndex synchronize lyrics with playback time', () => {
  const lrc = `[00:10.00] Terlalu indah\n[00:15.50] Dirimu dimataku\n[00:22.00] Terlalu sedih`;
  const lines = parseLrcLyrics(lrc);
  assert.equal(lines.length, 3);
  assert.equal(lines[0].text, 'Terlalu indah');
  assert.equal(lines[1].time, 15.5);

  assert.equal(getActiveLyricIndex(lines, 12), 0);
  assert.equal(getActiveLyricIndex(lines, 16), 1);
  assert.equal(getActiveLyricIndex(lines, 25), 2);
});

test('filterTracksByGenreAndQuery filters by genre and search term including lyrics', () => {
  const sampleTracks: Track[] = [
    {
      id: '1',
      title: 'Satu Bulan',
      artist: 'Bernadya',
      album: 'Sialnya, Hidup Harus Tetap Berjalan',
      duration: 261,
      coverUrl: '/cover1.jpg',
      genre: 'Indie',
      lyrics: [{ time: 0, text: 'Terlalu indah dirimu dimataku' }],
    },
    {
      id: '2',
      title: 'Die With A Smile',
      artist: 'Lady Gaga, Bruno Mars',
      album: 'Die With A Smile',
      duration: 251,
      coverUrl: '/cover2.jpg',
      genre: 'Pop',
      lyrics: [{ time: 0, text: 'If the world was ending' }],
    },
  ];

  assert.equal(filterTracksByGenreAndQuery(sampleTracks, 'All', '').length, 2);
  assert.equal(filterTracksByGenreAndQuery(sampleTracks, 'Indie', '').length, 1);
  assert.equal(filterTracksByGenreAndQuery(sampleTracks, 'All', 'dimataku')[0].id, '1');
  assert.equal(filterTracksByGenreAndQuery(sampleTracks, 'Pop', 'bruno')[0].id, '2');
});

test('generateProceduralWavBlob creates a valid audio/wav Blob', () => {
  const blob = generateProceduralWavBlob(261.63, 2);
  assert.equal(blob.type, 'audio/wav');
  assert.ok(blob.size > 44);
});

test('computeAudioSeekTime clamps cleanly without modulo-looping and normalizeTrackCacheKey unifies metadata keys', () => {
  assert.equal(computeAudioSeekTime(95, 240), 95);
  assert.equal(computeAudioSeekTime(260, 240), 239.5);
  assert.equal(
    normalizeTrackCacheKey('Die With A Smile (Official Video)', 'Lady Gaga & Bruno Mars'),
    normalizeTrackCacheKey('Die With A Smile', 'Lady Gaga, Bruno Mars')
  );
  assert.equal(
    normalizeTrackCacheKey('Until I Found You (with Em Beihold)', 'Stephen Sanchez & Em Beihold'),
    'until i found you|stephen sanchez'
  );

  const q: Track[] = [
    { id: 't1', title: 'A', artist: 'A', album: 'A', duration: 200, coverUrl: '', genre: 'Pop', lyrics: [] },
    { id: 't2', title: 'B', artist: 'B', album: 'B', duration: 200, coverUrl: '', genre: 'Pop', lyrics: [] },
    { id: 't3', title: 'C', artist: 'C', album: 'C', duration: 200, coverUrl: '', genre: 'Pop', lyrics: [] },
  ];
  assert.equal(getNextTrackIndex(q, 't2'), 2);
  assert.equal(getNextTrackIndex(q, 't3'), 0);
});

test('detectTrackLanguage and getTrendingSeedArtistsForTrack match same language and genre', () => {
  const indoTrack = {
    title: 'Hati-Hati di Jalan',
    artist: 'Tulus',
    album: 'Manusia',
    genre: 'Pop' as const,
  };
  assert.equal(detectTrackLanguage(indoTrack), 'id');
  const indoSeeds = getTrendingSeedArtistsForTrack(indoTrack);
  assert.ok(indoSeeds.includes('Mahalini') || indoSeeds.includes('Juicy Luicy'));
  assert.ok(!indoSeeds.includes('Tulus'));

  const kpopTrack = {
    title: 'Magnetic',
    artist: 'ILLIT',
    album: 'SUPER REAL ME',
    genre: 'K-Pop' as const,
  };
  assert.equal(detectTrackLanguage(kpopTrack), 'ko');
  const kpopSeeds = getTrendingSeedArtistsForTrack(kpopTrack);
  assert.ok(kpopSeeds.includes('NewJeans') || kpopSeeds.includes('aespa'));

  const enTrack = {
    title: 'Die With A Smile',
    artist: 'Lady Gaga, Bruno Mars',
    album: 'Die With A Smile',
    genre: 'Pop' as const,
  };
  assert.equal(detectTrackLanguage(enTrack), 'en');
  const enSeeds = getTrendingSeedArtistsForTrack(enTrack);
  assert.ok(enSeeds.includes('Sabrina Carpenter') || enSeeds.includes('Billie Eilish'));
});

test('buildImmediateSimilarQueue prioritizes tracks with same language and genre from varied artists', () => {
  const seed: Track = {
    id: 'seed-id',
    title: 'Sial',
    artist: 'Mahalini',
    album: 'Fabula',
    duration: 243,
    coverUrl: '',
    genre: 'Pop',
    lyrics: [],
  };
  const candidates: Track[] = [
    {
      id: 'en-pop',
      title: 'Espresso',
      artist: 'Sabrina Carpenter',
      album: 'Short n Sweet',
      duration: 175,
      coverUrl: '',
      genre: 'Pop',
      lyrics: [],
    },
    {
      id: 'id-indie',
      title: 'Satu Bulan',
      artist: 'Bernadya',
      album: 'Sialnya',
      duration: 261,
      coverUrl: '',
      genre: 'Indie',
      lyrics: [],
    },
    {
      id: 'id-pop',
      title: 'Hati-Hati di Jalan',
      artist: 'Tulus',
      album: 'Manusia',
      duration: 242,
      coverUrl: '',
      genre: 'Pop',
      lyrics: [],
    },
  ];
  const result = buildImmediateSimilarQueue(seed, candidates);
  assert.equal(result[0].id, 'seed-id');
  // Next track must be Indonesian Pop ('id-pop'), followed by Indonesian Indie ('id-indie'), then English Pop ('en-pop')
  assert.equal(result[1].id, 'id-pop');
  assert.equal(result[2].id, 'id-indie');
  assert.equal(result[3].id, 'en-pop');
});

