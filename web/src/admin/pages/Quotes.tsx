import { DownloadSimple, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal } from '../ui';
import { useAsyncAction } from '../useAsyncAction';

interface Quote { id: number; text: string; author: string | null; isActive: boolean; }
interface ImportResult { datasetTotal: number; alreadyPresent: number; added: number; }

const EMPTY = { text: '', author: '', isActive: true };

export function Quotes() {
  const [list, setList] = useState<Quote[]>([]);
  const [editing, setEditing] = useState<Quote | typeof EMPTY | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  const load = () => adminApi.get<Quote[]>('/api/admin/quotes').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const importDataset = async () => {
    if (!confirm('Gömülü söz veri kümesi içe aktarılsın mı? Eksik kayıtlar eklenir, mevcutlar değiştirilmez.')) return;
    setNote(null);
    await run(async () => {
      const r = await adminApi.post<ImportResult>('/api/admin/quotes/import', {});
      setNote(`${r.added} yeni eklendi · ${r.alreadyPresent} zaten vardı`);
      await load();
    });
  };

  const save = async () => {
    if (!editing) return;
    const body = { text: editing.text, author: editing.author || null, isActive: editing.isActive };
    await run(async () => {
      if ('id' in editing) await adminApi.put(`/api/admin/quotes/${editing.id}`, body);
      else await adminApi.post('/api/admin/quotes', body);
      setEditing(null);
      await load();
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Bu söz silinsin mi?')) return;
    await adminApi.del(`/api/admin/quotes/${id}`);
    load();
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Sözler</div>
          <div className="adm-sub">Atasözü, vecize ve özlü söz havuzu</div>
        </div>
        <div className="adm-actions">
          <button className="adm-btn ghost" disabled={busy} onClick={importDataset}
            title="Eksik kayıtları ekler, mevcutları değiştirmez">
            <DownloadSimple size={16} /> Veri kümesini içe aktar
          </button>
          <button className="adm-btn" onClick={() => { setErr(null); setEditing({ ...EMPTY }); }}>
            <Plus size={16} /> Yeni Söz
          </button>
        </div>
      </div>

      {note ? <div className="adm-note">{note}</div> : null}
      {err && !editing ? <div className="adm-err">{err}</div> : null}

      <table className="adm-table">
        <thead><tr><th>Söz metni</th><th>Yazar</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {list.map((q) => (
            <tr key={q.id}>
              <td className="adm-strong">{q.text}</td>
              <td>{q.author ?? '—'}</td>
              <td><span className={'adm-pill ' + (q.isActive ? 'ok' : 'off')}>{q.isActive ? 'Aktif' : 'Pasif'}</span></td>
              <td><div className="adm-actions">
                <button className="adm-btn ghost sm" onClick={() => { setErr(null); setEditing(q); }}><Pencil size={13} /></button>
                <button className="adm-btn danger sm" onClick={() => remove(q.id)}><Trash size={13} /></button>
              </div></td>
            </tr>
          ))}
          {list.length === 0 ? <tr><td colSpan={4}><div className="adm-empty">Henüz söz yok.</div></td></tr> : null}
        </tbody>
      </table>

      {editing ? (
        <Modal
          title={'id' in editing ? 'Sözü Düzenle' : 'Yeni Söz'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <Field label="Söz metni"><textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} /></Field>
            <Field label="Yazar"><input value={editing.author ?? ''} onChange={(e) => setEditing({ ...editing, author: e.target.value })} placeholder="İsteğe bağlı" /></Field>
            <div className="adm-field adm-check">
              <input type="checkbox" id="quote-active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <label htmlFor="quote-active">Aktif</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
