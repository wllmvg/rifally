import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { sb } from './lib/supabaseClient';
import { useToast } from './hooks/useToast';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import CrearRifa from './pages/CrearRifa';
import VistaRifa from './pages/VistaRifa';
import VistaPublica from './pages/VistaPublica';
import Landing from './pages/Landing';
import { TicketIcon, LogOutIcon } from './components/Icons';

function useUser() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  return user;
}

// ── Vista pública (/rifa/:id) ──────────────────────────────
function PaginaPublica({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showToast, toastEl] = useToast();

  return (
    <>
      <nav className="nav">
        <span className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <TicketIcon size={20} color="var(--accent)" />
          Rifally
        </span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {user ? (
            <button className="btn-ghost" onClick={() => navigate('/app')} style={{ fontSize: 13 }}>
              ← Mi cuenta
            </button>
          ) : (
            <button className="btn-primary btn-icon-label" onClick={() => navigate('/app')} style={{ fontSize: 13 }}>
              <TicketIcon size={14} color="#fff" />
              Crea tu rifa ahora
            </button>
          )}
        </div>
      </nav>
      <VistaPublica rifaId={id} user={user} toast={showToast} />
      {toastEl}
    </>
  );
}

// ── App autenticada ────────────────────────────────────────
function AppAutenticada({ user }) {
  const navigate = useNavigate();
  const [showToast, toastEl] = useToast();
  const logout = async () => { await sb.auth.signOut(); navigate('/'); };

  return (
    <>
      <nav className="nav">
        <span className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/app')}>
          <TicketIcon size={20} color="var(--accent)" />
          Rifally
        </span>
        <button className="btn-ghost btn-icon-label" onClick={logout} style={{ fontSize: 13 }}>
          <LogOutIcon size={15} />
          <span className="nav-logout-text">Cerrar sesión</span>
        </button>
      </nav>

      <Routes>
        <Route path="/" element={
          <Dashboard
            user={user}
            onSelectRifa={id => navigate(`/app/gestionar/${id}`)}
            onCrearRifa={() => navigate('/app/crear')}
            toast={showToast}
          />
        } />
        <Route path="/crear" element={
          <CrearRifa
            user={user}
            onCreada={id => navigate(`/app/gestionar/${id}`)}
            onBack={() => navigate(-1)}
            toast={showToast}
          />
        } />
        <Route path="/gestionar/:id" element={
          <VistaRifaWrapper user={user} toast={showToast} />
        } />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
      {toastEl}
    </>
  );
}

function VistaRifaWrapper({ user, toast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  return (
    <VistaRifa
      rifaId={id}
      user={user}
      onBack={() => navigate(-1)}
      toast={toast}
    />
  );
}

// ── Root ───────────────────────────────────────────────────
function Root() {
  const user = useUser();

  if (user === undefined) return <div className="page"><div className="spinner"></div></div>;

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/rifa/:id" element={<PaginaPublica user={user} />} />
      {!user ? (
        <Route path="/app/*" element={<AuthWrapper />} />
      ) : (
        <Route path="/app/*" element={<AppAutenticada user={user} />} />
      )}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthWrapper() {
  const [showToast, toastEl] = useToast();
  return <><Auth toast={showToast} />{toastEl}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  );
}