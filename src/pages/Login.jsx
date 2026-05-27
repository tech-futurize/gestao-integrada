import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  '/login/hero/obra-1-industrial-plant.jpg',
  '/login/hero/obra-2-steel-mill.jpg',
  '/login/hero/obra-5-road-construction.jpg',
  '/login/hero/obra-6-railway-engineer.jpg',
  '/login/hero/obra-7-port-containers.jpg',
  '/login/hero/obra-8-substation.jpg',
];

const MODULES = [
  {
    key: 'eng',
    label: 'Engenharia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M2 18a10 10 0 0 1 20 0v3H2v-3Z" />
        <path d="M10 14V8.5a2.5 2.5 0 0 1 5 0V14" />
        <path d="M4 14v-2" />
        <path d="M20 14v-2" />
      </svg>
    ),
  },
  {
    key: 'sup',
    label: 'Suprimentos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
      </svg>
    ),
  },
  {
    key: 'plan',
    label: 'Planejamento',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
        <path d="M8 15h3" />
        <path d="M14 15h2" />
        <path d="M8 19h6" />
      </svg>
    ),
  },
  {
    key: 'adm',
    label: 'Adm. Contratual',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 18c.4-1 1.6-2 2.5-2s2.1 1 2.5 2" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    key: 'risk',
    label: 'Gestão de Riscos',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    key: 'chg',
    label: 'Gestão de Mudanças',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    key: 'ai',
    label: 'Agentes de IA',
    isAI: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M12 3v2" />
        <path d="M12 19v2" />
        <path d="M3 12h2" />
        <path d="M19 12h2" />
        <path d="m5.6 5.6 1.4 1.4" />
        <path d="m17 17 1.4 1.4" />
        <path d="m5.6 18.4 1.4-1.4" />
        <path d="m17 7 1.4-1.4" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

const BRACKETS = [
  { top: 28, left: 28, borderTop: '1px solid rgba(38,255,255,.35)', borderLeft: '1px solid rgba(38,255,255,.35)', borderBottom: 0, borderRight: 0 },
  { top: 28, right: 28, borderTop: '1px solid rgba(38,255,255,.35)', borderRight: '1px solid rgba(38,255,255,.35)', borderBottom: 0, borderLeft: 0 },
  { bottom: 28, left: 28, borderBottom: '1px solid rgba(38,255,255,.35)', borderLeft: '1px solid rgba(38,255,255,.35)', borderTop: 0, borderRight: 0 },
  { bottom: 28, right: 28, borderBottom: '1px solid rgba(38,255,255,.35)', borderRight: '1px solid rgba(38,255,255,.35)', borderTop: 0, borderLeft: 0 },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [remember, setRemember] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentMod, setCurrentMod] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCurrentSlide(p => (p + 1) % SLIDES.length), 5200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCurrentMod(p => (p + 1) % MODULES.length), 1700);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError('Email ou senha inválidos.');
    } else {
      navigate('/Dashboard');
    }
    setLoading(false);
  };

  const inputBoxStyle = (focused) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    border: `1px solid ${focused ? '#26FFFF' : 'rgba(129,149,169,.32)'}`,
    background: focused ? 'rgba(38,255,255,.04)' : 'rgba(10,25,41,.5)',
    borderRadius: 12,
    padding: '0 14px',
    height: 48,
    transition: 'all .18s ease',
    boxShadow: focused ? '0 0 0 4px rgba(38,255,255,.08), 0 0 8px rgba(38,255,255,.45)' : 'none',
  });

  const modChipStyle = (isCurrent) => {
    const base = {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 7,
      padding: '7px 12px',
      borderRadius: 999,
      background: 'rgba(10,25,41,.55)',
      backdropFilter: 'blur(6px)',
      fontFamily: '"Inter",sans-serif',
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: '.01em',
      transition: 'color .35s ease, border-color .35s ease, background .35s ease, box-shadow .35s ease',
      cursor: 'default',
    };
    if (isCurrent) {
      return { ...base, color: '#34d399', border: '1px solid rgba(52,211,153,.6)', background: 'rgba(52,211,153,.14)', boxShadow: '0 0 10px rgba(52,211,153,.55)' };
    }
    return { ...base, color: '#b9c6d3', border: '1px solid rgba(129,149,169,.32)' };
  };

  return (
    <div
      className="login-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1.15fr) minmax(460px,.85fr)',
        height: '100vh',
        width: '100vw',
        fontFamily: '"Montserrat","Inter",system-ui,sans-serif',
        WebkitFontSmoothing: 'antialiased',
        overflow: 'hidden',
      }}
    >
      {/* ===== HERO — left column ===== */}
      <section
        className="login-hero"
        aria-hidden="true"
        style={{ position: 'relative', overflow: 'hidden', background: '#102A44', isolation: 'isolate' }}
      >
        {/* Slides */}
        {SLIDES.map((src, i) => (
          <div
            key={src}
            className={`login-slide${i === currentSlide ? ' active' : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}

        {/* Fine grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(38,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(38,255,255,.06) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(120% 80% at 30% 60%, #000 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(120% 80% at 30% 60%, #000 30%, transparent 75%)',
        }} />

        {/* Tinted veil */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(120% 80% at 0% 100%, rgba(38,255,255,.12), transparent 55%)',
            'radial-gradient(80% 60% at 100% 0%, rgba(219,73,116,.10), transparent 60%)',
            'linear-gradient(180deg, rgba(10,25,41,.35) 0%, rgba(10,25,41,.55) 50%, rgba(10,25,41,.85) 100%)',
            'linear-gradient(90deg, rgba(16,42,68,.65), rgba(10,25,41,.15) 60%)',
          ].join(', '),
        }} />

        {/* Scanning line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 140,
          background: 'linear-gradient(180deg, transparent 0%, rgba(38,255,255,.08) 40%, rgba(38,255,255,.18) 50%, rgba(38,255,255,.08) 60%, transparent 100%)',
          mixBlendMode: 'screen',
          animation: 'login-scan 6.5s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Corner brackets */}
        {BRACKETS.map((style, i) => (
          <div key={i} style={{ position: 'absolute', width: 42, height: 42, opacity: 0.7, ...style }} />
        ))}

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%', padding: '56px 64px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Brand bar */}
          <header style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 999, background: '#26FFFF',
              animation: 'login-dot-pulse 2.2s ease-in-out infinite',
              display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ fontFamily: '"Inter",sans-serif', fontWeight: 700, letterSpacing: '.18em', fontSize: 12, color: '#e6eef7', textTransform: 'uppercase' }}>
              FuturizeNow
            </span>
            <span style={{ width: 18, height: 1, background: '#8195A9', opacity: 0.5, flexShrink: 0 }} />
            <span style={{ fontFamily: '"Inter",sans-serif', fontWeight: 500, letterSpacing: '.16em', fontSize: 11, textTransform: 'uppercase', color: '#8195A9' }}>
              Sistema de Gestão Integrada
            </span>
          </header>

          {/* Hero claim */}
          <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Eyebrow pill */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 12px',
              border: '1px solid rgba(38,255,255,.35)', color: '#26FFFF',
              background: 'rgba(38,255,255,.12)',
              borderRadius: 999,
              fontFamily: '"Inter",sans-serif', fontWeight: 600, fontSize: 11,
              letterSpacing: '.18em', textTransform: 'uppercase',
              width: 'fit-content',
              boxShadow: '0 0 8px rgba(38,255,255,.45)',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#26FFFF', boxShadow: '0 0 8px rgba(38,255,255,.45)', flexShrink: 0 }} />
              Plataforma EPC
            </span>

            <h1 style={{
              fontFamily: '"Inter",sans-serif', fontWeight: 800,
              fontSize: 'clamp(36px, 4.4vw, 60px)',
              lineHeight: 1.04, letterSpacing: '-.02em',
              color: '#e6eef7', margin: 0,
            }}>
              Sistema de<br />
              <span style={{ color: '#26FFFF', textShadow: '0 0 22px rgba(38,255,255,.5)' }}>
                Gestão Integrada
              </span>
            </h1>

            <p style={{ fontFamily: '"Inter",sans-serif', color: '#b9c6d3', fontSize: 16, lineHeight: 1.6, maxWidth: 520, margin: 0 }}>
              Plataforma modular onde todos os dados do seu projeto estão conectados em um único sistema, permitindo controlar cada uma das áreas de gestão do seu portfólio.
            </p>

            {/* Module chips */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', maxWidth: 680 }}>
              {MODULES.map((mod, i) => {
                const isCurrent = i === currentMod;
                return (
                  <span key={mod.key} style={modChipStyle(isCurrent)}>
                    {mod.icon}
                    {mod.label}
                    {isCurrent && (
                      <span style={{
                        width: 6, height: 6, borderRadius: 999,
                        background: '#34d399', boxShadow: '0 0 10px rgba(52,211,153,.55)',
                        animation: 'login-chip-pulse 1.6s ease-in-out infinite',
                        flexShrink: 0,
                      }} />
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Hero footer */}
          <footer style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            color: '#8195A9', fontFamily: '"Inter",sans-serif',
            fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase',
          }}>
            © 2026 FuturizeNow Engenharia
          </footer>
        </div>
      </section>

      {/* ===== PANEL — right column ===== */}
      <section
        className="login-panel"
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #0c1d31 0%, #091525 100%)',
          borderLeft: '1px solid rgba(129,149,169,.18)',
          display: 'flex', flexDirection: 'column',
          padding: '48px 48px 28px',
          overflow: 'hidden',
        }}
      >
        {/* Radial overlays (replaces ::before pseudo-element) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(60% 40% at 100% 0%, rgba(38,255,255,.08), transparent 60%)',
            'radial-gradient(50% 40% at 0% 100%, rgba(219,73,116,.05), transparent 60%)',
          ].join(', '),
        }} />

        {/* Form wrap — vertically centered */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          width: '100%', zIndex: 1, gap: 32,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 104, height: 104, borderRadius: 22,
              background: 'radial-gradient(120% 100% at 50% 0%, rgba(38,255,255,.12), transparent 60%), rgba(255,255,255,.03)',
              border: '1px solid rgba(129,149,169,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(38,255,255,.08) inset, 0 24px 48px -20px rgba(0,0,0,.6), 0 0 40px rgba(38,255,255,.10)',
            }}>
              <img
                src="/login/futurizenow-mark.png"
                alt="FuturizeNow"
                style={{ width: 84, height: 84, objectFit: 'contain', filter: 'drop-shadow(0 0 14px rgba(38,255,255,.28))' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span style={{ fontFamily: '"Inter",sans-serif', fontWeight: 700, fontSize: 20, letterSpacing: '.005em', color: '#e6eef7' }}>
              FuturizeNow
            </span>
          </div>

          {/* Form inner */}
          <div style={{ maxWidth: 380, width: '100%' }}>
            {/* Welcome */}
            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <h1 style={{ fontFamily: '"Inter",sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-.01em', color: '#e6eef7', margin: 0 }}>
                Bem-vindo de volta
              </h1>
            </div>

            <form onSubmit={handleLogin} noValidate>
              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                <label htmlFor="login-email" style={{ fontFamily: '"Inter",sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8195A9' }}>
                  Usuário ou e-mail corporativo
                </label>
                <div style={inputBoxStyle(emailFocused)}>
                  <span style={{ color: emailFocused ? '#26FFFF' : '#8195A9', marginRight: 10, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .18s ease' }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="username"
                    placeholder="seu.nome@futurizenow.com.br"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    required
                    className="login-input"
                    style={{
                      background: 'none', border: 0, width: '100%',
                      fontFamily: '"Inter",sans-serif', fontSize: 14, letterSpacing: '.01em',
                      color: '#e6eef7', height: '100%',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                <label htmlFor="login-password" style={{ fontFamily: '"Inter",sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8195A9' }}>
                  Senha
                </label>
                <div style={inputBoxStyle(passwordFocused)}>
                  <span style={{ color: passwordFocused ? '#26FFFF' : '#8195A9', marginRight: 10, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color .18s ease' }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    required
                    className="login-input"
                    style={{
                      background: 'none', border: 0, width: '100%',
                      fontFamily: '"Inter",sans-serif', fontSize: 14,
                      color: '#e6eef7', height: '100%',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    style={{
                      color: '#8195A9', padding: 6, marginRight: -6, borderRadius: 6,
                      display: 'flex', alignItems: 'center',
                      background: 'none', border: 0, cursor: 'pointer',
                      transition: 'color .15s ease, background .15s ease',
                    }}
                  >
                    {showPassword ? (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.4 18.4 0 0 1 5.06-5.94" />
                        <path d="M1 1l22 22" />
                        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.43 18.43 0 0 1-3.17 4.19" />
                        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
                      </svg>
                    ) : (
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 24px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontFamily: '"Inter",sans-serif', fontSize: 13, color: '#b9c6d3', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />
                  <span style={{
                    width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                    border: `1px solid ${remember ? '#26FFFF' : 'rgba(129,149,169,.32)'}`,
                    background: remember ? '#26FFFF' : 'rgba(10,25,41,.6)',
                    boxShadow: remember ? '0 0 8px rgba(38,255,255,.45)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s ease',
                  }}>
                    {remember && (
                      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#0A1929" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  Manter conectado
                </label>
                <a
                  href="#"
                  className="login-forgot"
                  style={{ fontFamily: '"Inter",sans-serif', fontSize: 13, color: '#26FFFF', fontWeight: 500, textDecoration: 'none', transition: 'text-shadow .15s ease' }}
                >
                  Esqueci minha senha
                </a>
              </div>

              {/* Error */}
              {error && (
                <p style={{ marginBottom: 12, fontSize: 13, color: '#db4974', fontFamily: '"Inter",sans-serif' }}
                   role="alert"
                   aria-live="polite"
                >
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  position: 'relative',
                  height: 50, width: '100%',
                  borderRadius: 10,
                  background: loading ? 'rgba(38,255,255,.6)' : '#26FFFF',
                  color: '#0A1929',
                  fontFamily: '"Inter",sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '.04em',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  boxShadow: '0 0 22px rgba(38,255,255,.35), 0 0 60px rgba(38,255,255,.15), 0 1px 0 rgba(255,255,255,.4) inset',
                  transition: 'all .18s ease',
                  overflow: 'hidden',
                  border: 0,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <span style={{
                  position: 'absolute', top: 0, left: '-60%', width: '60%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)',
                  transform: 'skewX(-20deg)',
                  animation: loading ? 'none' : 'login-sheen 4.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
                {loading ? 'Entrando...' : 'Entrar no sistema'}
                {!loading && (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Panel footer */}
        <footer style={{
          zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
          paddingTop: 22,
          borderTop: '1px solid rgba(129,149,169,.18)',
          color: '#8195A9', fontFamily: '"Inter",sans-serif', fontSize: 11,
        }}>
          <a href="#" className="login-panel-link" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .15s ease' }}>
            Política de privacidade
          </a>
          <span style={{ opacity: 0.5 }}>·</span>
          <a href="#" className="login-panel-link" style={{ color: 'inherit', textDecoration: 'none', transition: 'color .15s ease' }}>
            Termos de uso
          </a>
        </footer>
      </section>
    </div>
  );
}
