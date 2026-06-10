import { Pencil, Plus } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal, useAsyncAction } from '../ui';

interface Category {
  id: number; slug: string; name: string; icon: string; sortOrder: number; isActive: boolean; itemCount: number;
}

const EMPTY = { slug: '', name: '', icon: '', sortOrder: 0, isActive: true };

export function Categories() {
  const [list, setList] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | typeof EMPTY | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  const load = () => adminApi.get<Category[]>('/api/admin/categories').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const body = { slug: editing.slug, name: editing.name, icon: editing.icon, sortOrder: Number(editing.sortOrder), isActive: editing.isActive };
    await run(async () => {
      if ('id' in editing) await adminApi.put(`/api/admin/categories/${editing.id}`, body);
      else await adminApi.post('/api/admin/categories', body);
      setEditing(null);
      await load();
    });
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Kategoriler</div>
          <div className="adm-sub">Yaprak arka yüzü içerik kategorileri</div>
        </div>
        <button className="adm-btn" onClick={() => { setErr(null); setEditing({ ...EMPTY, sortOrder: list.length + 1 }); }}>
          <Plus size={16} /> Yeni Kategori
        </button>
      </div>

      <table className="adm-table">
        <thead><tr><th>Sıra</th><th>Ad</th><th>Slug</th><th>İkon</th><th>Öğe</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {list.map((c) => (
            <tr key={c.id}>
              <td>{c.sortOrder}</td>
              <td className="adm-strong">{c.name}</td>
              <td><code>{c.slug}</code></td>
              <td>{c.icon}</td>
              <td>{c.itemCount}</td>
              <td><span className={'adm-pill ' + (c.isActive ? 'ok' : 'off')}>{c.isActive ? 'Aktif' : 'Pasif'}</span></td>
              <td><div className="adm-actions"><button className="adm-btn ghost sm" onClick={() => { setErr(null); setEditing(c); }}><Pencil size={13} /> Düzenle</button></div></td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <Modal
          title={'id' in editing ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <div className="adm-field-row">
              <Field label="Ad"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Slug"><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="ornek-slug" /></Field>
            </div>
            <div className="adm-field-row">
              <Field label="İkon (emoji)"><input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} placeholder="📖" /></Field>
              <Field label="Sıra"><input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} /></Field>
            </div>
            <div className="adm-field adm-check">
              <input type="checkbox" id="cat-active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <label htmlFor="cat-active">Aktif (yapraklarda gösterilir)</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
