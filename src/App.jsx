import { useState, useEffect } from 'react';
import { sb } from './lib/supabaseClient';
import { useToast } from './hooks/useToast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CrearRifa from './pages/CrearRifa';
import VistaRifa from './pages/VistaRifa';
import VistaPublica from './pages/VistaPublica';
import { TicketIcon, LogOutIcon } from './components/Icons';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [pantalla, setPantalla] = useState('dashboard');
  const [rifaActiva, setRifaActiva] = useState(null);
  const [showToast, toastEl] = useToast();

  const params = new URLSearchParams(window.location.search);
  const rifaPublicaId = params.get('rifa') && params.get('publico') === '1' ? params.get('rifa') : null;

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Vista pública
  if (rifaPublicaId) {
    return (
      <>
        <nav className="nav">
          <span className="nav-logo">
            <TicketIcon size={20} color="var(--accent)" />
            Rifally
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {user ? (
              <button className="btn-ghost" onClick={() => window.location.href = window.location.pathname}
                style={{ fontSize: 13 }}>
                ← Mi cuenta
              </button>
            ) : (
              /* Botón "Crea tu rifa ahora" si no hay sesión */
              <a href={window.location.pathname} style={{ textDecoration: 'none' }}>
                <button className="btn-primary btn-icon-label" style={{ fontSize: 13 }}>
                  <TicketIcon size={14} color="#fff" />
                  Crea tu rifa ahora
                </button>
              </a>
            )}
          </div>
        </nav>
        <VistaPublica rifaId={rifaPublicaId} user={user} />
        {toastEl}
      </>
    );
  }

  if (user === undefined) return <div className="page"><div className="spinner"></div></div>;
  if (!user) return <><Auth toast={showToast} />{toastEl}</>;

  const logout = async () => { await sb.auth.signOut(); };

  return (
    <>
      <nav className="nav">
        <span className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => setPantalla('dashboard')}>
          <TicketIcon size={20} color="var(--accent)" />
          Rifally
        </span>
        <button className="btn-ghost btn-icon-label" onClick={logout} style={{ fontSize: 13 }}>
          <LogOutIcon size={15} />
          <span className="nav-logout-text">Cerrar sesión</span>
        </button>
      </nav>

      {pantalla === 'dashboard' && (
        <Dashboard user={user} onSelectRifa={id => { setRifaActiva(id); setPantalla('rifa'); }}
          onCrearRifa={() => setPantalla('crear')} toast={showToast} />
      )}
      {pantalla === 'crear' && (
        <CrearRifa user={user} onCreada={id => { setRifaActiva(id); setPantalla('rifa'); }}
          onBack={() => setPantalla('dashboard')} toast={showToast} />
      )}
      {pantalla === 'rifa' && (
        <VistaRifa rifaId={rifaActiva} user={user} onBack={() => setPantalla('dashboard')} toast={showToast} />
      )}
      {toastEl}
    </>
  );
}