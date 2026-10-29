import { Playlist, Track, UserProfile } from '../types/music';

// Custom high-resolution SVG Data URL cover artworks crafted to match the reference UI 100% and work 100% offline
const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`;

export const ARTWORK = {
  satuBulan: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#F7EFE6"/>
          <stop offset="50%" stop-color="#E6D5C3"/>
          <stop offset="80%" stop-color="#C2B2A3"/>
          <stop offset="100%" stop-color="#786C61"/>
        </linearGradient>
        <radialGradient id="sun" cx="0.35" cy="0.65" r="0.45">
          <stop offset="0%" stop-color="#FFFDF9" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#E6D5C3" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#sky)"/>
      <rect width="600" height="600" fill="url(#sun)"/>
      <!-- Ocean horizon & ripples -->
      <rect x="0" y="380" width="600" height="220" fill="#8C7D70" opacity="0.55"/>
      <path d="M0 410 Q150 402 300 410 T600 408 L600 600 L0 600 Z" fill="#6E6055" opacity="0.6"/>
      <!-- Distant birds -->
      <path d="M95 105 Q102 97 109 105 Q116 97 123 105" stroke="#574B42" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M135 122 Q140 116 145 122 Q150 116 155 122" stroke="#574B42" stroke-width="2" fill="none" stroke-linecap="round"/>
      <!-- Silhouette of girl in profile looking left with flowing dark hair -->
      <path d="M350 170 C395 170 435 208 448 268 C462 335 500 410 535 480 L550 600 L245 600 L255 485 C265 430 295 400 322 385 C312 372 302 355 302 338 C292 335 285 328 288 318 C290 310 282 302 280 295 C277 286 290 278 294 268 C295 250 302 225 316 202 C326 184 338 170 350 170 Z" fill="#181311"/>
      <path d="M430 240 Q495 300 545 365" stroke="#181311" stroke-width="18" fill="none" stroke-linecap="round" opacity="0.85"/>
    </svg>
  `),
  dieWithASmile: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="stage" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0EA5E9"/>
          <stop offset="55%" stop-color="#0284C7"/>
          <stop offset="100%" stop-color="#1E3A8A"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#stage)"/>
      <!-- Vertical studio curtain pleats -->
      <g stroke="#38BDF8" stroke-width="2" opacity="0.25">
        <line x1="60" y1="0" x2="60" y2="600"/><line x1="120" y1="0" x2="120" y2="600"/>
        <line x1="180" y1="0" x2="180" y2="600"/><line x1="240" y1="0" x2="240" y2="600"/>
        <line x1="300" y1="0" x2="300" y2="600"/><line x1="360" y1="0" x2="360" y2="600"/>
        <line x1="420" y1="0" x2="420" y2="600"/><line x1="480" y1="0" x2="480" y2="600"/>
        <line x1="540" y1="0" x2="540" y2="600"/>
      </g>
      <!-- Retro Duet Figures -->
      <circle cx="215" cy="230" r="65" fill="#FDE047" opacity="0.9"/>
      <circle cx="215" cy="240" r="46" fill="#FDBA74"/>
      <path d="M125 600 C135 410 175 340 215 340 C255 340 295 410 305 600 Z" fill="#EF4444"/>
      <circle cx="395" cy="215" r="58" fill="#1E1B4B"/>
      <circle cx="395" cy="235" r="44" fill="#D97706"/>
      <path d="M300 600 C310 395 350 330 395 330 C440 330 485 395 495 600 Z" fill="#DC2626"/>
      <path d="M355 330 L395 430 L435 330 Z" fill="#FEF2F2"/>
    </svg>
  `),
  waktuYangSalah: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="60%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#night)"/>
      <circle cx="300" cy="230" r="95" fill="#F8FAFC" opacity="0.15"/>
      <path d="M0 430 Q180 350 340 410 T600 380 L600 600 L0 600 Z" fill="#1E293B"/>
      <path d="M235 600 L265 310 C270 280 330 280 335 310 L365 600 Z" fill="#090D16"/>
      <circle cx="300" cy="240" r="34" fill="#090D16"/>
    </svg>
  `),
  untilIFoundYou: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#F5EBE6"/>
          <stop offset="50%" stop-color="#E2CFC4"/>
          <stop offset="100%" stop-color="#B89F91"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#warm)"/>
      <circle cx="300" cy="235" r="72" fill="#4A3728"/>
      <circle cx="300" cy="252" r="54" fill="#D4A373"/>
      <path d="M175 600 C190 420 240 355 300 355 C360 355 410 420 425 600 Z" fill="#2B2118"/>
    </svg>
  `),
  sunflower: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <radialGradient id="fire" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stop-color="#FACC15"/>
          <stop offset="45%" stop-color="#EA580C"/>
          <stop offset="80%" stop-color="#991B1B"/>
          <stop offset="100%" stop-color="#090A0F"/>
        </radialGradient>
      </defs>
      <rect width="600" height="600" fill="url(#fire)"/>
      <circle cx="300" cy="300" r="110" fill="#18181B"/>
      <path d="M180 480 Q300 350 420 480 L450 600 L150 600 Z" fill="#090A0F"/>
    </svg>
  `),
  anotherLove: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#BAE6FD"/>
          <stop offset="55%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#0369A1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#sea)"/>
      <path d="M0 370 Q150 350 300 370 T600 365 L600 600 L0 600 Z" fill="#075985" opacity="0.8"/>
      <circle cx="290" cy="270" r="42" fill="#0F172A"/>
      <path d="M210 600 C225 410 255 340 290 340 C325 340 355 410 370 600 Z" fill="#0F172A"/>
    </svg>
  `),
  chillVibesMoon: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="dreamSky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#93C5FD"/>
          <stop offset="50%" stop-color="#C4B5FD"/>
          <stop offset="100%" stop-color="#FBCFE8"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#dreamSky)"/>
      <!-- Glowing crescent moon -->
      <path d="M315 145 A65 65 0 1 0 385 235 A52 52 0 1 1 315 145 Z" fill="#FFFFFF" opacity="0.95"/>
      <!-- Soft pastel clouds -->
      <g fill="#FFFFFF" opacity="0.72">
        <circle cx="140" cy="460" r="85"/>
        <circle cx="235" cy="445" r="95"/>
        <circle cx="355" cy="460" r="105"/>
        <circle cx="475" cy="450" r="90"/>
        <rect x="60" y="460" width="480" height="140"/>
      </g>
      <g fill="#F8FAFC" opacity="0.9">
        <circle cx="100" cy="520" r="90"/>
        <circle cx="220" cy="510" r="110"/>
        <circle cx="360" cy="500" r="115"/>
        <circle cx="500" cy="515" r="95"/>
        <rect x="0" y="510" width="600" height="90"/>
      </g>
    </svg>
  `),
  dailyMixHeart: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="purplePastel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#DDD6FE"/>
          <stop offset="50%" stop-color="#C4B5FD"/>
          <stop offset="100%" stop-color="#A5B4FC"/>
        </linearGradient>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#F3E8FF"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#purplePastel)"/>
      <circle cx="300" cy="300" r="190" fill="#FFFFFF" opacity="0.22"/>
      <path d="M300 425 C300 425 165 335 165 240 C165 188 206 150 255 150 C282 150 300 168 300 185 C300 168 318 150 345 150 C394 150 435 188 435 240 C435 335 300 425 300 425 Z" fill="url(#heartGrad)"/>
    </svg>
  `),
  leavesArt: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="mist" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="50%" stop-color="#CBD5E1"/>
          <stop offset="100%" stop-color="#E0E7FF"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#mist)"/>
      <!-- Botanical palm/fern leaves -->
      <g stroke="#334155" stroke-width="5" stroke-linecap="round" opacity="0.75">
        <path d="M260 580 Q280 360 360 150" fill="none"/>
        <path d="M285 450 L200 380"/><path d="M295 400 L210 320"/><path d="M308 350 L230 265"/><path d="M322 300 L255 215"/><path d="M335 250 L280 175"/>
        <path d="M290 440 L385 390"/><path d="M302 390 L400 335"/><path d="M315 340 L410 280"/><path d="M328 290 L415 225"/><path d="M342 240 L415 180"/>
        <path d="M180 580 Q220 420 150 250" fill="none"/>
        <path d="M195 460 L120 410"/><path d="M192 410 L115 355"/><path d="M185 360 L115 300"/>
        <path d="M195 450 L255 400"/><path d="M190 400 L250 345"/>
      </g>
    </svg>
  `),
  focusTower: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="skyFocus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#93C5FD"/>
          <stop offset="55%" stop-color="#E0F2FE"/>
          <stop offset="100%" stop-color="#FDE68A"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#skyFocus)"/>
      <!-- Minimalist spire tower at dusk -->
      <line x1="300" y1="90" x2="300" y2="600" stroke="#334155" stroke-width="6"/>
      <polygon points="278,360 322,360 335,405 265,405" fill="#1E293B"/>
      <polygon points="288,260 312,260 318,360 282,360" fill="#334155"/>
      <polygon points="270,480 330,480 350,600 250,600" fill="#1E293B"/>
    </svg>
  `),
  workoutRunner: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="sunsetRun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#CBD5E1"/>
          <stop offset="55%" stop-color="#FDBA74"/>
          <stop offset="85%" stop-color="#94A3B8"/>
          <stop offset="100%" stop-color="#1E293B"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#sunsetRun)"/>
      <rect x="0" y="440" width="600" height="160" fill="#0F172A"/>
      <!-- Dynamic runner silhouette -->
      <circle cx="335" cy="185" r="24" fill="#0F172A"/>
      <path d="M325 215 L290 315 L215 365 M290 315 L350 380 L330 455 M318 235 L385 265 L415 235 M318 235 L255 260 L230 225" stroke="#0F172A" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
  `),
  sunsetRoad: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="roadSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1E293B"/>
          <stop offset="45%" stop-color="#C2410C"/>
          <stop offset="70%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#0F172A"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#roadSky)"/>
      <circle cx="300" cy="340" r="45" fill="#FEF08A"/>
      <polygon points="0,360 600,360 600,600 0,600" fill="#0F172A"/>
      <polygon points="285,360 315,360 490,600 110,600" fill="#334155"/>
      <line x1="300" y1="365" x2="300" y2="600" stroke="#FACC15" stroke-width="8" stroke-dasharray="28 20"/>
    </svg>
  `),
  oceanBreeze: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="oceanSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#BAE6FD"/>
          <stop offset="55%" stop-color="#E0F2FE"/>
          <stop offset="56%" stop-color="#0284C7"/>
          <stop offset="100%" stop-color="#0369A1"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#oceanSky)"/>
      <path d="M0 420 Q150 405 300 420 T600 415" stroke="#E0F2FE" stroke-width="4" fill="none" opacity="0.6"/>
      <path d="M0 490 Q150 475 300 490 T600 485" stroke="#E0F2FE" stroke-width="5" fill="none" opacity="0.75"/>
    </svg>
  `),
  heroGirl: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="heroBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#DBEAFE"/>
          <stop offset="45%" stop-color="#E0E7FF"/>
          <stop offset="100%" stop-color="#F3E8FF"/>
        </linearGradient>
        <radialGradient id="glowOrb" cx="0.75" cy="0.35" r="0.5">
          <stop offset="0%" stop-color="#93C5FD" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#E0E7FF" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="450" fill="url(#heroBg)"/>
      <rect width="800" height="450" fill="url(#glowOrb)"/>
      <!-- Flowing silk wave -->
      <path d="M280 450 Q420 260 620 220 T800 120 L800 450 Z" fill="#FFFFFF" opacity="0.45"/>
      <!-- Stylish girl with white over-ear headphones relaxing with eyes closed -->
      <g transform="translate(430, 35)">
        <!-- Flowing dark hair -->
        <path d="M165 65 C235 65 295 130 325 230 C345 295 360 360 370 415 L140 415 C140 320 145 140 165 65 Z" fill="#1E1B18"/>
        <!-- Face & neck in warm sunlit skin tone -->
        <path d="M115 145 C122 100 165 75 205 90 C240 102 250 155 232 198 C215 235 175 248 145 235 L152 300 L95 300 L118 220 C105 200 108 172 115 145 Z" fill="#F3C6A8"/>
        <!-- Closed serene eyelashes & warm smile -->
        <path d="M142 145 Q154 152 164 144" stroke="#3E2723" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M124 182 Q135 190 146 184" stroke="#A1624F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <!-- White soft sweater -->
        <path d="M40 415 C55 310 105 275 185 280 C255 285 295 335 315 415 Z" fill="#F8FAFC"/>
        <!-- Iconic White Over-Ear Headphones -->
        <path d="M150 68 C195 45 255 70 250 155" stroke="#FFFFFF" stroke-width="18" fill="none" stroke-linecap="round"/>
        <ellipse cx="222" cy="172" rx="36" ry="44" transform="rotate(-15 222 172)" fill="#FFFFFF"/>
        <ellipse cx="220" cy="172" rx="26" ry="34" transform="rotate(-15 220 172)" fill="#E2E8F0"/>
      </g>
    </svg>
  `),
  avatarNajwa: svgToDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="avBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E2E8F0"/>
          <stop offset="100%" stop-color="#CBD5E1"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#avBg)"/>
      <path d="M45 200 C50 135 72 118 100 118 C128 118 150 135 155 200 Z" fill="#1E293B"/>
      <path d="M52 85 C52 42 75 28 100 28 C125 28 148 42 148 85 C148 125 142 160 135 185 L65 185 C58 160 52 125 52 85 Z" fill="#181311"/>
      <ellipse cx="100" cy="84" rx="28" ry="34" fill="#F5CBA7"/>
      <path d="M86 78 Q91 74 95 78 M105 78 Q109 74 114 78" stroke="#1E1B18" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M93 96 Q100 101 107 96" stroke="#C06C54" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>
  `),
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Riki',
  fullName: 'Riki Pratama',
  handle: '@riki',
  avatarUrl: ARTWORK.avatarNajwa,
  audioQuality: 'Lossless (24-bit)',
  autoDownloadLikes: true,
};

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'track-satu-bulan',
    title: 'Satu Bulan',
    artist: 'Bernadya',
    album: 'Sialnya, Hidup Harus Tetap Berjalan',
    duration: 261, // 4:21
    coverUrl: ARTWORK.satuBulan,
    audioUrl:
      'https://archive.org/download/bernadya-full-album-terbaru-2024-viral-tiktok-lirik-playlist-lagu-bernadya-pilihan-terbaik-2024/BERNADYA%20FULL%20ALBUM%20TERBARU%202024%20VIRAL%20TIKTOK%20(Lirik)%20-%20PLAYLIST%20LAGU%20BERNADYA%20PILIHAN%20TERBAIK%202024.mp3',
    genre: 'Indie',
    lyrics: [
      { time: 0, text: 'Belum ada satu bulan' },
      { time: 18, text: 'Ku yakin masih ada sisa wangiku di bajumu' },
      { time: 38, text: 'Namun kau tampak baik saja' },
      { time: 56, text: 'Bahkan senyummu lebih lepas' },
      { time: 76, text: 'Terlalu indah' },
      { time: 88, text: 'Dirimu dimataku' },
      { time: 102, text: 'Terlalu sedih' },
      { time: 116, text: 'Hatiku tanpamu' },
      { time: 132, text: 'Ku mencoba untuk' },
      { time: 148, text: 'Melupakanmu' },
      { time: 165, text: 'Namun sulit rasanya' },
      { time: 185, text: 'Sedang aku di sini hampir gila' },
      { time: 210, text: 'Dan bukan dekat-dekat ini' },
      { time: 235, text: 'Tak ada yang berjalan seperti dulu lagi' },
    ],
  },
  {
    id: 'track-die-with-a-smile',
    title: 'Die With A Smile',
    artist: 'Lady Gaga, Bruno Mars',
    album: 'Die With A Smile - Single',
    duration: 251, // 4:11
    coverUrl: ARTWORK.dieWithASmile,
    audioUrl:
      'https://archive.org/download/die-with-a-smile/Die%20With%20A%20Smile.mp3',
    genre: 'Pop',
    lyrics: [
      { time: 0, text: 'Ooh, I just woke up from a dream' },
      { time: 15, text: 'Where you and I had to say goodbye' },
      { time: 30, text: 'And I don’t know what it all means' },
      { time: 45, text: 'But since I survived, I realized' },
      { time: 62, text: 'Wherever you go, that’s where I’ll follow' },
      { time: 78, text: 'Nobody’s promised tomorrow' },
      { time: 94, text: 'So I’ma love you every night like it’s the last night' },
      { time: 112, text: 'If the world was ending, I’d wanna be next to you' },
      { time: 135, text: 'If the party was over and our time on Earth was through' },
      { time: 162, text: 'I’d wanna hold you just for a while' },
      { time: 188, text: 'And die with a smile' },
      { time: 215, text: 'If the world was ending, I’d wanna be next to you' },
    ],
  },
  {
    id: 'track-waktu-yang-salah',
    title: 'Waktu yang Salah',
    artist: 'Fiersa Besari',
    album: 'Tempat Aku Pulang',
    duration: 313, // 5:13
    coverUrl: ARTWORK.waktuYangSalah,
    audioUrl:
      'https://archive.org/download/fiersabesarifttantriwaktuyangsalahunofficiallirikvideo1/Fiersa%20Besari%20ft%20Tantri%20-%20Waktu%20Yang%20Salah%20%20%5Bunofficial%20lirik%20video%5D.mp3',
    genre: 'Indie',
    lyrics: [
      { time: 0, text: 'Jangan tanyakan perasaanku' },
      { time: 20, text: 'Jika kau pun tak bisa beralih' },
      { time: 42, text: 'Dari masa lalu yang menghantuimu' },
      { time: 65, text: 'Karena sungguh ini tidak adil' },
      { time: 90, text: 'Bukan maksudku menyakitimu' },
      { time: 115, text: 'Namun hatiku sulit dibagi' },
      { time: 140, text: 'Pergilah bersama dia yang terbaik' },
      { time: 170, text: 'Jangan pernah hubungi aku lagi' },
      { time: 205, text: 'Kita adalah rasa yang tepat' },
      { time: 235, text: 'Di waktu yang salah' },
      { time: 270, text: 'Hidup memang kadang tak sejalan' },
    ],
  },
  {
    id: 'track-until-i-found-you',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    album: 'Angel Face',
    duration: 176, // 2:56
    coverUrl: ARTWORK.untilIFoundYou,
    audioUrl:
      'https://archive.org/download/stephen-sanchez-until-i-found-you-official-video/Stephen%20Sanchez%20-%20Until%20I%20Found%20You%20(Official%20Video).mp3',
    genre: 'Chill',
    lyrics: [
      { time: 0, text: 'Georgia, wrap me up in all your' },
      { time: 15, text: 'I want ya, in my arms' },
      { time: 32, text: 'Oh, let me hold ya' },
      { time: 48, text: 'I’ll never let you go again like I did' },
      { time: 66, text: 'Oh, I used to say' },
      { time: 82, text: 'I would never fall in love again until I found her' },
      { time: 105, text: 'I said, I would never fall unless it’s you I fall into' },
      { time: 132, text: 'I was lost within the darkness, but then I found her' },
      { time: 155, text: 'I found you' },
    ],
  },
  {
    id: 'track-sunflower',
    title: 'Sunflower',
    artist: 'Post Malone, Swae Lee',
    album: 'Hollywood’s Bleeding',
    duration: 158, // 2:38
    coverUrl: ARTWORK.sunflower,
    audioUrl:
      'https://archive.org/download/post-malone-swae-lee-sunflower-lyrics/Post%20Malone%20%26%20Swae%20Lee%20-%20Sunflower%20(Lyrics).mp3',
    genre: 'Pop',
    lyrics: [
      { time: 0, text: 'Ayy, ayy, ayy, ayy (ooh)' },
      { time: 14, text: 'Needless to say, I keep her in check' },
      { time: 30, text: 'She was a bad-bad, nevertheless' },
      { time: 48, text: 'Callin’ it quits now, baby, I’m a wreck' },
      { time: 68, text: 'Then you’re left in the dust, unless I stuck by ya' },
      { time: 92, text: 'You’re a sunflower, I think your love would be too much' },
      { time: 118, text: 'Or you’ll be left in the dust, unless I stuck by ya' },
      { time: 138, text: 'You’re the sunflower, you’re the sunflower' },
    ],
  },
  {
    id: 'track-another-love',
    title: 'Another Love',
    artist: 'Tom Odell',
    album: 'Long Way Down',
    duration: 247, // 4:07
    coverUrl: ARTWORK.anotherLove,
    audioUrl:
      'https://archive.org/download/TomOdellAnotherLove_201805/Tom%20Odell%20-%20Another%20Love.mp3',
    genre: 'Rock',
    lyrics: [
      { time: 0, text: 'I wanna take you somewhere so you know I care' },
      { time: 22, text: 'But it’s so cold and I don’t know where' },
      { time: 45, text: 'I brought you daffodils in a pretty string' },
      { time: 70, text: 'But they won’t flower like they did last spring' },
      { time: 98, text: 'And I’d sing a song, that’d be just ours' },
      { time: 126, text: 'But I sang ’em all to another heart' },
      { time: 155, text: 'And I wanna cry, I wanna learn to love' },
      { time: 185, text: 'But all my tears have been used up' },
      { time: 215, text: 'On another love, another love' },
    ],
  },
  {
    id: 'track-magnetic',
    title: 'Magnetic',
    artist: 'ILLIT',
    album: 'SUPER REAL ME',
    duration: 162, // 2:42
    coverUrl: ARTWORK.dailyMixHeart,
    audioUrl:
      'https://archive.org/download/magnetic-illit-audio/Magnetic%20-%20ILLIT%20(Audio).mp3',
    genre: 'K-Pop',
    lyrics: [
      { time: 0, text: 'Baby, I’m just trying to play it cool' },
      { time: 18, text: 'But I just can’t hide that I want you' },
      { time: 40, text: 'Wait a minute, 이게 뭐지? (뭐지?)' },
      { time: 65, text: '내 심장이 lub-dub, 자꾸만 뛰어' },
      { time: 95, text: 'You, you, you, you, like it’s magnetic' },
      { time: 125, text: 'U, u, u, u, u, u, u, u super 이끌림' },
    ],
  },
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-daily-mix',
    title: 'Daily Mix',
    subtitle: 'Your personal mix',
    coverUrl: ARTWORK.dailyMixHeart,
    displayCount: 320,
    trackIds: [
      'track-satu-bulan',
      'track-die-with-a-smile',
      'track-waktu-yang-salah',
      'track-until-i-found-you',
      'track-sunflower',
      'track-another-love',
    ],
  },
  {
    id: 'playlist-chill-vibes',
    title: 'Chill Vibes',
    subtitle: 'Relax and breathe',
    coverUrl: ARTWORK.chillVibesMoon,
    displayCount: 120,
    trackIds: [
      'track-satu-bulan',
      'track-die-with-a-smile',
      'track-waktu-yang-salah',
      'track-until-i-found-you',
      'track-sunflower',
      'track-another-love',
    ],
  },
  {
    id: 'playlist-focus',
    title: 'Focus',
    subtitle: 'Stay productive',
    coverUrl: ARTWORK.focusTower,
    displayCount: 85,
    trackIds: [
      'track-waktu-yang-salah',
      'track-satu-bulan',
      'track-another-love',
      'track-until-i-found-you',
    ],
  },
  {
    id: 'playlist-workout',
    title: 'Workout',
    subtitle: 'High energy boost',
    coverUrl: ARTWORK.workoutRunner,
    displayCount: 60,
    trackIds: [
      'track-sunflower',
      'track-die-with-a-smile',
      'track-magnetic',
      'track-another-love',
    ],
  },
  {
    id: 'playlist-sunset-drive',
    title: 'Sunset Drive',
    subtitle: 'Golden hour anthems',
    coverUrl: ARTWORK.sunsetRoad,
    displayCount: 45,
    trackIds: [
      'track-until-i-found-you',
      'track-sunflower',
      'track-satu-bulan',
    ],
  },
  {
    id: 'playlist-ocean-breeze',
    title: 'Ocean Breeze',
    subtitle: 'Coastal acoustic calm',
    coverUrl: ARTWORK.oceanBreeze,
    displayCount: 52,
    trackIds: [
      'track-another-love',
      'track-satu-bulan',
      'track-waktu-yang-salah',
    ],
  },
];
