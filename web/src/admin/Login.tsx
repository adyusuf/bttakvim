import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from './auth-context';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@bttakvim.local');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await login(email, password);
      nav('/admin');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Giriş başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="adm-login-brand">
          <div className="adm-login-mark">BT</div>
          <h1>BTTakvim Yönetim</h1>
          <p>Devam etmek için giriş yapın</p>
        </div>
        {err ? <div className="adm-err" style={{ marginBottom: 14 }}>{err}</div> : null}
        <div className="adm-form" style={{ padding: 0, gap: 14 }}>
          <div className="adm-field">
            <label>E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="adm-field">
            <label>Parola</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="admin123!" />
          </div>
          <button className="adm-btn" type="submit" disabled={busy} style={{ justifyContent: 'center', marginTop: 4 }}>
            {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </button>
          <p className="adm-hint" style={{ textAlign: 'center' }}>Geliştirme: admin@bttakvim.local / admin123!</p>
        </div>
      </form>
    </div>
  );
}
