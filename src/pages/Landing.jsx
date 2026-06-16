import { useNavigate } from 'react-router-dom';
import { TicketIcon } from '../components/Icons';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      <nav className="nav">
        <span className="nav-logo">
          <TicketIcon size={20} color="var(--accent)" />
          Rifally
        </span>
        <button className="btn-primary btn-icon-label" onClick={() => navigate('/app')} style={{ fontSize: 13 }}>
          <TicketIcon size={14} color="#fff" />
          Entrar
        </button>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '72px 24px 56px', maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-light)', border: '1px solid var(--accent)',
          borderRadius: 20, padding: '6px 14px', marginBottom: 24,
          fontSize: 13, fontWeight: 500, color: 'var(--accent-dark)',
        }}>
          <TicketIcon size={14} color="var(--accent)" />
          Gestión de rifas simple y rápida
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 48, fontWeight: 800, lineHeight: 1.1,
          marginBottom: 20, color: 'var(--text)',
        }}>
          Organiza tus rifas<br />
          <span style={{ color: 'var(--accent)' }}>sin complicaciones</span>
        </h1>
        <p style={{
          fontSize: 17, color: 'var(--text2)', lineHeight: 1.7,
          marginBottom: 36, maxWidth: 460, margin: '0 auto 36px',
        }}>
          Crea rifas, gestiona los números, trabaja con colaboradores y realiza el sorteo — todo en un solo lugar.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/app')}
            style={{ padding: '13px 28px', fontSize: 15, fontWeight: 600 }}>
            Crear mi primera rifa
          </button>
          <button className="btn-secondary" onClick={() => navigate('/app')}
            style={{ padding: '13px 28px', fontSize: 15 }}>
            Iniciar sesión
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 0,
        borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexWrap: 'wrap',
      }}>
        {[
          { val: '100%', label: 'Gratuito' },
          { val: 'Ilimitado', label: 'Rifas y números' },
          { val: 'Instantáneo', label: 'Sorteo aleatorio' },
          { val: 'Compartible', label: 'Página pública' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 36px', textAlign: 'center',
            borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            flex: '1 1 140px',
          }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>
              {s.val}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px', width: '100%' }}>
        <h2 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 28, fontWeight: 700, textAlign: 'center',
          marginBottom: 8, color: 'var(--text)',
        }}>
          Todo lo que necesitas
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 15, marginBottom: 40 }}>
          Sin apps adicionales, sin complicaciones
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            {
              titulo: 'Crea en segundos',
              desc: 'Define el premio, la cantidad de números y el precio. Los boletos se generan automáticamente.',
            },
            {
              titulo: 'Colabora en equipo',
              desc: 'Invita colaboradores para que te ayuden a gestionar los números. Cada uno con acceso completo.',
            },
            {
              titulo: 'Página pública',
              desc: 'Comparte un enlace para que cualquiera vea qué números están disponibles sin revelar nombres.',
            },
            {
              titulo: 'Sorteo justo',
              desc: 'Ruleta aleatoria con soporte para regiros. El proceso queda registrado y es completamente transparente.',
            },
          ].map(f => (
            <div key={f.titulo} className="card" style={{ padding: '24px 22px', textAlign: 'left' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--accent)', marginBottom: 14,
              }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                {f.titulo}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '64px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 28, fontWeight: 700, textAlign: 'center',
            marginBottom: 8, color: 'var(--text)',
          }}>
            Cómo funciona
          </h2>
          <p style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 15, marginBottom: 48 }}>
            En tres pasos tienes tu rifa activa
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { num: '1', titulo: 'Crea tu rifa', desc: 'Ponle nombre, define el premio y cuántos números quieres. Rifally los crea todos al instante.' },
              { num: '2', titulo: 'Gestiona los números', desc: 'Aparta números a nombre de cada participante. Puedes buscar, filtrar y editar en cualquier momento.' },
              { num: '3', titulo: 'Haz el sorteo', desc: 'Cuando estés listo, gira la ruleta. El ganador queda registrado y puedes compartir la página pública con el resultado.' },
            ].map((paso, i) => (
              <div key={i} style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                paddingBottom: i < 2 ? 32 : 0,
                marginBottom: i < 2 ? 32 : 0,
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--accent)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16,
                  flexShrink: 0,
                }}>
                  {paso.num}
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--text)', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {paso.titulo}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{paso.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA final */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent-dark) 0%, var(--accent) 100%)',
        padding: '64px 24px', textAlign: 'center',
      }}>
        <h2 style={{ color: '#fff', fontFamily: "'Space Grotesk', sans-serif", fontSize: 30, fontWeight: 800, marginBottom: 12 }}>
          Empieza gratis hoy
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
          Sin costos, sin instalaciones. Solo crea tu cuenta y organiza tu primera rifa en minutos.
        </p>
        <button onClick={() => navigate('/app')} style={{
          background: '#fff', color: 'var(--accent-dark)',
          border: 'none', borderRadius: 'var(--radius)',
          padding: '14px 32px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          transition: 'opacity 0.15s',
        }}
          onMouseEnter={e => e.target.style.opacity = '0.9'}
          onMouseLeave={e => e.target.style.opacity = '1'}
        >
          Crear cuenta gratis
        </button>
      </div>

      {/* Footer */}
      <div style={{
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--text3)',
      }}>
        © 2026 | William Vega | Rifally | All rights reserved.
      </div>

    </div>
  );
}