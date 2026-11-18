import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Lock, User, AlertCircle, Layers } from 'lucide-react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../services/api';

const loginSchema = z.object({
  identificador: z.string().min(2, 'Ingrese su usuario, correo o teléfono'),
  password: z.string().min(6, 'Ingrese su contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [modo, setModo] = useState<'login' | 'forgot' | 'reset'>(
    window.location.hash.startsWith('#reset-password?') ? 'reset' : 'login');
  const [email, setEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const token = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token') || '';
  const volver = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setModo('login'); setErrorServidor(null); setMensaje('');
  };
  const solicitar = async () => {
    setOcupado(true); setErrorServidor(null); setMensaje('');
    try {
      const resp = await apiFetch<{mensaje:string}>('/api/auth/forgot-password', {
        method:'POST', body: JSON.stringify({ email }) });
      setMensaje(resp.mensaje);
    } catch(e:unknown) { setErrorServidor(e instanceof Error ? e.message : 'No fue posible procesar la solicitud.'); }
    finally { setOcupado(false); }
  };
  const restablecer = async () => {
    if (!token || nuevoPassword.length < 12 || nuevoPassword !== confirmarPassword) {
      setErrorServidor('Revisa el enlace y confirma una contraseña de al menos 12 caracteres.'); return;
    }
    setOcupado(true); setErrorServidor(null);
    try {
      const resp = await apiFetch<{mensaje:string}>('/api/auth/reset-password', {
        method:'POST', body: JSON.stringify({token, nuevoPassword}) });
      volver(); setMensaje(resp.mensaje);
    } catch(e:unknown) { setErrorServidor(e instanceof Error ? e.message : 'No fue posible restablecer la contraseña.'); }
    finally {setOcupado(false);}
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identificador: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorServidor(null);
    try {
      await login(values.identificador, values.password);
    } catch (err: any) {
      setErrorServidor(err.message || 'No fue posible iniciar sesión.');
    }
  };


  return (
    <div className="min-h-screen flex bg-slate-950 text-white">
      {/* Panel Izquierdo Corporativo */}
      <div className="hidden lg:flex lg:w-7/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-12 flex-col justify-between border-r border-slate-800">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-400/20 text-blue-300 text-sm font-medium">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>Plataforma Corporativa · Grupo GA</span>
          </div>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white leading-tight">
            Sistema de Gestión GA
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-xl leading-relaxed">
            Gestión unificada de portafolio de proyectos, tableros operativos de actividades,
            mesa de ayuda corporativa y cumplimiento de acuerdos de nivel de servicio (SLA).
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 my-8">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur">
            <div className="text-blue-400 font-semibold text-sm">Work Management</div>
            <div className="mt-1 text-base font-medium text-white">Tableros Kanban, Gantt y Carga</div>
            <p className="mt-1 text-xs text-slate-400">
              Dependencias sin ciclos, subtareas, checklists, tiempos trabajados y avance automático ponderado.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 backdrop-blur">
            <div className="text-emerald-400 font-semibold text-sm">Service Desk & SLA</div>
            <div className="mt-1 text-base font-medium text-white">Mesa de Ayuda y Escalamiento</div>
            <p className="mt-1 text-xs text-slate-400">
              Folios únicos, políticas SLA con calendario laboral, pausas controladas y actividades técnicas vinculadas.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Seguridad RBAC + Aislamiento estricto por Unidad de Negocio
          </span>
          <span>v1.0 · ASP.NET Core & SQL Server</span>
        </div>
      </div>

      {/* Panel Derecho Formulario */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{modo === 'login' ? 'Iniciar sesión corporativa' : modo === 'forgot' ? 'Recuperar acceso' : 'Nueva contraseña'}</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {modo === 'login' ? 'Ingrese sus credenciales para acceder a las unidades autorizadas.' : modo === 'forgot' ? 'Recibirás tu usuario y un enlace seguro en tu correo registrado.' : 'Escribe una contraseña nueva para tu cuenta.'}
            </p>
          </div>

          {errorServidor && (
            <div
              role="alert"
              className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorServidor}</span>
            </div>
          )}

          {mensaje && <p role="status" className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm">{mensaje}</p>}
          {modo === 'forgot' && <div className="space-y-4">
            <label htmlFor="email-recuperacion" className="block text-sm font-medium">Correo registrado</label>
            <input id="email-recuperacion" type="email" autoComplete="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-800" />
            <button type="button" disabled={ocupado || !email.includes('@')} onClick={solicitar}
              className="w-full p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50">Enviar enlace de recuperación</button>
            <button type="button" onClick={volver} className="text-sm text-blue-600">Volver al inicio de sesión</button>
          </div>}
          {modo === 'reset' && <div className="space-y-4">
            <label htmlFor="nueva-password" className="block text-sm font-medium">Contraseña nueva (mínimo 12 caracteres)</label>
            <input id="nueva-password" type="password" autoComplete="new-password" value={nuevoPassword}
              onChange={e => setNuevoPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-800" />
            <label htmlFor="confirmar-password" className="block text-sm font-medium">Confirmar contraseña</label>
            <input id="confirmar-password" type="password" autoComplete="new-password" value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 bg-white dark:bg-slate-800" />
            <button type="button" disabled={ocupado} onClick={restablecer}
              className="w-full p-3 rounded-xl bg-blue-600 text-white disabled:opacity-50">Guardar contraseña</button>
            <button type="button" onClick={volver} className="text-sm text-blue-600">Volver al inicio de sesión</button>
          </div>}
          {modo === 'login' && <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="identificador" className="block text-sm font-medium mb-1.5">
                Usuario, correo o teléfono móvil
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="identificador"
                  type="text"
                  autoComplete="username"
                  placeholder="Usuario, correo o teléfono"
                  {...register('identificador')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {errors.identificador && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.identificador.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  {...register('password')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm shadow-sm transition cursor-pointer"
            >
              {isSubmitting ? 'Verificando acceso...' : 'Acceder a la Plataforma'}
            </button>
          </form>
          <div className="text-right"><button type="button" onClick={() => {setModo('forgot');setErrorServidor(null);setMensaje('');}}
            className="text-sm text-blue-600 hover:underline">¿Olvidaste tu usuario o contraseña?</button></div>
          </>}


        </div>
      </div>
    </div>
  );
};
