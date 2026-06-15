import { useState, useEffect, useCallback } from 'react';
import { sb } from '../../lib/supabaseClient';
import { CloseIcon } from '../Icons';

function getInitials(emailOrName) {
  const parts = emailOrName.split('@')[0].split(/[._-]/);
  return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2) || '?';
}

export default function ModalColaboradores({ rifaId, onClose, toast }) {
  const [email, setEmail] = useState('');
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const cargar = useCallback(async () => {
    const { data } = await sb.from('colaboradores').select('*').eq('rifa_id', rifaId);
    setLista(data || []);
  }, [rifaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const agregar = async () => {
    const emailLower = email.trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@')) {
      toast('Email inválido', 'error');
      return;
    }

    setVerificando(true);

    let nombreColaborador = null;
    let usuarioEncontrado = false;

    // Intento 1: buscar en tabla profiles (solo columna "name")
    const { data: perfil } = await sb
      .from('profiles')
      .select('id, email, name')
      .eq('email', emailLower)
      .maybeSingle();

    if (perfil) {
      usuarioEncontrado = true;
      nombreColaborador = perfil.name || null;
    }

    // Intento 2: buscar en colaboradores de otras rifas
    if (!usuarioEncontrado) {
      const { data: otraColab } = await sb
        .from('colaboradores')
        .select('email, nombre')
        .eq('email', emailLower)
        .limit(1)
        .maybeSingle();
      if (otraColab) {
        usuarioEncontrado = true;
        nombreColaborador = otraColab.nombre || null;
      }
    }

    if (!usuarioEncontrado) {
      setVerificando(false);
      toast(`No se encontró ninguna cuenta con el correo "${emailLower}". Pídele que cree su cuenta en Rifally primero.`, 'error');
      return;
    }

    setVerificando(false);
    setLoading(true);

    // Verificar si ya es colaborador
    const { data: yaExiste } = await sb
      .from('colaboradores')
      .select('id')
      .eq('rifa_id', rifaId)
      .eq('email', emailLower)
      .maybeSingle();
    if (yaExiste) {
      toast('Este usuario ya es colaborador', 'error');
      setLoading(false);
      return;
    }

    const nombre = nombreColaborador || emailLower.split('@')[0];
    const { error } = await sb.from('colaboradores').insert({
      rifa_id: rifaId,
      email: emailLower,
      nombre,
    });

    if (error) {
      toast('Error al agregar colaborador', 'error');
    } else {
      toast(`¡${nombre} agregado como colaborador!`, 'success');
      setEmail('');
      cargar();
    }
    setLoading(false);
  };

  const eliminar = async (id) => {
    await sb.from('colaboradores').delete().eq('id', id);
    cargar();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Colaboradores</h3>
          <button className="btn-ghost btn-icon-only" onClick={onClose}><CloseIcon size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Los colaboradores pueden apartar y gestionar números en esta rifa. Solo puedes agregar usuarios que ya tengan cuenta en Rifally.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            onKeyDown={e => e.key === 'Enter' && agregar()}
            disabled={loading || verificando}
          />
          <button className="btn-primary" onClick={agregar} disabled={loading || verificando} style={{ whiteSpace: 'nowrap' }}>
            {verificando ? '...' : 'Agregar'}
          </button>
        </div>

        {lista.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}></div>
            <p style={{ color: 'var(--text3)', fontSize: 13 }}>Sin colaboradores aún</p>
            <p style={{ color: 'var(--text3)', fontSize: 12, marginTop: 4 }}>Agrega el correo de alguien que ya tenga cuenta en Rifally</p>
          </div>
        ) : (
          lista.map(c => (
            <div key={c.id} className="colab-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="colab-avatar">{getInitials(c.nombre || c.email)}</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{c.nombre || c.email.split('@')[0]}</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>{c.email}</p>
                </div>
              </div>
              <button className="btn-ghost btn-icon-only" onClick={() => eliminar(c.id)}
                style={{ color: 'var(--danger)' }}>
                <CloseIcon size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}