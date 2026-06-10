import { Pencil, Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api';
import { Field, Modal, useAsyncAction } from '../ui';

interface BlogCategory { id: number; slug: string; name: string; }
interface Post {
  id: number; slug: string; title: string; summary: string; body: string;
  categoryId: number; categoryName: string; coverImageUrl: string | null; isPublished: boolean;
}

const empty = (categoryId: number) => ({
  categoryId, slug: '', title: '', summary: '', body: '', coverImageUrl: '', isPublished: true,
});

export function BlogPosts() {
  const [cats, setCats] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<(ReturnType<typeof empty> & { id?: number }) | null>(null);
  const { busy, err, setErr, run } = useAsyncAction();

  useEffect(() => { adminApi.get<BlogCategory[]>('/api/admin/blog-categories').then(setCats).catch(() => {}); }, []);
  const load = () => adminApi.get<Post[]>('/api/admin/blog-posts').then(setPosts).catch(() => {});
  useEffect(() => { load(); }, []);

  const catName = useMemo(() => Object.fromEntries(cats.map((c) => [c.id, c.name])), [cats]);

  const save = async () => {
    if (!editing) return;
    const body = {
      categoryId: Number(editing.categoryId), slug: editing.slug, title: editing.title,
      summary: editing.summary, body: editing.body, coverImageUrl: editing.coverImageUrl || null,
      isPublished: editing.isPublished,
    };
    await run(async () => {
      if (editing.id) await adminApi.put(`/api/admin/blog-posts/${editing.id}`, body);
      else await adminApi.post('/api/admin/blog-posts', body);
      setEditing(null);
      load();
    });
  };

  const remove = async (id: number) => {
    if (!confirm('Bu yazı silinsin mi?')) return;
    await adminApi.del(`/api/admin/blog-posts/${id}`);
    load();
  };

  const slugify = (s: string) =>
    s.toLocaleLowerCase('tr').replace(/[ışğüöç]/g, (m) => ({ 'ı': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c' }[m] ?? m))
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return (
    <>
      <div className="adm-head">
        <div>
          <div className="adm-title">Blog Yazıları</div>
          <div className="adm-sub">Önemli şahsiyetler, tarihî olaylar, şehirler, haritalar…</div>
        </div>
        <button className="adm-btn" disabled={!cats.length} onClick={() => { setErr(null); setEditing(empty(cats[0]?.id ?? 1)); }}>
          <Plus size={16} /> Yeni Yazı
        </button>
      </div>

      <table className="adm-table">
        <thead><tr><th>Başlık</th><th>Kategori</th><th>Durum</th><th></th></tr></thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td className="adm-strong">{p.title}</td>
              <td>{p.categoryName}</td>
              <td><span className={'adm-pill ' + (p.isPublished ? 'ok' : 'off')}>{p.isPublished ? 'Yayında' : 'Taslak'}</span></td>
              <td><div className="adm-actions">
                <button className="adm-btn ghost sm" onClick={() => { setErr(null); setEditing({ ...p, coverImageUrl: p.coverImageUrl ?? '' }); }}><Pencil size={13} /></button>
                <button className="adm-btn danger sm" onClick={() => remove(p.id)}><Trash size={13} /></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing ? (
        <Modal title={editing.id ? 'Yazıyı Düzenle' : 'Yeni Yazı'} onClose={() => setEditing(null)}
          footer={<>
            <button className="adm-btn ghost" onClick={() => setEditing(null)}>Vazgeç</button>
            <button className="adm-btn" disabled={busy} onClick={save}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
          </>}>
          <div className="adm-form">
            {err ? <div className="adm-err">{err}</div> : null}
            <Field label="Başlık">
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })} />
            </Field>
            <div className="adm-field-row">
              <Field label="Slug"><input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Kategori">
                <select value={editing.categoryId} onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })}>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Özet"><input value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></Field>
            <Field label="Kapak görseli (URL, isteğe bağlı)"><input value={editing.coverImageUrl} onChange={(e) => setEditing({ ...editing, coverImageUrl: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Gövde (paragraflar arasına boş satır)"><textarea style={{ minHeight: 200 }} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
            <div className="adm-field adm-check">
              <input type="checkbox" id="bp-pub" checked={editing.isPublished} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
              <label htmlFor="bp-pub">Yayında</label>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
