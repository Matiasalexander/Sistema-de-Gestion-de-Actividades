import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import logo from '../img/gandersons-wlogo.png';
import '../styles/PasswordRecoveryPage.css';

export const PasswordRecoveryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Detección automática del token desde query params (?token=...) o hash (#reset-password?token=...)
  const token = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromSearch = searchParams.get('token');
    if (tokenFromSearch) return tokenFromSearch;

    if (location.hash) {
      const hashContent = location.hash.includes('?') 
        ? location.hash.split('?')[1] 
        : location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashContent);
      return hashParams.get('token') || '';
    }

    return '';
  }, [location.search, location.hash]);

  const isResetMode = Boolean(token);

  // Estados del modo Solicitud
  const [email, setEmail] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Estados del modo Restablecimiento
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Estados comunes de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validaciones en tiempo real para la contraseña
  const hasMinLength = newPassword.length >= 12;
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Manejar solicitud de enlace
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = email.trim();
    if (!emailClean) {
      setErrorMessage('Por favor ingrese su correo corporativo.');
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch<{ mensaje: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: emailClean }),
      });
      setRequestSuccess(true);
    } catch (err: any) {
      console.error('Error al solicitar recuperación:', err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo procesar la solicitud en este momento. Intente más tarde.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio efectivo de contraseña
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage('La contraseña debe tener al menos 12 caracteres.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch<{ mensaje: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          nuevoPassword: newPassword,
        }),
      });
      setResetSuccess(true);
    } catch (err: any) {
      console.error('Error al restablecer contraseña:', err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        'El enlace ha expirado o no es válido. Por favor solicita uno nuevo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolverAlLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== 'undefined') {
      window.location.hash = '';
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="recovery-wrapper">

      {/* Luces orbitales de fondo */}
      <div className="recovery-orb recovery-orb-1" />
      <div className="recovery-orb recovery-orb-2" />
      <div className="recovery-orb recovery-orb-3" />

      {/* Tarjeta principal Glassmorphism */}
      <div className="recovery-card">
        {/* Resplandor superior sutil */}
        <div className="recovery-card-shine" />

        {/* Cabecera & Logotipo */}
        <div className="recovery-header">
          <div className="recovery-logo-container">
            <img className="recovery-logo" src={logo} alt="Grupo Anderson's Logo" />
          </div>

          <div className="recovery-header-text">
            <h1 className="recovery-title">
              {isResetMode ? 'Nueva Contraseña' : 'Recuperar Acceso'}
            </h1>
            <p className="recovery-subtitle">
              {isResetMode
                ? 'Establece una nueva contraseña segura para tu cuenta corporativa.'
                : 'Ingresa tu correo corporativo para obtener el link de restablecimiento.'}
            </p>
          </div>
        </div>

        {/* Banner de error */}
        {errorMessage && (
          <div className="recovery-alert">
            <AlertCircle className="recovery-alert-icon" />
            <span className="recovery-alert-text">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASO 1: Modo Solicitud - Correo enviado con éxito               */}
        {/* ============================================================== */}
        {!isResetMode && requestSuccess ? (
          <div className="recovery-success-box">
            <div className="recovery-success-icon-wrap">
              <MailCheck className="recovery-success-icon" />
            </div>

            <div>
              <h2 className="recovery-success-title">Instrucciones enviadas</h2>
              <p className="recovery-success-message">
                Si la cuenta <strong style={{ color: '#bfdbfe', fontWeight: 500 }}>{email}</strong> está registrada y activa en la plataforma, recibirás un correo con un enlace de recuperación con validez de <strong style={{ color: '#fff' }}>15 minutos</strong>.
              </p>
              <p className="recovery-success-hint">
                Revisa también tu bandeja de correo no deseado o spam.
              </p>
            </div>

            <div className="recovery-actions-column">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="recovery-btn-submit"
              >
                <ArrowLeft className="recovery-icon" />
                <span>Volver al inicio de sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequestSuccess(false);
                  setEmail('');
                }}
                className="recovery-btn-secondary"
              >
                <RefreshCw className="recovery-icon" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Probar con otro correo</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 2: Modo Solicitud - Formulario de Correo                   */}
        {/* ============================================================== */}
        {!isResetMode && !requestSuccess ? (
          <form onSubmit={handleRequestSubmit} className="recovery-form">
            <div className="recovery-field">
              <label htmlFor="email" className="recovery-label">
                Correo Corporativo
              </label>
              <div className="recovery-input-group">
                <span className="recovery-input-icon">
                  <Mail className="recovery-icon" />
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@grupoandersons.com"
                  className="recovery-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="recovery-btn-submit"
            >
              {isLoading ? (
                <div className="recovery-spinner" />
              ) : (
                <>
                  <span>Enviar instrucciones</span>
                  <ArrowRight className="recovery-btn-arrow" />
                </>
              )}
            </button>

            <div className="recovery-back-container">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="recovery-btn-back-link"
              >
                <ArrowLeft className="recovery-icon" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Volver al inicio de sesión</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 3: Modo Restablecimiento - Contraseña cambiada con éxito   */}
        {/* ============================================================== */}
        {isResetMode && resetSuccess ? (
          <div className="recovery-success-box">
            <div className="recovery-success-icon-wrap">
              <CheckCircle2 className="recovery-success-icon" />
            </div>

            <div>
              <h2 className="recovery-success-title">¡Contraseña actualizada!</h2>
              <p className="recovery-success-message">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar al sistema con tus nuevas credenciales.
              </p>
            </div>

            <div style={{ paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="recovery-btn-submit"
              >
                <span>Iniciar Sesión Ahora</span>
                <ArrowRight className="recovery-icon" />
              </button>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 4: Modo Restablecimiento - Formulario de Nueva Contraseña  */}
        {/* ============================================================== */}
        {isResetMode && !resetSuccess ? (
          <form onSubmit={handleResetSubmit} className="recovery-form">
            {/* Nueva Contraseña */}
            <div className="recovery-field">
              <label htmlFor="newPassword" className="recovery-label">
                Nueva Contraseña
              </label>
              <div className="recovery-input-group">
                <span className="recovery-input-icon">
                  <Lock className="recovery-icon" />
                </span>
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 12 caracteres"
                  className="recovery-input recovery-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="recovery-password-toggle"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="recovery-icon" /> : <Eye className="recovery-icon" />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="recovery-field">
              <label htmlFor="confirmPassword" className="recovery-label">
                Confirmar Contraseña
              </label>
              <div className="recovery-input-group">
                <span className="recovery-input-icon">
                  <Lock className="recovery-icon" />
                </span>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="recovery-input recovery-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="recovery-password-toggle"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="recovery-icon" /> : <Eye className="recovery-icon" />}
                </button>
              </div>
            </div>

            {/* Indicadores de requisitos de contraseña */}
            <div className="recovery-requirements">
              <div className="recovery-req-item">
                <span className={`recovery-req-bullet ${hasMinLength ? 'valid' : 'invalid'}`}>
                  {hasMinLength ? '✓' : '•'}
                </span>
                <span className={`recovery-req-text ${hasMinLength ? 'valid' : 'invalid'}`}>
                  Mínimo 12 caracteres requeridos
                </span>
              </div>
              <div className="recovery-req-item">
                <span className={`recovery-req-bullet ${passwordsMatch ? 'valid' : 'invalid'}`}>
                  {passwordsMatch ? '✓' : '•'}
                </span>
                <span className={`recovery-req-text ${passwordsMatch ? 'valid' : 'invalid'}`}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !hasMinLength || !passwordsMatch}
              className="recovery-btn-submit"
            >
              {isLoading ? (
                <div className="recovery-spinner" />
              ) : (
                <>
                  <span>Guardar nueva contraseña</span>
                  <ArrowRight className="recovery-btn-arrow" />
                </>
              )}
            </button>

            <div className="recovery-back-container">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="recovery-btn-back-link"
              >
                <ArrowLeft className="recovery-icon" style={{ width: '0.875rem', height: '0.875rem' }} />
                <span>Cancelar y volver al login</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Pie de Página */}
        <div className="recovery-footer">
          <span>Grupo Anderson's © 2026</span>

        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;