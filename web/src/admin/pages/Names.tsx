import { DownloadSimple, Pencil, Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal } from '../ui';
import { useAsyncAction } from '../useAsyncAction';

interface BabyName { id: number; name: string; gender: string; meaning: string | null; isActive: boolean; }
interface ImportResult { datasetTotal: number; alreadyPresent: number; added: number; }

const EMPTY = { name: '', gender: 'K', meaning: '', isActive: true };

export function Names() {
  const [list, setList] = useState<BabyName[]>([]);
  const [gender, setGender] = useState<'' | 'K' | 'E'>('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<BabyName | typeof EMPTY | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  const load = () => {
    const params = new URLSearchParams();
    if (gender) params.set('gender', gender);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    adminApi.get<BabyName[]>(`/api/admin/names${qs ? `?${qs}` : ''}`).then(setList).catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [gender, q]);

  const save = async () => {
    if (!editing) return;
    const body = { name: editing.name, gender: editing.gender, meaning: editing.meaning || null, isActive: editing.isActive };
    await run(async () => {
      if ('id' in editing) await adminApi.put(`/api/admin/names/${editing.id}`, body);
      else await adminApi.post('/api/admin/names', body);
      setEditing(null);
      load();
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Bu isim silinsin mi?')) return;
    await adminApi.del(`/api/admin/names/${id}`);
    load();
  };

  const importDataset = async () => {
    if (!confirm('Gömülü isim veri kümesi içe aktarılsın mı? Eksik kayıtlar eklenir, mevcutlar değiştirilmez.')) return;
    setNote(null);
    await run(async () => {
      const r = await adminApi.post<ImportResult>('/api/admin/names/import', {});
      setNote(`${r.added} yeni eklendi · ${r.alreadyPresent} zaten vardı`);
      load();
    });
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">İsimler</div>
          <div className="adm-sub">Bebek isimleri havuzu</div>
        </div>
        <div className="adm-actions">
          <button className="adm-btn ghost" disabled={busy} onClick={importDataset}
            title="Eksik kayıtları ekler, mevcutları değiştirmez">
            <DownloadSimple size={16} /> Veri kümesini içe aktar
          </button>
          <button className="adm-btn" onClick={() => { setErr(null); setEditing({ ...EMPTY }); }}>
            <Plus size={16} /> Yeni İsim
          </button>
        </div>
      </div>

      {note ? <div className="adm-note">{note}</div> : null}
      {err && !editing ? <div className="adm-err">{err}</div> : null}

      <div className="adm-field-row" style={{ marginBottom: 16 }}>
        <div className="adm-field" style={{ maxWidth: 200 }}>
          <label>Cinsiyete göre süz</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as '' | 'K' | 'E')}>
            <option value="">Hepsi</option>
            <option value="K">Kız</option>
            <option value="E">Erkek</option>
          </select>
        </div>
        <div className="adm-field" style={{ maxWidth: 280 }}>
          <label>Ara</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim ara…" />
        </div>
      </div>

      <table className="adm-table">
        <thead><tr><th>İsim</th><th>Cinsiyet</th><th>Anlam</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {list.map((n) => (
            <tr key={n.id}>
              <td className="adm-strong">{n.name}</td>
              <td>{n.gender === 'K' ? 'Kız' : 'Erkek'}</td>
              <td>{n.meaning ?? '—'}</td>
              <td><span className={'adm-pill ' + (n.isActive ? 'ok' : 'off')}>{n.isActive ? 'Aktif' : 'Pasif'}</span></td>
              <td><div className="adm-actions">
                <button className="adm-btn ghost sm" onClick={() => { setErr(null); setEditing(n); }}><Pencil size={13} /></button>
                <button className="adm-btn danger sm" onClick={() => remove(n.id)}><Trash size={13} /></button>
              </div></td>
            </tr>
          ))}
          {list.length === 0 ? <tr><td colSpan={5}><div className="adm-empty">Bu süzgeçte isim yok.</div></td></tr> : null}
        </tbody>
      </table>

      {editing ? (
        <Modal
          title={'id' in editing ? 'İsmi Düzenle' : 'Yeni İsim'}
          onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <div className="adm-field-row">
              <Field label="İsim"><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Cinsiyet">
                <select value={editing.gender} onChange={(e) => setEditing({ ...editing, gender: e.target.value })}>
                  <option value="K">Kız</option>
                  <option value="E">Erkek</option>
                </select>
              </Field>
            </div>
            <Field label="Anlam"><textarea value={editing.meaning ?? ''} onChange={(e) => setEditing({ ...editing, meaning: e.target.value })} placeholder="İsteğe bağlı" /></Field>
            <div className="adm-field adm-check">
              <input type="checkbox" id="name-active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <label htmlFor="name-active">Aktif</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
