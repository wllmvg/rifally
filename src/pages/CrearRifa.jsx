import { useState, useMemo, useCallback, useEffect } from 'react';
import { sb } from '../lib/supabaseClient';
import { ArrowLeftIcon, TicketIcon, GiftIcon, MoneyIcon, LightbulbIcon, PlusIcon, CloseIcon } from '../components/Icons';

function calcularSugerenciaPrecio(totalNumeros, premioValor) {
  if (!premioValor || !totalNumeros || totalNumeros < 2) return null;
  const margen = 1.35;
  const precioSugerido = Math.ceil((premioValor * margen) / totalNumeros);
  const recaudadoEstimado = precioSugerido * totalNumeros;
  const gananciaEstimada = recaudadoEstimado - premioValor;
  return { precioSugerido, recaudadoEstimado, gananciaEstimada };
}

function getInitials(s) {
  const parts = s.split('@')[0].split(/[._-]/);
  return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2) || '?';
}

export default function CrearRifa({ user, onCreada, onBack, toast }) {
  const [nombre, setNombre] = useState('');
  const [tipoPremio, setTipoPremio] = useState('objeto');
  const [premio, setPremio] = useState('');
  const [valorPremio, setValorPremio] = useState('');
  const [precio, setPrecio] = useState('');
  const [totalNum, setTotalNum] = useState(100);
  const [fechaCierre, setFechaCierre] = useState('');
  const [loading, setLoading] = useState(false);

  // Colaboradores al crear
  const [emailColab, setEmailColab] = useState('');
  const [colaboradores, setColaboradores] = useState([]); // [{email, nombre}]
  const [verificandoColab, setVerificandoColab] = useState(false);

  const sugerencia = useMemo(() => {
    if (tipoPremio === 'dinero' && valorPremio && totalNum) {
      return calcularSugerenciaPrecio(Number(totalNum), Number(valorPremio));
    }
    return null;
  }, [tipoPremio, valorPremio, totalNum]);

  const nombrePremio = tipoPremio === 'dinero'
    ? (valorPremio ? `$${Number(valorPremio).toLocaleString('es-CO')} en efectivo` : 'Premio en dinero')
    : premio;

  const buscarColaborador = async () => {
    const emailLower = emailColab.trim().toLowerCase();
    if (!emailLower || !emailLower.includes('@')) {
      toast('Email inválido', 'error'); return;
    }
    if (emailLower === user.email) {
      toast('No puedes agregarte a ti mismo', 'error'); return;
    }
    if (colaboradores.find(c => c.email === emailLower)) {
      toast('Ya está en la lista', 'error'); return;
    }

    setVerificandoColab(true);
    let nombreColaborador = null;
    let encontrado = false;

    // Intento 1: tabla profiles (solo columna "name")
    const { data: perfil } = await sb.from('profiles').select('name').eq('email', emailLower).maybeSingle();
    if (perfil) { encontrado = true; nombreColaborador = perfil.name || null; }

    // Intento 2: colaboradores de otras rifas
    if (!encontrado) {
      const { data: oc } = await sb.from('colaboradores').select('nombre').eq('email', emailLower).limit(1).maybeSingle();
      if (oc) { encontrado = true; nombreColaborador = oc.nombre || null; }
    }

    setVerificandoColab(false);

    if (!encontrado) {
      toast(`No se encontró cuenta con "${emailLower}". Pídele que se registre en Rifally primero.`, 'error');
      return;
    }

    setColaboradores(prev => [...prev, { email: emailLower, nombre: nombreColaborador || emailLower.split('@')[0] }]);
    setEmailColab('');
    toast(`${nombreColaborador || emailLower} agregado`, 'success');
  };

  const quitarColab = (email) => {
    setColaboradores(prev => prev.filter(c => c.email !== email));
  };

  const crear = async () => {
    if (!nombre.trim()) { toast('Escribe el nombre de la rifa', 'error'); return; }
    if (tipoPremio === 'objeto' && !premio.trim()) { toast('Escribe el premio mayor', 'error'); return; }
    if (tipoPremio === 'dinero' && !valorPremio) { toast('Escribe el valor del premio en dinero', 'error'); return; }
    if (Number(totalNum) < 2) { toast('Mínimo 2 números', 'error'); return; }

    setLoading(true);
    const premioFinal = tipoPremio === 'dinero'
      ? `$${Number(valorPremio).toLocaleString('es-CO')} en efectivo`
      : premio.trim();

    const { data: rifa, error } = await sb.from('rifas').insert({
      nombre: nombre.trim(),
      premio: premioFinal,
      precio: precio ? Number(precio) : null,
      total_numeros: Number(totalNum),
      creador_id: user.id,
      creador_nombre: user.user_metadata?.nombre || user.user_metadata?.name || user.email?.split('@')[0] || null,
      creador_email: user.email || null,
      estado: 'activa',
      ...(fechaCierre ? { fecha_cierre: fechaCierre } : {}),
    }).select().single();

    if (error) { toast('Error al crear la rifa', 'error'); setLoading(false); return; }

    // Crear números en lotes con rollback si falla
    const filas = Array.from({ length: Number(totalNum) }, (_, i) => ({
      rifa_id: rifa.id, numero: i + 1, apartado: false,
    }));
    for (let i = 0; i < filas.length; i += 500) {
      const { error: errNum } = await sb.from('numeros').insert(filas.slice(i, i + 500));
      if (errNum) {
        await sb.from('numeros').delete().eq('rifa_id', rifa.id);
        await sb.from('rifas').delete().eq('id', rifa.id);
        toast('Error al crear los números. Intenta de nuevo.', 'error');
        setLoading(false);
        return;
      }
    }

    if (colaboradores.length > 0) {
      const { error: errColab } = await sb.from('colaboradores').insert(
        colaboradores.map(c => ({ rifa_id: rifa.id, email: c.email, nombre: c.nombre }))
      );
      if (errColab) {
        await sb.from('numeros').delete().eq('rifa_id', rifa.id);
        await sb.from('rifas').delete().eq('id', rifa.id);
        toast('Error al agregar colaboradores. Intenta de nuevo.', 'error');
        setLoading(false);
        return;
      }
    }

    toast('¡Rifa creada exitosamente!', 'success');
    onCreada(rifa.id);
    setLoading(false);
  };

  return (
    <div className="page">
      <h2 style={{ fontSize: 24, marginBottom: 6 }}>Crear rifa</h2>
      <p style={{ color: 'var(--text2)', marginBottom: 28 }}>Configura tu nueva rifa</p>

      <div className="crear-layout">
        <div>
          <div className="card">
            <div className="field">
              <label>Nombre de la rifa *</label>
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Rifa de navidad 2025" />
            </div>

            <div className="field">
              <label>Tipo de premio *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button"
                  className={tipoPremio === 'objeto' ? 'btn-primary btn-icon-label' : 'btn-secondary btn-icon-label'}
                  onClick={() => setTipoPremio('objeto')} style={{ flex: 1, justifyContent: 'center' }}>
                  <GiftIcon size={15} color={tipoPremio === 'objeto' ? '#fff' : 'currentColor'} /> Objeto / Artículo
                </button>
                <button type="button"
                  className={tipoPremio === 'dinero' ? 'btn-primary btn-icon-label' : 'btn-secondary btn-icon-label'}
                  onClick={() => setTipoPremio('dinero')} style={{ flex: 1, justifyContent: 'center' }}>
                  <MoneyIcon size={15} color={tipoPremio === 'dinero' ? '#fff' : 'currentColor'} /> Dinero en efectivo
                </button>
              </div>
            </div>

            {tipoPremio === 'objeto' ? (
              <div className="field">
                <label>Premio mayor *</label>
                <input value={premio} onChange={e => setPremio(e.target.value)} placeholder="Ej: TV 55 pulgadas Samsung" />
              </div>
            ) : (
              <div className="field">
                <label>Valor del premio ($) *</label>
                <input type="number" min={0} value={valorPremio}
                  onChange={e => setValorPremio(e.target.value)} placeholder="Ej: 500000" />
                {valorPremio && (
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                    El premio será: <b style={{ color: 'var(--accent)' }}>${Number(valorPremio).toLocaleString('es-CO')} en efectivo</b>
                  </p>
                )}
              </div>
            )}

            <div className="crear-grid-2">
              <div className="field">
                <label>Total de números *</label>
                <input type="number" min={2} max={10000} value={totalNum} onChange={e => setTotalNum(e.target.value)} />
              </div>
              <div className="field">
                <label>Precio por número ($)</label>
                <input type="number" min={0} value={precio}
                  onChange={e => setPrecio(e.target.value)}
                  placeholder={sugerencia ? `Sugerido: $${sugerencia.precioSugerido.toLocaleString('es-CO')}` : 'Opcional'} />
                {sugerencia && !precio && (
                  <button type="button" onClick={() => setPrecio(String(sugerencia.precioSugerido))}
                    style={{ marginTop: 6, fontSize: 12, padding: '4px 10px', background: 'var(--warning-light)', color: 'var(--warning)', border: '1px solid var(--warning)', borderRadius: 6, cursor: 'pointer' }}>
                    Usar precio sugerido: ${sugerencia.precioSugerido.toLocaleString('es-CO')}
                  </button>
                )}
              </div>
            </div>

            <div className="field">
              <label>Fecha tentativa de cierre</label>
              <input type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} />
            </div>

            {/* ── Colaboradores al crear ── */}
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Colaboradores <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(opcional)</span></label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={emailColab}
                  onChange={e => setEmailColab(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  onKeyDown={e => e.key === 'Enter' && buscarColaborador()}
                  disabled={verificandoColab}
                />
                <button className="btn-secondary btn-icon-label" onClick={buscarColaborador}
                  disabled={verificandoColab} style={{ whiteSpace: 'nowrap' }}>
                  {verificandoColab ? '...' : <><PlusIcon size={14} /> Agregar</>}
                </button>
              </div>
              {colaboradores.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {colaboradores.map(c => (
                    <div key={c.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                          {getInitials(c.nombre || c.email)}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500 }}>{c.nombre}</p>
                          <p style={{ fontSize: 11, color: 'var(--text3)' }}>{c.email}</p>
                        </div>
                      </div>
                      <button className="btn-ghost btn-icon-only" onClick={() => quitarColab(c.email)}
                        style={{ color: 'var(--danger)' }}>
                        <CloseIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="info-box" style={{ marginBottom: 20 }}>
              Se crearán números del <b>1</b> al <b>{totalNum || '?'}</b>
            </div>

            <button className="btn-primary btn-icon-label" onClick={crear} disabled={loading}
              style={{ width: '100%', padding: '12px 0', fontSize: 15, justifyContent: 'center' }}>
              {loading ? 'Creando…' : <><TicketIcon size={17} color="#fff" /> Crear rifa</>}
            </button>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="crear-sidebar">
          <div className="sidebar-preview-card">
            <h4>Vista previa</h4>
            <div className="sidebar-preview-name">{nombre || 'Nombre de tu rifa'}</div>
            <div className="sidebar-preview-row">
              <span> Premio</span>
              <span style={{ fontWeight: 600, maxWidth: 160, textAlign: 'right', wordBreak: 'break-word' }}>
                {nombrePremio || '—'}
              </span>
            </div>
            <div className="sidebar-preview-row">
              <span>️ Números</span>
              <span style={{ fontWeight: 600 }}>{totalNum || 0}</span>
            </div>
            {precio && (
              <div className="sidebar-preview-row">
                <span> Precio c/u</span>
                <span style={{ fontWeight: 600 }}>${Number(precio).toLocaleString('es-CO')}</span>
              </div>
            )}
            {colaboradores.length > 0 && (
              <div className="sidebar-preview-row">
                <span> Colaboradores</span>
                <span style={{ fontWeight: 600 }}>{colaboradores.length}</span>
              </div>
            )}
            {precio && totalNum && (
              <div className="sidebar-preview-row" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <span> Recaudo total</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  ${(Number(precio) * Number(totalNum)).toLocaleString('es-CO')}
                </span>
              </div>
            )}
          </div>

          {tipoPremio === 'dinero' && sugerencia && (
            <div className="sidebar-sugerencia" style={{ marginBottom: 16 }}>
              <div className="sidebar-sugerencia-title">
                <LightbulbIcon size={15} color="var(--warning)" /> Sugerencia de precio
              </div>
              <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>
                Para ganarle a la rifa con <b>{totalNum} números</b> y un premio de <b>${Number(valorPremio).toLocaleString('es-CO')}</b>:
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text2)' }}>Precio sugerido</span>
                <b style={{ color: 'var(--warning)' }}>${sugerencia.precioSugerido.toLocaleString('es-CO')} / nro</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--text2)' }}>Recaudo si se llena</span>
                <b>${sugerencia.recaudadoEstimado?.toLocaleString('es-CO')}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>Ganancia estimada</span>
                <b style={{ color: 'var(--accent)' }}>${sugerencia.gananciaEstimada.toLocaleString('es-CO')}</b>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>*Calculado con 35% de margen. Ajusta según tus necesidades.</p>
            </div>
          )}

          <div className="sidebar-tips">
            <h4> Consejos</h4>
            <div className="sidebar-tip-item">
              <div className="sidebar-tip-dot"></div>
              <span>Pon un nombre llamativo que describa bien el premio.</span>
            </div>
            <div className="sidebar-tip-item">
              <div className="sidebar-tip-dot"></div>
              <span>Menos números = más exclusivo. Más números = más fácil de vender.</span>
            </div>
            <div className="sidebar-tip-item">
              <div className="sidebar-tip-dot"></div>
              <span>Comparte el enlace público para que todos puedan ver qué números están disponibles.</span>
            </div>
            <div className="sidebar-tip-item">
              <div className="sidebar-tip-dot"></div>
              <span>Agrega colaboradores al crear la rifa o después en la vista de gestión.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}