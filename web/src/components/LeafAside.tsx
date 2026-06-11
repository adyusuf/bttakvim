import { PushPin } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { fetchLeaf, fetchPrayerTimes } from '../lib/api';
import { todayIso } from '../lib/dates';
import { useStore } from '../lib/store-context';
import type { Leaf, PrayerTimes } from '../lib/types';
import { LeafBack, LeafFront } from './Leaf';

export function LeafAside() {
  const { cities, citySlug, setCity, prayerPrefs } = useStore();
  const [leaf, setLeaf] = useState<Leaf | null>(null);
  const [prayer, setPrayer] = useState<PrayerTimes | null>(null);
  const iso = todayIso();

  useEffect(() => {
    fetchLeaf(iso).then(setLeaf).catch(() => setLeaf(null));
  }, [iso]);

  useEffect(() => {
    fetchPrayerTimes(iso, citySlug, prayerPrefs).then(setPrayer).catch(() => setPrayer(null));
  }, [iso, citySlug, prayerPrefs]);

  if (!leaf) return <aside className="web-aside" />;

  return (
    <aside className="web-aside">
      <div className="web-aside-head">
        <PushPin size={15} weight="fill" color="var(--accent)" />
        <span>Bugünün Yaprağı</span>
      </div>
      <div className="bt-leaf-face">
        <LeafFront leaf={leaf} prayer={prayer} location={{ cities, citySlug, setCity }} />
      </div>
      <div className="web-aside-rule"><span>Yaprağın Arka Yüzü</span><i /></div>
      <div className="bt-leaf-face">
        <LeafBack leaf={leaf} />
      </div>
    </aside>
  );
}
