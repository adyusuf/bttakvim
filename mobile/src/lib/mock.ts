import { fromIso, TURKISH_MONTHS } from './dates';
import type { Leaf, PrayerTimes } from './types';

const TURKISH_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi',
];

/**
 * Backend'e ulaşılamadığında kullanılan yedek (mock) yaprak.
 * İçerik, tasarım sistemindeki 1 Ocak 2026 referans gününden alınmıştır.
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
    hijri: { day: 12, monthName: 'Receb', year: 1447, text: '12 Receb 1447' },
    rumi: { day: 19, monthName: 'Aralık', year: 1441, text: '19 Aralık 1441' },
    seasonal: { label: 'Kasım', day: 55 },
    coldPeriod: { label: 'Zemheri', day: 11 },
    moon: { key: 'first_quarter', name: 'İlk Dördün', emoji: '', illumination: 0.5, source: 'mock' },
    quote: { text: 'Güzellik kısa ömürlü bir istibdattır.', author: 'George B. Shaw' },
    names: {
      girl: { name: 'İzel', meaning: 'Çok güzel, eşsiz' },
      boy: { name: 'Acun', meaning: 'Dünya, kâinat' },
    },
    specialDay: 'Çevrimdışı Örnek Yaprak',
    historyEvents: [
      { year: 1959, text: 'Küba Devrimi: Fidel Castro liderliğindeki hareket iktidarı ele geçirdi.' },
      { year: 1995, text: 'Dünya Ticaret Örgütü (WTO) resmen kuruldu.' },
      { year: 2002, text: 'Euro banknot ve madeni paraları on iki Avrupa ülkesinde tedavüle girdi.' },
    ],
    contents: [
      {
        itemId: 0,
        categorySlug: 'gunun-sohbeti',
        categoryName: 'Günün Sohbeti',
        icon: '',
        title: 'İnsanlar Eşittir',
        body: 'Allah’ın huzurunda ırkı, rengi, dili ya da cinsiyeti fark etmeksizin herkes eşittir. İnsanlık; hayatta ve ölümde, haklarda ve borçlarda, kanun önünde ve vicdanda eşitlenmiştir.',
        likes: 0,
        comments: 0,
      },
      {
        itemId: 1,
        categorySlug: 'biraz-da-felsefe',
        categoryName: 'Biraz da Felsefe',
        icon: '',
        title: 'Her An Felsefe',
        body: 'Düşünce dünyası geliştikçe felsefe üç büyük soru üzerinde yoğunlaşır: Doğanın işleri, insanın işleri ve bu ikisi arasında kurulan ilişki.',
        likes: 0,
        comments: 0,
      },
      {
        itemId: 2,
        categorySlug: 'gastronomi',
        categoryName: 'Yemek Kültürü',
        icon: '',
        title: 'Gastronom ve Gurme',
        body: 'Gastronomi, insanların sağlıklı beslenmesini araştıran bir bilim dalıdır. Gurme öncelikle damak tadına odaklanırken; gastronom, başkalarına yol göstermek için araştırma yapar.',
        likes: 0,
        comments: 0,
      },
      {
        itemId: 3,
        categorySlug: 'gunun-menusu',
        categoryName: 'Günün Menüsü',
        icon: '',
        title: 'Klasik Sofra',
        body: 'Tarhana çorbası, Tas kebabı, Pirinç pilavı, Çoban salata',
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
    dayLengthDeltaSeconds: 41,
    dayLengthDeltaText: '0 dakika 41 saniye',
    dayFraction: 0.387,
    qiblaTime: '11:12',
    source: 'mock-offline',
  };
}

export const MOCK_CITIES = [
  { slug: 'istanbul', name: 'İstanbul' },
  { slug: 'ankara', name: 'Ankara' },
  { slug: 'izmir', name: 'İzmir' },
  { slug: 'adana', name: 'Adana' },
  { slug: 'edirne', name: 'Edirne' },
  { slug: 'erzurum', name: 'Erzurum' },
];
