import { useState } from 'react';
import { CloseIcon, CheckCircleIcon } from '../Icons';

export default function ModalNumero({ numero, onClose, onSave, onDelete }) {
  const [nombre, setNombre] = useState(numero.nombre || '');
  const [telefono, setTelefono] = useState(numero.telefono || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) return;
    setLoading(true);
    await onSave(numero.numero, nombre.trim(), telefono.trim());
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Liberar el número ${numero.numero}?`)) return;
    setLoading(true);
    await onDelete(numero.numero);
    setLoading(false);
  };

  // Solo permite dígitos en el campo de teléfono
  const handleTelefono = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setTelefono(val);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Número <span style={{ color: 'var(--accent)' }}>{numero.numero}</span></h3>
          <button className="btn-ghost btn-icon-only" onClick={onClose}><CloseIcon size={18} /></button>
        </div>

        {numero.apartado && (
          <div className="info-box info-box-success" style={{ marginBottom: 16 }}>
            <CheckCircleIcon size={14} color="var(--accent-dark)" /> Número apartado
          </div>
        )}

        <div className="field">
          <label>Nombre del comprador *</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: María García"
            disabled={loading}
          />
        </div>
        <div className="field">
          <label>Teléfono / Contacto</label>
          <input
            value={telefono}
            onChange={handleTelefono}
            placeholder="Ej: 3001234567"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={15}
            disabled={loading}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn-primary" onClick={handleSave} disabled={loading || !nombre.trim()} style={{ flex: 1 }}>
            {loading ? '...' : numero.apartado ? 'Actualizar' : 'Apartar número'}
          </button>
          {numero.apartado && (
            <button className="btn-danger" onClick={handleDelete} disabled={loading}>Liberar</button>
          )}
        </div>
      </div>
    </div>
  );
}