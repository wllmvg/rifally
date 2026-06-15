import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabaseClient';
import { TicketIcon, TrashIcon, PlusIcon, TrophyIcon, CalendarIcon, ClockIcon, GiftIcon, HashIcon } from '../components/Icons';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function limpiarRifasViejas(rifas, toast) {
  const ahora = new Date();
  const unMesMs = 30 * 24 * 60 * 60 * 1000;
  const candidatas = rifas.filter(r => {
    if (r.estado !== 'finalizada') return false;
    const ganada_at = r.ganada_at ? new Date(r.ganada_at) : null;
    if (!ganada_at) return false;
    return (ahora - ganada_at) > unMesMs;
  });
  if (candidatas.length === 0) return [];

  const nombres = candidatas.map(r => `"${r.nombre}"`).join(', ');
  const ok = window.confirm(
    `Las siguientes rifas finalizadas tienen más de 1 mes desde que se eligió ganador y serán eliminadas automáticamente:\n\n${nombres}\n\nSe eliminarán junto con todos sus números. ¿Continuar?`
  );
  if (!ok) return [];

  const eliminadas = [];
  for (const r of candidatas) {
    await sb.from('numeros').delete().eq('rifa_id', r.id);
    await sb.from('colaboradores').delete().eq('rifa_id', r.id);
    await sb.from('ganadores').delete().eq('rifa_id', r.id);
    await sb.from('rifas').delete().eq('id', r.id);
    eliminadas.push(r.id);
  }
  if (eliminadas.length > 0) toast(`${eliminadas.length} rifa(s) antigua(s) eliminada(s) automáticamente`, 'info');
  return eliminadas;
}

export default function Dashboard({ user, onSelectRifa, onCrearRifa, toast }) {
  const [rifasPropias, setRifasPropias] = useState([]);
  const [rifasColaboradas, setRifasColaboradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('propias');

  const nombreUsuario = user.user_metadata?.nombre || user.email.split('@')[0];

  const cargar = useCallback(async () => {
    const { data: propias } = await sb
      .from('rifas').select('*').eq('creador_id', user.id).order('created_at', { ascending: false });

    const { data: colab } = await sb.from('colaboradores').select('rifa_id').eq('email', user.email);
    let colaboradas = [];
    if (colab && colab.length > 0) {
      const ids = colab.map(c => c.rifa_id);
      const { data: rc } = await sb
        .from('rifas').select('*').in('id', ids).order('created_at', { ascending: false });
      colaboradas = (rc || []).filter(r => r.creador_id !== user.id);
    }

    // Conteo de apartados por rifa
    const todasRifas = [...(propias || []), ...colaboradas];
    let conteoMap = {};
    if (todasRifas.length > 0) {
      const { data: conteos } = await sb
        .from('numeros')
        .select('rifa_id')
        .in('rifa_id', todasRifas.map(r => r.id))
        .eq('apartado', true);
      (conteos || []).forEach(c => {
        conteoMap[c.rifa_id] = (conteoMap[c.rifa_id] || 0) + 1;
      });
    }

    const todasPropias = (propias || []).map(r => ({ ...r, apartados: conteoMap[r.id] || 0 }));
    const eliminadas = await limpiarRifasViejas(todasPropias, toast);
    const propiasFiltradas = todasPropias.filter(r => !eliminadas.includes(r.id));

    setRifasPropias(propiasFiltradas);
    setRifasColaboradas(colaboradas.map(r => ({ ...r, apartados: conteoMap[r.id] || 0 })));
    setLoading(false);
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta rifa? Esta acción también eliminará todos los números asociados y no se puede deshacer.')) return;
    await sb.from('numeros').delete().eq('rifa_id', id);
    await sb.from('colaboradores').delete().eq('rifa_id', id);
    await sb.from('ganadores').delete().eq('rifa_id', id);
    await sb.from('rifas').delete().eq('id', id);
    toast('Rifa eliminada', 'success');
    cargar();
  };

  const rifasActivas = tab === 'propias' ? rifasPropias : rifasColaboradas;

  const RifaCard = ({ r, esPropia }) => {
    const fechaCreacion = formatDate(r.created_at);
    const fechaCierre = formatDate(r.fecha_cierre);
    const pct = r.total_numeros > 0 ? Math.round((r.apartados / r.total_numeros) * 100) : 0;

    return (
      <div className="rifa-card" onClick={() => onSelectRifa(r.id)}>
        <div className="rifa-card-top">
          <div className="rifa-card-title-row">
            <h3>{r.nombre}</h3>
            <div className="rifa-badges">
              {r.estado === 'finalizada'
                ? <span className="badge badge-gold"><TrophyIcon size={11} /> Finalizada</span>
                : <span className="badge badge-green">● Activa</span>}
              {!esPropia && <span className="badge badge-gray">Colaborador</span>}
            </div>
          </div>
          <div className="rifa-card-meta">
            <span className="rifa-meta-item">
              <GiftIcon size={13} />
              {r.premio}
            </span>
            {r.precio && (
              <span className="rifa-meta-item">
                <HashIcon size={13} />
                ${r.precio} por número
              </span>
            )}
          </div>
        </div>

        <div className="rifa-card-bottom">
          <div className="rifa-dates">
            {fechaCreacion && (
              <span className="rifa-date-item">
                <CalendarIcon size={12} />
                Creada: {fechaCreacion}
              </span>
            )}
            {fechaCierre && (
              <span className="rifa-date-item rifa-date-cierre">
                <ClockIcon size={12} />
                Cierre tentativo: {fechaCierre}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>
              {r.apartados > 0 ? (
                <>
                  <b style={{ color: 'var(--accent)' }}>{r.apartados} apartados</b>
                  {' | '}
                  {r.total_numeros} números
                  {' | '}
                  <span style={{ color: pct >= 100 ? 'var(--accent)' : 'var(--text3)' }}>{pct}%</span>
                </>
              ) : (
                <>{r.total_numeros} números &mdash; sin apartar</>
              )}
            </span>
            {esPropia && (
              <button className="btn-ghost btn-icon-only" onClick={e => eliminar(r.id, e)}
                style={{ color: 'var(--danger)' }} title="Eliminar rifa">
                <TrashIcon size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h2 style={{ fontSize: 24 }}>Dashboard</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>
            Hola, <b style={{ color: 'var(--text)' }}>{nombreUsuario}</b>
          </p>
        </div>
        <button className="btn-primary btn-icon-label" onClick={onCrearRifa}>
          <PlusIcon size={16} color="#fff" />
          Nueva rifa
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 24, width: 'fit-content', gap: 4 }}>
        {[
          { key: 'propias', label: `Mis rifas${rifasPropias.length ? ` (${rifasPropias.length})` : ''}` },
          { key: 'compartidas', label: `Rifas compartidas${rifasColaboradas.length ? ` (${rifasColaboradas.length})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', borderRadius: 'var(--radius)', fontWeight: 500,
              background: tab === t.key ? 'var(--surface)' : 'transparent',
              color: tab === t.key ? 'var(--text)' : 'var(--text2)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="spinner"></div>}

      {!loading && rifasActivas.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <TicketIcon size={40} color="var(--accent)" />
          </div>
          {tab === 'propias' ? (
            <>
              <h3>No tienes rifas aún</h3>
              <p>Crea tu primera rifa y empieza a gestionar los números</p>
              <button className="btn-primary btn-icon-label" onClick={onCrearRifa} style={{ padding: '12px 24px', fontSize: 15 }}>
                <PlusIcon size={16} color="#fff" />
                Crear primera rifa
              </button>
            </>
          ) : (
            <>
              <h3>No eres colaborador en ninguna rifa</h3>
              <p>Cuando alguien te agregue como colaborador, verás sus rifas aquí</p>
            </>
          )}
        </div>
      )}

      <div className="rifas-grid">
        {rifasActivas.map(r => (
          <RifaCard key={r.id} r={r} esPropia={tab === 'propias'} />
        ))}
      </div>
    </div>
  );
}