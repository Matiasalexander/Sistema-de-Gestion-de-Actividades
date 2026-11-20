import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  ChevronDown, 
  ArrowRight, 
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from './AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Estados del formulario
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [businessUnit, setBusinessUnit] = useState('corp');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ruta a la que se redirigirá tras iniciar sesión
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const userClean = identifier.trim();
    if (!userClean || !password.trim()) {
      setErrorMessage('Por favor ingrese su usuario y contraseña.');
      return;
    }

    try {
      setIsLoading(true);

      // Invocación flexible compatible con AuthContext
      // Si el context acepta objeto ({ username, password }) o parámetros individuales (username, password)
      if (typeof login === 'function') {
        try {
          await (login as any)({
            username: userClean,
            email: userClean,
            password: password,
            businessUnit: businessUnit,
            rememberMe: rememberMe
          });
        } catch (firstErr: any) {
          // Si el AuthContext espera parámetros individuales: login(username, password)
          if (firstErr?.name === 'TypeError' || !firstErr?.response) {
            await (login as any)(userClean, password);
          } else {
            throw firstErr;
          }
        }
      }

      // Redirección exitosa
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Error de autenticación:', error);
      const message = 
        error?.response?.data?.message || 
        error?.response?.data?.title || 
        error?.message || 
        'Credenciales incorrectas o servidor no disponible.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="group relative px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg shadow-black/20 flex items-center justify-center transition-all duration-300 hover:bg-white/[0.1] hover:scale-105">
            <img 
              src="/assets/ANDERSONS-negro.png" 
              alt="Grupo Anderson's" 
              className="h-7 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-white font-extrabold tracking-widest text-xs uppercase pl-2 font-mono">
              GRUPO ANDERSON'S
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-[11px] font-semibold tracking-wide">
              <Sparkles className="w-3 h-3 text-blue-300" />
              <span>Plataforma Corporativa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sistema de Gestión GA
            </h1>
            <p className="text-xs text-blue-100/70 font-light max-w-xs mx-auto">
              Ingrese con sus credenciales autorizadas para acceder a sus tableros y mesa de servicio.
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

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Identificador / Usuario */}
          <div className="space-y-1.5">
            <label 
              htmlFor="identifier" 
              className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
            >
              Usuario o Correo Corporativo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <User className="w-4 h-4" />
              </span>
              <input
                id="identifier"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="matias.arceo@grupoandersons.com"
                className="w-full pl-10 pr-4 py-3 text-xs text-white rounded-xl bg-white/[0.05] border border-white/10 placeholder-blue-200/30 transition-all duration-200 focus:outline-none focus:bg-white/[0.08] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label 
                htmlFor="password" 
                className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
              >
                Contraseña
              </label>
              <a 
                href="#forgot" 
                className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
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

          {/* Unidad de Negocio */}
          <div className="space-y-1.5">
            <label 
              htmlFor="businessUnit" 
              className="block text-[11px] font-bold text-blue-100/90 uppercase tracking-wider"
            >
              Unidad de Negocio / Sucursal
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-300">
                <Building2 className="w-4 h-4" />
              </span>
              <select
                id="businessUnit"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-xs text-white rounded-xl bg-white/[0.05] border border-white/10 transition-all duration-200 focus:outline-none focus:bg-[#00162e] focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="corp" className="bg-[#00162e] text-white">Grupo Anderson's Corporativo</option>
                <option value="frogs" className="bg-[#00162e] text-white">Señor Frog's</option>
                <option value="harrys" className="bg-[#00162e] text-white">Harry's Steakhouse</option>
                <option value="charlies" className="bg-[#00162e] text-white">Carlos'n Charlie's</option>
              </select>
              <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-blue-200/50">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-white/[0.08] border-white/20 text-blue-600 focus:ring-blue-500/30"
              />
              <span className="text-xs text-blue-100/80 font-light">Recordar mi sesión</span>
            </label>
            <span className="flex items-center gap-1 text-[11px] text-blue-200/70 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>RBAC Activo</span>
            </span>
          </div>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 group relative flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Acceder a la Plataforma</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {/* Separador */}
          <div className="relative py-2 flex items-center justify-center">
            <span className="absolute inset-x-0 h-px bg-white/10" />
            <span className="relative bg-[#001328] px-3 text-[10px] text-blue-200/50 uppercase tracking-widest font-semibold rounded-full border border-white/5">
              Acceso Institucional
            </span>
          </div>

          {/* SSO Corporativo */}
          <button
            type="button"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-blue-100/90 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 transition-all flex items-center justify-center gap-2.5 hover:border-white/20 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>Microsoft Active Directory (SSO)</span>
          </button>
        </form>

        {/* Pie de Página */}
        <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-blue-200/50">
          <span>Grupo Anderson's © 2026</span>
          <span className="font-mono">v1.0 &bull; .NET &amp; SQL Server</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
