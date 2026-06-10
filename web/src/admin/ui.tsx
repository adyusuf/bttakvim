/** Admin paylaşılan UI parçaları: Modal, Field, Confirm. */
import { X } from '@phosphor-icons/react';
import { useState } from 'react';

export function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode;
}) {
  return (
    <div className="adm-modal-bg" onMouseDown={onClose}>
      <div className="adm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="adm-modal-h">
          <h3>{title}</h3>
          <button className="adm-modal-x" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
        {footer ? <div className="adm-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Bir hata oluştu');
      throw e;
    } finally {
      setBusy(false);
    }
  };
  return { busy, err, setErr, run };
}
