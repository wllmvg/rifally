import { useState, useRef, useEffect } from 'react';
import { sb } from '../../lib/supabaseClient';
import { CloseIcon, DiceIcon, TrophyIcon, RefreshIcon } from '../Icons';

export default function ModalRuleta({ numeros, rifaNombre, rifaId, onClose, onGanadoresGuardados, toast }) {
  const [cantGanadores, setCantGanadores] = useState(1);
  const [fase, setFase] = useState('config');
  const [ganadores, setGanadores] = useState([]);
  const [contador, setContador] = useState(0);
  const [motivoRegiro, setMotivoRegiro] = useState('');
  const [mostrarMotivoInput, setMostrarMotivoInput] = useState(false);
  const [historialRegiros, setHistorialRegiros] = useState([]);
  const timerRef = useRef(null);

  const numerosApartados = numeros.filter(n => n.apartado && !n.ganador);

  const girar = () => {
    if (numerosApartados.length < cantGanadores) {
      toast('No hay suficientes números apartados', 'error');
      return;
    }
    setFase('girando');
    let iters = 0;
    const max = 30 + Math.floor(Math.random() * 20);
    timerRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * numerosApartados.length);
      setContador(numerosApartados[idx].numero);
      iters++;
      if (iters >= max) {
        clearInterval(timerRef.current);
        const shuffled = [...numerosApartados].sort(() => Math.random() - 0.5);
        const elegidos = shuffled.slice(0, cantGanadores);
        setGanadores(elegidos);
        setFase('resultado');
      }
    }, 80);
  };

  const pedirMotivoRegiro = () => {
    setMostrarMotivoInput(true);
  };

  const confirmarRegiro = async () => {
    if (!motivoRegiro.trim()) {
      toast('Escribe el motivo para volver a girar', 'error');
      return;
    }
    // Guardar el motivo del regiro en la base de datos
    await sb.from('regiros_ruleta').insert({
      rifa_id: rifaId,
      motivo: motivoRegiro.trim(),
      ganadores_anteriores: ganadores.map(g => ({ numero: g.numero, nombre: g.nombre })),
    }).catch(() => {}); // tabla opcional, no bloquear si no existe

    setHistorialRegiros(prev => [...prev, {
      motivo: motivoRegiro.trim(),
      ganadores: ganadores.map(g => `#${g.numero} ${g.nombre}`)
    }]);
    setMotivoRegiro('');
    setMostrarMotivoInput(false);
    setFase('config');
  };

  const guardar = async () => {
    const ids = ganadores.map(g => g.id);
    const { error } = await sb.from('numeros').update({ ganador: true }).in('id', ids);
    if (error) { toast('Error al guardar ganadores', 'error'); return; }

    // Guardar historial de regiros en la rifa
    const motivosGuardados = historialRegiros.length > 0 ? historialRegiros : null;
    await sb.from('ganadores').insert(ganadores.map(g => ({ rifa_id: rifaId, numero_id: g.id })));
    await sb.from('rifas').update({
      estado: 'finalizada',
      motivos_regiro: motivosGuardados ? JSON.stringify(motivosGuardados) : null,
    }).eq('id', rifaId);

    toast('¡Ganadores registrados!', 'success');
    onGanadoresGuardados(ganadores);
    onClose();
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'center', position: 'relative' }}>
          <h3 style={{ fontSize: 20 }}>Sorteo</h3>
          <button className="btn-ghost btn-icon-only" onClick={onClose}
            style={{ position: 'absolute', right: 0 }}><CloseIcon size={18} /></button>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>{rifaNombre}</p>

        {fase === 'config' && (
          <>
            <div className="field" style={{ textAlign: 'left' }}>
              <label>¿Cuántos ganadores?</label>
              <input type="number" min={1} max={numerosApartados.length || 1}
                value={cantGanadores} onChange={e => setCantGanadores(Number(e.target.value))} />
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>
              {numerosApartados.length} número(s) en juego
            </p>

            {historialRegiros.length > 0 && (
              <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16, textAlign: 'left' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>
                  Historial de regiros ({historialRegiros.length})
                </p>
                {historialRegiros.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                    <b>Regiro {i + 1}:</b> {r.motivo}
                  </div>
                ))}
              </div>
            )}

            <button className="btn-primary btn-icon-label" onClick={girar}
              style={{ width: '100%', padding: '12px 0', fontSize: 15, justifyContent: 'center' }}>
              <DiceIcon size={18} color="#fff" /> ¡Girar ruleta!
            </button>
          </>
        )}

        {fase === 'girando' && (
          <div style={{ padding: '32px 0' }}>
            <div className="ruleta-ball">{contador}</div>
            <p style={{ marginTop: 20, color: 'var(--text2)' }}>Sorteando...</p>
          </div>
        )}

        {fase === 'resultado' && (
          <div className="winner-reveal">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <TrophyIcon size={40} color="var(--gold)" />
            </div>
            {ganadores.map(g => (
              <div key={g.id} style={{ marginBottom: 12 }}>
                <div className="winner-num">#{g.numero}</div>
                <p style={{ fontWeight: 500, fontSize: 17, marginTop: 4 }}>{g.nombre}</p>
                {g.telefono && <p style={{ color: 'var(--text2)', fontSize: 13 }}>{g.telefono}</p>}
              </div>
            ))}

            {mostrarMotivoInput ? (
              <div style={{ textAlign: 'left', marginTop: 20 }}>
                <div className="field">
                  <label>¿Por qué se vuelve a girar? *</label>
                  <input
                    value={motivoRegiro}
                    onChange={e => setMotivoRegiro(e.target.value)}
                    placeholder="Ej: El ganador no estaba presente"
                    autoFocus
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={() => { setMostrarMotivoInput(false); setMotivoRegiro(''); }} style={{ flex: 1 }}>
                    Cancelar
                  </button>
                  <button className="btn-primary btn-icon-label" onClick={confirmarRegiro} style={{ flex: 1, justifyContent: 'center' }}>
                    <RefreshIcon size={14} color="#fff" /> Confirmar y girar
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <button className="btn-secondary btn-icon-label" onClick={pedirMotivoRegiro} style={{ flex: 1, justifyContent: 'center' }}>
                  <RefreshIcon size={14} /> Volver a girar
                </button>
                <button className="btn-primary" onClick={guardar} style={{ flex: 1 }}>Confirmar y cerrar rifa</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}