/** Admin paylaşılan UI parçaları: Modal, Field. */
import { X } from '@phosphor-icons/react';

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
