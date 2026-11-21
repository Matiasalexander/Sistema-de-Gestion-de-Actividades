import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  MailCheck,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '../services/api';
import logo from '../img/gandersons-wlogo.png';

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
    <div className="relative min-h-screen w-full bg-[#000f20] bg-gradient-to-br from-[#00162e] via-[#000f20] to-[#000814] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans antialiased overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Luces orbitales de fondo */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-sky-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -top-32 right-1/3 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Tarjeta principal Glassmorphism */}
      <div className="relative w-full max-w-md rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,15,32,0.9)] p-7 sm:p-10 overflow-hidden transition-all duration-300 hover:border-white/[0.15]">
        {/* Resplandor superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        {/* Cabecera & Logotipo */}
        <div className="flex flex-col items-center text-center space-y-4 mb-7">
          <div className="group relative px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg shadow-black/20 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.1] hover:scale-105">
            <img
              src={logo}
              alt="Grupo Anderson's"
              className="h-8 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
            />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-semibold tracking-wide">
              {isResetMode ? <KeyRound className="w-3 h-3 text-blue-300" /> : <Sparkles className="w-3 h-3 text-blue-300" />}
              <span>{isResetMode ? 'Restablecimiento de Credenciales' : 'Seguridad Corporativa'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isResetMode ? 'Nueva Contraseña' : 'Recuperar Acceso'}
            </h1>
            <p className="text-xs text-blue-100/70 font-light max-w-xs mx-auto">
              {isResetMode
                ? 'Establece una nueva contraseña segura para tu cuenta corporativa.'
                : 'Ingresa tu correo corporativo y te enviaremos instrucciones seguras de restablecimiento.'}
            </p>
          </div>
        </div>

        {/* Banner de error */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* CASO 1: Modo Solicitud - Correo enviado con éxito               */}
        {/* ============================================================== */}
        {!isResetMode && requestSuccess ? (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <MailCheck className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">Instrucciones enviadas</h2>
              <p className="text-xs text-blue-100/70 leading-relaxed font-light">
                Si la cuenta <strong className="text-blue-200 font-medium">{email}</strong> está registrada y activa en la plataforma, recibirás un correo con un enlace de recuperación con validez de <strong className="text-white">15 minutos</strong>.
              </p>
              <p className="text-[11px] text-blue-200/50">
                Revisa también tu bandeja de correo no deseado o spam.
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al inicio de sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequestSuccess(false);
                  setEmail('');
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-blue-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Probar con otro correo</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 2: Modo Solicitud - Formulario de Correo                   */}
        {/* ============================================================== */}
        {!isResetMode && !requestSuccess ? (
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
              >
                Correo Corporativo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                  <Mail className="w-4 h-4" />
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
                  className="w-full pl-10 pr-4 py-3 text-xs text-white rounded-xl bg-white/[0.05] border border-white/10 placeholder-blue-200/30 transition-all duration-200 focus:outline-none focus:bg-white/[0.08] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 group relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Enviar instrucciones</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al inicio de sesión</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 3: Modo Restablecimiento - Contraseña cambiada con éxito   */}
        {/* ============================================================== */}
        {isResetMode && resetSuccess ? (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold text-white">¡Contraseña actualizada!</h2>
              <p className="text-xs text-blue-100/70 leading-relaxed font-light">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes ingresar al sistema con tus nuevas credenciales.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Iniciar Sesión Ahora</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

        {/* ============================================================== */}
        {/* CASO 4: Modo Restablecimiento - Formulario de Nueva Contraseña  */}
        {/* ============================================================== */}
        {isResetMode && !resetSuccess ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            {/* Nueva Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="newPassword"
                className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
              >
                Nueva Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                  <Lock className="w-4 h-4" />
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
                  className="w-full pl-10 pr-10 py-3 text-xs text-white rounded-xl bg-white/[0.05] border border-white/10 placeholder-blue-200/30 transition-all duration-200 focus:outline-none focus:bg-white/[0.08] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-200/50 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
              >
                Confirmar Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                  <Lock className="w-4 h-4" />
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
                  className="w-full pl-10 pr-10 py-3 text-xs text-white rounded-xl bg-white/[0.05] border border-white/10 placeholder-blue-200/30 transition-all duration-200 focus:outline-none focus:bg-white/[0.08] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-200/50 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Indicadores de requisitos de contraseña */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                    hasMinLength
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {hasMinLength ? '✓' : '•'}
                </span>
                <span className={hasMinLength ? 'text-emerald-300 font-medium' : 'text-blue-100/60'}>
                  Mínimo 12 caracteres requeridos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
                    passwordsMatch
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {passwordsMatch ? '✓' : '•'}
                </span>
                <span className={passwordsMatch ? 'text-emerald-300 font-medium' : 'text-blue-100/60'}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !hasMinLength || !passwordsMatch}
              className="w-full mt-2 group relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Guardar nueva contraseña</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleVolverAlLogin}
                className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancelar y volver al login</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Pie de Página */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-blue-200/50">
          <span>Grupo Anderson's © 2026</span>
          <span className="flex items-center gap-1 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Módulo de Seguridad</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;
