import { useState, useEffect } from 'react';
import Portal from '../components/Portal';
import { sb } from '../lib/supabaseClient';
import NumeroGrid from '../components/NumeroGrid';
import { TrophyIcon } from '../components/Icons';

function Podio({ ganadores }) {
  if (!ganadores.length) return null;
  const [primero, segundo, tercero] = ganadores;

  const orden = ganadores.length === 1
    ? [{ g: primero, tipo: 'gold', emoji: '', label: '1°' }]
    : ganadores.length === 2
    ? [
        { g: segundo, tipo: 'silver', emoji: '', label: '2°' },
        { g: primero, tipo: 'gold', emoji: '', label: '1°' },
      ]
    : [
        { g: segundo, tipo: 'silver', emoji: '', label: '2°' },
        { g: primero, tipo: 'gold', emoji: '', label: '1°' },
        { g: tercero, tipo: 'bronze', emoji: '', label: '3°' },
      ];

  const alturas = { gold: 80, silver: 60, bronze: 44 };
  const colores = { gold: 'var(--gold)', silver: '#aaa', bronze: '#cd7f32' };

  return (
    <div className="podio-container" style={{ marginBottom: 0 }}>
      {orden.map(({ g, tipo, emoji, label }) => (
        <div key={g.id} className="podio-slot">
          <div className={`podio-avatar ${tipo}`}>{emoji}</div>
          <div className="podio-name">{g.nombre}</div>
          <div className="podio-num">#{g.numero}</div>
          <div className={`podio-block ${tipo}`} style={{ height: alturas[tipo], background: colores[tipo] }}>
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

function ModalVerNumeroPublico({ numero, onClose }) {
  return (
    <Portal>
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 320, textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'flex-end', marginBottom: 0 }}>
          <button className="btn-ghost btn-icon-only" onClick={onClose}>✕</button>
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: 'var(--accent)', lineHeight: 1, marginBottom: 16 }}>
          {numero.numero}
        </div>
        {numero.ganador && (
          <div style={{ marginBottom: 12 }}>
            <span className="badge badge-gold"><TrophyIcon size={12} /> Ganador</span>
          </div>
        )}
        {numero.apartado ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 28 }}></span>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--accent)' }}>Número apartado</p>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Este número ya no está disponible</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 28 }}></span>
            <p style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>Número disponible</p>
            <p style={{ fontSize: 13, color: 'var(--text3)' }}>Contáctate con el organizador para apartarlo</p>
          </div>
        )}
        <button className="btn-secondary" onClick={onClose} style={{ marginTop: 20, width: '100%' }}>
          Cerrar
        </button>
      </div>
    </div>
    </Portal>
  );
}

export default function VistaPublica({ rifaId, user }) {
  const [rifa, setRifa] = useState(null);
  const [numeros, setNumeros] = useState([]);
  const [organizador, setOrganizador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVerNumero, setModalVerNumero] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: r } = await sb.from('rifas').select('*').eq('id', rifaId).single();
      const { data: n } = await sb.from('numeros').select('*').eq('rifa_id', rifaId).order('numero');

      setRifa(r);
      setNumeros((n || []).map(num => ({ ...num, nombre: null, telefono: null })));

      // Leer nombre del organizador directamente de la rifa (sin depender de RLS de profiles)
      setOrganizador({ name: r?.creador_nombre || null, email: r?.creador_email || null });

      setLoading(false);
    })();
  }, [rifaId]);

  if (loading) return <div className="page"><div className="spinner"></div></div>;
  if (!rifa) return <div className="page"><p>Rifa no encontrada</p></div>;

  const ganadores = numeros.filter(n => n.ganador);
  const totalApartados = numeros.filter(n => n.apartado).length;
  const totalDisponibles = numeros.length - totalApartados;
  const pct = Math.round((totalApartados / numeros.length) * 100) || 0;

  const nombreOrganizador = organizador?.name || organizador?.email?.split('@')[0] || 'Organizador';

  const motivosRegiro = (() => {
    try { return rifa.motivos_regiro ? JSON.parse(rifa.motivos_regiro) : null; }
    catch { return null; }
  })();

  return (
    <div className="page" style={{ maxWidth: 720 }}>

      {/* Hero — sin SVG */}
      <div className="publico-hero">
        <h1>{rifa.nombre}</h1>
        <p style={{ marginTop: 6 }}>
          Premio: <b style={{ fontSize: 17 }}>{rifa.premio}</b>
        </p>
        {rifa.precio && (
          <p style={{ marginTop: 4, fontSize: 14, opacity: 0.8 }}>${rifa.precio} por número</p>
        )}
        <p style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
          Organizado por <b style={{ opacity: 1 }}>{nombreOrganizador}</b>
        </p>
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 20, fontSize: 14, opacity: 0.85, flexWrap: 'wrap' }}>
          <span>️ {numeros.length} números</span>
          <span> {totalApartados} apartados</span>
          <span> {totalDisponibles} disponibles</span>
          <span> {pct}% vendido</span>
        </div>
      </div>

      {/* Descripción */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 10 }}> Sobre esta rifa</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', fontSize: 14 }}>
          <div>
            <span style={{ color: 'var(--text3)' }}>Premio</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>{rifa.premio}</p>
          </div>
          {rifa.precio && (
            <div>
              <span style={{ color: 'var(--text3)' }}>Precio por número</span>
              <p style={{ fontWeight: 600, marginTop: 2 }}>${Number(rifa.precio).toLocaleString('es-CO')}</p>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text3)' }}>Organizador</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}> {nombreOrganizador}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text3)' }}>Total de números</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>{numeros.length}</p>
          </div>
          <div>
            <span style={{ color: 'var(--text3)' }}>Estado</span>
            <p style={{ fontWeight: 600, marginTop: 2 }}>
              {rifa.estado === 'finalizada'
                ? ' Finalizada'
                : totalApartados === numeros.length
                  ? ' Agotada'
                  : ' Activa — quedan números disponibles'}
            </p>
          </div>
          {rifa.fecha_cierre && (
            <div>
              <span style={{ color: 'var(--text3)' }}>Fecha tentativa de cierre</span>
              <p style={{ fontWeight: 600, marginTop: 2 }}>
                {new Date(rifa.fecha_cierre).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
          <div>
            <span style={{ color: 'var(--text3)' }}>Progreso</span>
            <p style={{ fontWeight: 600, marginTop: 2, color: 'var(--accent)' }}>{pct}% vendido</p>
          </div>
        </div>
        <div className="progress-bar" style={{ marginTop: 16, marginBottom: 0 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>

      {/* Ganadores con podio */}
      {ganadores.length > 0 && (
        <div className="ganadores-banner" style={{ marginBottom: 28 }}>
          <div className="ganadores-banner-title">
            <TrophyIcon size={20} color="var(--gold)" />
            {ganadores.length > 1 ? '¡Ganadores!' : '¡Ganador!'}
          </div>
          <Podio ganadores={ganadores} />
          {motivosRegiro && motivosRegiro.length > 0 && (
            <div style={{ marginTop: 16, textAlign: 'left', background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>
                ️ Información sobre el sorteo
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

      {/* Grid de números */}
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, marginBottom: 4 }}>Números</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
          Los números en <b style={{ color: 'var(--accent)' }}>color</b> ya están apartados. Los grises están disponibles.
        </p>
      </div>

      <div className="leyenda-row" style={{ marginBottom: 12 }}>
        <span><span className="leyenda-dot" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}></span>Disponible</span>
        <span><span className="leyenda-dot" style={{ background: 'var(--accent)' }}></span>Apartado</span>
        {rifa.estado === 'finalizada' && (
          <span><span className="leyenda-dot" style={{ background: 'var(--gold)' }}></span>Ganador</span>
        )}
      </div>

      <div className="card" style={{ textAlign: 'left' }}>
        <NumeroGrid
          numeros={numeros}
          onClickNumero={n => setModalVerNumero(n)}
          soloVer={false}
        />
      </div>

      {modalVerNumero && (
        <ModalVerNumeroPublico numero={modalVerNumero} onClose={() => setModalVerNumero(null)} />
      )}
    </div>
  );
}