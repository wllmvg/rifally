import { useState } from 'react';
import { sb } from '../lib/supabaseClient';
import { TicketIcon, MailIcon, CloseIcon } from '../components/Icons';

export default function Auth({ toast }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async () => {
    if (!email || !pass) return alert('Completa todos los campos');
    if (modo === 'registro' && !nombre.trim()) return alert('Escribe tu nombre');
    setLoading(true);
    if (modo === 'login') {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) toast('Credenciales incorrectas');
    } else {
      const { error } = await sb.auth.signUp({
        email,
        password: pass,
        options: { data: { nombre: nombre.trim() } },
      });
      if (error) toast(error.message);
      else { setEnviado(true); toast('¡Cuenta creada! Revisa tu correo para confirmar.'); }
    }
    setLoading(false);
  };

  if (enviado) return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--accent)', marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <MailIcon size={48} />
        </div>
        <h2 style={{ marginBottom: 8 }}>Confirma tu correo</h2>
        <p style={{ color: 'var(--text2)' }}>
          Te enviamos un enlace de confirmación a <b>{email}</b>. Una vez confirmado, inicia sesión.
        </p>
        <button className="btn-primary" onClick={() => setModo('login')} style={{ marginTop: 20, width: '100%' }}>
          Ir al inicio de sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* Branding */}
        <div className="auth-brand">
          <div className="auth-logo-wrap">
            <TicketIcon size={36} color="#fff" />
          </div>
          <h1 className="auth-title">Rifally</h1>
          <p className="auth-tagline">La plataforma para gestionar tus rifas</p>
          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Crea rifas con números personalizados
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Comparte una página pública con tus compradores
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Realiza el sorteo con nuestra ruleta integrada
            </div>
            <div className="auth-feature">
              <span className="auth-feature-dot" />
              Agrega colaboradores para gestionar en equipo
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="auth-form-wrap">
          <div className="card auth-card">
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 4, marginBottom: 20 }}>
              {['login', 'registro'].map(m => (
                <button key={m} onClick={() => setModo(m)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 'var(--radius)', fontWeight: 500,
                    background: modo === m ? 'var(--surface)' : 'transparent',
                    color: modo === m ? 'var(--text)' : 'var(--text2)',
                    boxShadow: modo === m ? 'var(--shadow)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
                </button>
              ))}
            </div>

            {modo === 'registro' && (
              <div className="field">
                <label>Nombre completo *</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder="Ej: María García" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            )}
            <div className="field">
              <label>Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="field">
              <label>Contraseña</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', padding: '12px 0', fontSize: 15, marginTop: 4 }}>
              {loading ? 'Cargando…' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
