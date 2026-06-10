export interface DatePart {
  day: number;
  monthName: string;
  year: number;
  text: string;
}

export interface Seasonal {
  label: string;
  day: number;
}

export interface MoonInfo {
  key: string;
  name: string;
  emoji: string;
  illumination: number;
  source: string;
}

export interface QuoteInfo {
  text: string;
  author?: string | null;
}

export interface NameInfo {
  name: string;
  meaning?: string | null;
}

export interface HistoryEventInfo {
  year: number;
  text: string;
}

export interface LeafContent {
  itemId: number;
  categorySlug: string;
  categoryName: string;
  icon: string;
  title: string;
  body: string;
  likes: number;
  comments: number;
}

export interface LeafStats {
  likes: number;
  saves: number;
  comments: number;
}

export interface Leaf {
  id: number;
  date: string; // yyyy-MM-dd
  day: number;
  monthName: string;
  year: number;
  weekdayName: string;
  dayOfYear: number;
  hijri: DatePart;
  rumi: DatePart;
  seasonal: Seasonal;
  coldPeriod?: Seasonal | null;
  moon: MoonInfo;
  quote: QuoteInfo;
  names: { girl?: NameInfo | null; boy?: NameInfo | null };
  specialDay?: string | null;
  historyEvents: HistoryEventInfo[];
  contents: LeafContent[];
  stats: LeafStats;
}

export interface PrayerTimes {
  date: string;
  citySlug: string;
  cityName: string;
  times: {
    imsak: string;
    gunes: string;
    ogle: string;
    ikindi: string;
    aksam: string;
    yatsi: string;
  };
  dayLength: string;
  nightLength: string;
  dayLengthDeltaMinutes: number;
  qiblaTime: string;
  source: string;
}

export interface CityRef {
  slug: string;
  name: string;
}
