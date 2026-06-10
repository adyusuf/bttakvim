import { Pencil, Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal, useAsyncAction } from '../ui';

interface Category { id: number; name: string; slug: string; }
interface Item {
  id: number; categoryId: number; title: string; body: string;
  pinnedMonth: number | null; pinnedDay: number | null; pinnedDate: string | null; isActive: boolean; source: string;
}

const empty = (categoryId: number): Omit<Item, 'id' | 'source'> => ({
  categoryId, title: '', body: '', pinnedMonth: null, pinnedDay: null, pinnedDate: null, isActive: true,
});

export function ContentItems() {
  const [cats, setCats] = useState<Category[]>([]);
  const [filter, setFilter] = useState<number | ''>('');
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<(Omit<Item, 'id' | 'source'> & { id?: number }) | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  useEffect(() => { adminApi.get<Category[]>('/api/admin/categories').then(setCats).catch(() => {}); }, []);
  const load = () => {
    const qs = filter ? `?categoryId=${filter}` : '';
    adminApi.get<Item[]>(`/api/admin/content-items${qs}`).then(setItems).catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [filter]);

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats]);

  const save = async () => {
    if (!editing) return;
    const body = {
      categoryId: Number(editing.categoryId), title: editing.title, body: editing.body,
      pinnedMonth: editing.pinnedMonth || null, pinnedDay: editing.pinnedDay || null,
      pinnedDate: editing.pinnedDate || null, isActive: editing.isActive,
    };
    await run(async () => {
      if (editing.id) await adminApi.put(`/api/admin/content-items/${editing.id}`, body);
      else await adminApi.post('/api/admin/content-items', body);
      setEditing(null);
      load();
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Bu içerik öğesi silinsin mi?')) return;
    await adminApi.del(`/api/admin/content-items/${id}`);
    load();
  };

  const pinText = (it: Item) =>
    it.pinnedDate ? it.pinnedDate : it.pinnedMonth ? `${it.pinnedDay}.${it.pinnedMonth} (her yıl)` : 'Havuz';

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">İçerik Öğeleri</div>
          <div className="adm-sub">Felsefe, gastronomi, sözler, sohbet, menü… havuzu</div>
        </div>
        <button className="adm-btn" disabled={!cats.length} onClick={() => { setErr(null); setEditing(empty(cats[0]?.id ?? 1)); }}>
          <Plus size={16} /> Yeni Öğe
        </button>
      </div>

      <div className="adm-field" style={{ maxWidth: 280, marginBottom: 16 }}>
        <label>Kategoriye göre süz</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Tüm kategoriler</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <table className="adm-table">
        <thead><tr><th>Başlık</th><th>Kategori</th><th>Sabitleme</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td className="adm-strong">{it.title}</td>
              <td>{catName[it.categoryId] ?? it.categoryId}</td>
              <td>{pinText(it)}</td>
              <td><span className={'adm-pill ' + (it.isActive ? 'ok' : 'off')}>{it.isActive ? 'Aktif' : 'Pasif'}</span></td>
              <td><div className="adm-actions">
                <button className="adm-btn ghost sm" onClick={() => { setErr(null); setEditing(it); }}><Pencil size={13} /></button>
                <button className="adm-btn danger sm" onClick={() => remove(it.id)}><Trash size={13} /></button>
              </div></td>
            </tr>
          ))}
          {items.length === 0 ? <tr><td colSpan={5}><div className="adm-empty">Bu süzgeçte öğe yok.</div></td></tr> : null}
        </tbody>
      </table>

      {editing ? (
        <Modal
          title={editing.id ? 'İçeriği Düzenle' : 'Yeni İçerik Öğesi'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <div className="adm-field-row">
              <Field label="Kategori">
                <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Başlık"><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
            </div>
            <Field label="Gövde"><textarea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
            <div className="adm-section-rule"><span>Sabitleme (isteğe bağlı)</span><i /></div>
            <p className="adm-hint">Her yıl aynı güne sabitlemek için Ay + Gün; tek seferlik için Tam Tarih girin. Boşsa rastgele havuzdadır.</p>
            <div className="adm-field-row">
              <Field label="Ay (1-12)"><input type="number" min={1} max={12} value={editing.pinnedMonth ?? ''} onChange={(e) => setEditing({ ...editing, pinnedMonth: e.target.value ? Number(e.target.value) : null })} /></Field>
              <Field label="Gün (1-31)"><input type="number" min={1} max={31} value={editing.pinnedDay ?? ''} onChange={(e) => setEditing({ ...editing, pinnedDay: e.target.value ? Number(e.target.value) : null })} /></Field>
            </div>
            <Field label="Tam Tarih"><input type="date" value={editing.pinnedDate ?? ''} onChange={(e) => setEditing({ ...editing, pinnedDate: e.target.value || null })} /></Field>
            <div className="adm-field adm-check">
              <input type="checkbox" id="it-active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <label htmlFor="it-active">Aktif</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
