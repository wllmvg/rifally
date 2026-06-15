import { useState, useEffect, useCallback } from 'react';
import { sb } from '../lib/supabaseClient';
import NumeroGrid from '../components/NumeroGrid';
import ModalNumero from '../components/modals/ModalNumero';
import ModalRuleta from '../components/modals/ModalRuleta';
import ModalColaboradores from '../components/modals/ModalColaboradores';
import { ArrowLeftIcon, TargetIcon, UsersIcon, LinkIcon, TrophyIcon, CalendarIcon, ClockIcon, SearchIcon, ShareIcon } from '../components/Icons';

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Podium component for winners
function Podio({ ganadores }) {
  if (!ganadores.length) return null;
  const [primero, segundo, tercero] = ganadores;
  const tipos = ['gold', 'silver', 'bronze'];
  const emojis = ['', '', ''];
  const alturas = ['podio-block gold', 'podio-block silver', 'podio-block bronze'];

  // Reorder for podium display: 2nd, 1st, 3rd
  const orden = ganadores.length === 1
    ? [{ g: primero, tipo: 'gold', emoji: '', bloque: alturas[0] }]
    : ganadores.length === 2
    ? [
        { g: segundo, tipo: 'silver', emoji: '', bloque: alturas[1] },
        { g: primero, tipo: 'gold', emoji: '', bloque: alturas[0] },
      ]
    : [
        { g: segundo, tipo: 'silver', emoji: '', bloque: alturas[1] },
        { g: primero, tipo: 'gold', emoji: '', bloque: alturas[0] },
        { g: tercero, tipo: 'bronze', emoji: '', bloque: alturas[2] },
      ];

  return (
    <div className="podio-container">
      {orden.map(({ g, tipo, emoji, bloque }, i) => (
        <div key={g.id} className="podio-slot">
          <div className={`podio-avatar ${tipo}`}>{emoji}</div>
          <div className="podio-name">{g.nombre}</div>
          <div className="podio-num">#{g.numero}</div>
          <div className={bloque}>
            {tipo === 'gold' ? '1°' : tipo === 'silver' ? '2°' : '3°'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Modal to view booked numbers
function ModalNumerosApartados({ numeros, onClose, onClickNumero, puedeEditar, rifa }) {
  const [busq, setBusq] = useState('');
  const lista = numeros.filter(n => {
    const q = busq.toLowerCase();
    return !q || String(n.numero).includes(q) || (n.nombre || '').toLowerCase().includes(q) || (n.telefono || '').includes(q);
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-numeros-apartados" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h3>Números apartados <span style={{ color: 'var(--text3)', fontWeight: 400, fontSize: 14 }}>({numeros.length})</span></h3>
          <button className="btn-ghost btn-icon-only" onClick={onClose}>✕</button>
        </div>
        <div className="search-apartados">
          <SearchIcon size={15} color="var(--text3)" />
          <div className="search-icon-inside"><SearchIcon size={15} /></div>
          <input
            value={busq}
            onChange={e => setBusq(e.target.value)}
            placeholder="Buscar por nombre o teléfono…"
            autoFocus
          />
        </div>
        {lista.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No se encontraron resultados
          </p>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
            {lista.map(n => (
              <div
                key={n.id}
                onClick={() => puedeEditar && rifa?.estado !== 'finalizada' && onClickNumero(n)}
                className="apartado-row"
                style={{ cursor: puedeEditar && rifa?.estado !== 'finalizada' ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="apartado-num" style={{ background: n.ganador ? 'var(--gold)' : 'var(--accent)' }}>
                    #{n.numero}
                  </span>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: 14 }}>{n.nombre}</p>
                    {n.telefono && <p style={{ color: 'var(--text3)', fontSize: 12 }}>{n.telefono}</p>}
                  </div>
                  {n.ganador && <span className="badge badge-gold"><TrophyIcon size={11} /> Ganador</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Modal to view a single number info (read-only click on grid)
function ModalVerNumero({ numero, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
          <button className="btn-ghost btn-icon-only" onClick={onClose}>✕</button>
        </div>
        <div className="numero-detail-big">{numero.numero}</div>
        {numero.ganador && (
          <div style={{ marginBottom: 12 }}>
            <span className="badge badge-gold"><TrophyIcon size={12} /> Ganador</span>
          </div>
        )}
        {numero.apartado ? (
          <>
            <p style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>{numero.nombre}</p>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>{numero.telefono || 'Sin teléfono'}</p>
          </>
        ) : (
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Número disponible</p>
        )}
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 20, width: '100%' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default function VistaRifa({ rifaId, user, onBack, toast }) {
  const [rifa, setRifa] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalNum, setModalNum] = useState(null);
  const [modalRuleta, setModalRuleta] = useState(false);
  const [modalColab, setModalColab] = useState(false);
  const [modalApartados, setModalApartados] = useState(false);
  const [modalVerNumero, setModalVerNumero] = useState(null);
  const [esColaborador, setEsColaborador] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const cargar = useCallback(async () => {
    const { data: r } = await sb.from('rifas').select('*').eq('id', rifaId).single();
    const { data: n } = await sb.from('numeros').select('*').eq('rifa_id', rifaId).order('numero');
    setRifa(r);
    setNumeros(n || []);
    setLoading(false);
    if (r && user && r.creador_id !== user.id) {
      const { data: colab } = await sb.from('colaboradores')
        .select('id').eq('rifa_id', rifaId).eq('email', user.email).single();
      setEsColaborador(!!colab);
    }
  }, [rifaId, user]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleSaveNumero = async (numero, nombre, telefono) => {
    const { error } = await sb.from('numeros')
      .update({ apartado: true, nombre, telefono, apartado_at: new Date().toISOString() })
      .eq('rifa_id', rifaId).eq('numero', numero);
    if (error) { toast('Error al guardar', 'error'); return; }
    toast(`Número ${numero} apartado por ${nombre}`, 'success');
    setModalNum(null);
    cargar();
  };

  const handleDeleteNumero = async (numero) => {
    const { error } = await sb.from('numeros')
      .update({ apartado: false, nombre: null, telefono: null, apartado_at: null })
      .eq('rifa_id', rifaId).eq('numero', numero);
    if (error) { toast('Error al liberar', 'error'); return; }
    toast(`Número ${numero} liberado`, 'success');
    setModalNum(null);
    cargar();
  };

  const copiarEnlace = () => {
    const url = `${window.location.href.split('?')[0]}?rifa=${rifaId}&publico=1`;
    navigator.clipboard.writeText(url).then(() => toast('Enlace copiado', 'success'));
  };

  if (loading) return <div className="page"><div className="spinner"></div></div>;
  if (!rifa) return <div className="page"><p>Rifa no encontrada</p></div>;

  const esCreador = user && rifa.creador_id === user.id;
  const puedeEditar = esCreador || esColaborador;
  const totalApartados = numeros.filter(n => n.apartado).length;
  const pct = Math.round((totalApartados / numeros.length) * 100) || 0;
  const ganadores = numeros.filter(n => n.ganador);

  const motivosRegiro = (() => {
    try { return rifa.motivos_regiro ? JSON.parse(rifa.motivos_regiro) : null; }
    catch { return null; }
  })();

  const numerosFiltrados = numeros.filter(n => {
    const q = busqueda.toLowerCase();
    const matchBusq = !q || String(n.numero).includes(q) || (n.nombre || '').toLowerCase().includes(q);
    const matchFiltro = filtro === 'todos'
      || (filtro === 'disponibles' && !n.apartado)
      || (filtro === 'apartados' && n.apartado);
    return matchBusq && matchFiltro;
  });

  const disponiblesFiltrados = filtro === 'disponibles' ? numerosFiltrados.filter(n => !n.apartado) : [];

  const fechaCreacion = formatDate(rifa.created_at);
  const fechaCierre = formatDate(rifa.fecha_cierre);
  const enlacePublico = `${window.location.href.split('?')[0]}?rifa=${rifaId}&publico=1`;

  return (
    <div className="page">
      {/* Header */}
      <div className="vistarifa-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="vistarifa-title-row">
            <h2 style={{ fontSize: 22 }}>{rifa.nombre}</h2>
            {rifa.estado === 'finalizada'
              ? <span className="badge badge-gold"><TrophyIcon size={11} /> Finalizada</span>
              : <span className="badge badge-green">● Activa</span>}
          </div>
          <div className="vistarifa-meta">
            <span className="rifa-meta-item">Premio: <b style={{ color: 'var(--text)' }}>{rifa.premio}</b></span>
            {rifa.precio && <span className="rifa-meta-item">${rifa.precio} por número</span>}
          </div>
          <div className="rifa-dates" style={{ marginTop: 6 }}>
            {fechaCreacion && (
              <span className="rifa-date-item"><CalendarIcon size={12} /> Creada: {fechaCreacion}</span>
            )}
            {fechaCierre && (
              <span className="rifa-date-item rifa-date-cierre"><ClockIcon size={12} /> Cierre tentativo: {fechaCierre}</span>
            )}
          </div>
        </div>
        {/* Botón Volver a la derecha, destacado */}
        <button
          className="btn-primary btn-icon-label"
          onClick={onBack}
          style={{ flexShrink: 0, alignSelf: 'flex-start' }}
        >
          <ArrowLeftIcon size={16} color="#fff" /> Volver
        </button>
      </div>

      {/* Podio de ganadores si rifa finalizada */}
      {rifa.estado === 'finalizada' && ganadores.length > 0 && (
        <div className="ganadores-banner">
          <div className="ganadores-banner-title">
            <TrophyIcon size={20} color="var(--gold)" />
            {ganadores.length > 1 ? '¡Ganadores!' : '¡Ganador!'}
          </div>
          <Podio ganadores={ganadores} />
          {motivosRegiro && motivosRegiro.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left', background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>
                ️ Historial de regiros
              </p>
              {motivosRegiro.map((r, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>
                  <b>Regiro {i + 1}:</b> {r.motivo}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banner compartir (rifa finalizada) */}
      {rifa.estado === 'finalizada' && (
        <div className="share-banner">
          <div>
            <p> <b>¡Rifa finalizada!</b> Comparte el enlace para que todos sepan quién ganó.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <a href={enlacePublico} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
              <button className="btn-secondary btn-icon-label">
                <LinkIcon size={14} /> Ver pública
              </button>
            </a>
            <button className="btn-primary btn-icon-label" onClick={copiarEnlace}>
              <ShareIcon size={14} color="#fff" /> Copiar enlace
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Total números', val: numeros.length },
          { label: 'Apartados', val: totalApartados, color: 'var(--accent)' },
          { label: 'Disponibles', val: numeros.length - totalApartados },
          { label: 'Completado', val: `${pct}%`, color: pct >= 100 ? 'var(--accent)' : undefined },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <p className="stat-label">{s.label}</p>
            <p className="stat-val" style={{ color: s.color || 'var(--text)' }}>{s.val}</p>
          </div>
        ))}
      </div>
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-fill" style={{ width: `${pct}%` }}></div>
      </div>

      {/* Acciones creador */}
      {esCreador && rifa.estado !== 'finalizada' && (
        <div className="acciones-row">
          <button className="btn-primary btn-icon-label" onClick={() => setModalRuleta(true)}>
            <TargetIcon size={16} color="#fff" /> Hacer sorteo
          </button>
          <button className="btn-secondary btn-icon-label" onClick={() => setModalColab(true)}>
            <UsersIcon size={16} /> Colaboradores
          </button>
          <a href={enlacePublico} target="_blank" rel="noopener" style={{ textDecoration: 'none' }}>
            <button className="btn-secondary btn-icon-label">
              <LinkIcon size={16} /> Ver página pública
            </button>
          </a>
        </div>
      )}
      {/* Botón ver pública para rifa activa también (siempre visible para creador) */}
      {esCreador && rifa.estado === 'finalizada' && null /* ya está en share-banner */}
      {esColaborador && (
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Eres colaborador de esta rifa</p>
      )}

      {/* Filtros */}
      <div className="filtros-row">
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar número o nombre…" style={{ maxWidth: 220, marginBottom: 0 }} />
        <div className="filtros-btns">
          {['todos', 'disponibles', 'apartados'].map(f => (
            <button key={f} className={filtro === f ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setFiltro(f)} style={{ padding: '8px 14px' }}>
              {f === 'todos' ? 'Todos' : f === 'disponibles' ? 'Disponibles' : 'Apartados'}
            </button>
          ))}
        </div>
      </div>

      {/* Mensaje sin disponibles */}
      {filtro === 'disponibles' && disponiblesFiltrados.length === 0 && !busqueda && (
        <div className="info-box" style={{ marginBottom: 16, textAlign: 'center' }}>
          ️ <b>¡Todo vendido!</b> No quedan números disponibles en esta rifa.
        </div>
      )}

      {/* Leyenda */}
      <div className="leyenda-row">
        <span><span className="leyenda-dot" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}></span>Disponible</span>
        <span><span className="leyenda-dot" style={{ background: 'var(--accent)' }}></span>Apartado</span>
        {rifa.estado === 'finalizada' && (
          <span><span className="leyenda-dot" style={{ background: 'var(--gold)' }}></span>Ganador</span>
        )}
      </div>

      {/* Grid */}
      <div className="card">
        <NumeroGrid
          numeros={numerosFiltrados}
          onClickNumero={n => {
            if (puedeEditar && rifa?.estado !== 'finalizada') {
              setModalNum(n);
            } else {
              // cualquier usuario puede ver info del número apartado
              if (n.apartado) setModalVerNumero(n);
            }
          }}
          soloVer={false}
        />
      </div>

      {/* Números apartados — en modal */}
      {totalApartados > 0 && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <h3 style={{ fontSize: 16 }}>Números apartados ({totalApartados})</h3>
          <button className="btn-secondary btn-icon-label" onClick={() => setModalApartados(true)}>
            <SearchIcon size={14} /> Ver todos
          </button>
        </div>
      )}

      {/* Modales */}
      {modalNum && (
        <ModalNumero numero={modalNum} onClose={() => setModalNum(null)}
          onSave={handleSaveNumero} onDelete={handleDeleteNumero} />
      )}
      {modalRuleta && (
        <ModalRuleta numeros={numeros} rifaNombre={rifa.nombre} rifaId={rifaId}
          onClose={() => setModalRuleta(false)} onGanadoresGuardados={() => cargar()} toast={toast} />
      )}
      {modalColab && (
        <ModalColaboradores rifaId={rifaId} onClose={() => setModalColab(false)} toast={toast} />
      )}
      {modalApartados && (
        <ModalNumerosApartados
          numeros={numeros.filter(n => n.apartado)}
          onClose={() => setModalApartados(false)}
          onClickNumero={n => { setModalApartados(false); setModalNum(n); }}
          puedeEditar={puedeEditar}
          rifa={rifa}
        />
      )}
      {modalVerNumero && (
        <ModalVerNumero numero={modalVerNumero} onClose={() => setModalVerNumero(null)} />
      )}
    </div>
  );
}