import { Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal, useAsyncAction } from '../ui';
import { TURKISH_MONTHS } from '../../lib/dates';

interface HEvent { id: number; month: number; day: number; year: number; text: string; isActive: boolean; }
const EMPTY = { month: 1, day: 1, year: 2000, text: '', isActive: true };

export function HistoryEvents() {
  const [list, setList] = useState<HEvent[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  const load = () => adminApi.get<HEvent[]>('/api/admin/history-events').then(setList).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    await run(async () => {
      await adminApi.post('/api/admin/history-events', {
        month: Number(editing.month), day: Number(editing.day), year: Number(editing.year),
        text: editing.text, isActive: editing.isActive,
      });
      setEditing(null);
      load();
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Bu olay silinsin mi?')) return;
    await adminApi.del(`/api/admin/history-events/${id}`);
    load();
  };

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Geçmişte Bugün</div>
          <div className="adm-sub">Yaprağın arka yüzündeki tarihî olaylar — bizim veritabanımızda</div>
        </div>
        <button className="adm-btn" onClick={() => { setErr(null); setEditing({ ...EMPTY }); }}><Plus size={16} /> Yeni Olay</button>
      </div>

      <table className="adm-table">
        <thead><tr><th>Tarih</th><th>Yıl</th><th>Olay</th><th></th></tr></thead>
        <tbody>
          {list.map((e) => (
            <tr key={e.id}>
              <td className="adm-strong" style={{ whiteSpace: 'nowrap' }}>{e.day} {TURKISH_MONTHS[e.month - 1]}</td>
              <td>{e.year}</td>
              <td>{e.text}</td>
              <td><div className="adm-actions"><button className="adm-btn danger sm" onClick={() => remove(e.id)}><Trash size={13} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <Modal title="Yeni Olay" onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <div className="adm-field-row">
              <Field label="Ay">
                <select value={editing.month} onChange={(e) => setEditing({ ...editing, month: Number(e.target.value) })}>
                  {TURKISH_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </Field>
              <Field label="Gün"><input type="number" min={1} max={31} value={editing.day} onChange={(e) => setEditing({ ...editing, day: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Yıl"><input type="number" value={editing.year} onChange={(e) => setEditing({ ...editing, year: Number(e.target.value) })} /></Field>
            <Field label="Olay metni"><textarea value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} /></Field>
            <div className="adm-field adm-check">
              <input type="checkbox" id="he-active" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} />
              <label htmlFor="he-active">Aktif</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
