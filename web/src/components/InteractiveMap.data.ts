export interface MapPoint { x: number; y: number; ad: string; not: string; }
export interface MapData { baslik: string; altyazi: string; noktalar: MapPoint[]; rota: number[]; }

export const DEMO_MAPS: Record<string, MapData> = {
  'istanbulun-fethi': {
    baslik: 'Kuşatmanın Coğrafyası — 1453', altyazi: 'Bir noktaya tıklayarak detayları görün',
    noktalar: [
      { x: 30, y: 26, ad: 'Edirne', not: 'Sefer hazırlıklarının yürütüldüğü Osmanlı başkenti.' },
      { x: 62, y: 40, ad: 'Rumeli Hisarı', not: "1452'de Boğaz'ı kontrol için dört ayda inşa edildi." },
      { x: 70, y: 52, ad: 'Haliç', not: 'Gemilerin karadan yürütülerek indirildiği koy.' },
      { x: 74, y: 60, ad: 'Topkapı Surları', not: 'Son hücumun yapıldığı ve şehre girilen nokta.' },
    ],
    rota: [0, 1, 2, 3],
  },
  'piri-reis-haritasi': {
    baslik: 'Piri Reis Haritasının Yolculuğu', altyazi: 'Bir durağa tıklayarak detayları görün',
    noktalar: [
      { x: 18, y: 30, ad: 'Gelibolu', not: 'Piri Reis’in denizciliği öğrendiği liman.' },
      { x: 44, y: 44, ad: 'Akdeniz', not: 'Kitab-ı Bahriye’ye temel olan seferler.' },
      { x: 70, y: 36, ad: 'Kahire', not: 'Haritanın 1517’de Yavuz Sultan Selim’e sunulduğu şehir.' },
      { x: 56, y: 18, ad: 'İstanbul', not: 'Haritanın 1929’da Topkapı Sarayı’nda bulunduğu yer.' },
    ],
    rota: [0, 1, 2, 3],
  },
};
