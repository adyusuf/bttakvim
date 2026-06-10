import { fromIso, TURKISH_MONTHS } from './dates';
import type { Leaf, PrayerTimes } from './types';

const TURKISH_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
];

/**
 * Backend'e ulaşılamadığında kullanılan yedek (mock) yaprak.
 * Hicri/Rumi gibi hesaplar sunucuda yapılır; burada yer tutucu gösterilir.
 */
export function mockLeaf(iso: string): Leaf {
  const d = fromIso(iso);
  const start = new Date(d.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((d.getTime() - start.getTime()) / 86400000);

  return {
    id: 0,
    date: iso,
    day: d.getDate(),
    monthName: TURKISH_MONTHS[d.getMonth()],
    year: d.getFullYear(),
    weekdayName: TURKISH_DAYS[d.getDay()],
    dayOfYear,
    hijri: { day: 0, monthName: '—', year: 0, text: 'Sunucu bekleniyor' },
    rumi: { day: 0, monthName: '—', year: 0, text: 'Sunucu bekleniyor' },
    seasonal: { label: 'Takvim', day: dayOfYear },
    coldPeriod: null,
    moon: { key: 'full_moon', name: 'Dolunay', emoji: '🌕', illumination: 1, source: 'mock' },
    quote: {
      text: 'Erdem servetlerin en büyüğüdür.',
      author: 'Naci Kasım',
    },
    names: {
      girl: { name: 'İzel', meaning: 'Çok güzel, eşsiz' },
      boy: { name: 'Acun', meaning: 'Dünya, kâinat' },
    },
    specialDay: null,
    historyEvents: [
      { year: 1959, text: 'Çevrimdışı örnek: Küba devrimi zafere ulaştı.' },
    ],
    contents: [
      {
        itemId: 0,
        categorySlug: 'faydali-bilgiler',
        categoryName: 'Faydalı Bilgiler',
        icon: '✅',
        title: 'Çevrimdışı mod',
        body: 'Sunucuya bağlanılamadı. Gösterilen yaprak örnek veridir; bağlantı kurulunca gerçek yaprak yüklenecek.',
        likes: 0,
        comments: 0,
      },
    ],
    stats: { likes: 0, saves: 0, comments: 0 },
  };
}

export function mockPrayerTimes(iso: string): PrayerTimes {
  return {
    date: iso,
    citySlug: 'istanbul',
    cityName: 'İstanbul',
    times: {
      imsak: '06:50',
      gunes: '08:22',
      ogle: '13:12',
      ikindi: '15:32',
      aksam: '17:53',
      yatsi: '19:19',
    },
    dayLength: '09 s 17 d',
    nightLength: '14 s 43 d',
    dayLengthDeltaMinutes: 1,
    qiblaTime: '11:12',
    source: 'mock-offline',
  };
}

export const MOCK_CITIES = [
  { slug: 'istanbul', name: 'İstanbul' },
  { slug: 'ankara', name: 'Ankara' },
  { slug: 'izmir', name: 'İzmir' },
];
