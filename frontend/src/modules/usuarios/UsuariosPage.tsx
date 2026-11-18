import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserPlus,
  Shield,
  Building2,
  History,
  FileSearch,
  KeyRound,
  Power,
  Check,
  Search,
  Trash2,
  Plus,
  Edit2,
  X,
  AlertCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  apiFetch,
  AuditoriaEventoItem,
  DepartamentoItem,
  EquipoItem,
  HistorialAccesoItem,
  PermisoItem,
  RolItem,
  UnidadItem,
  UsuarioLista,
} from '../../services/api';

export const UsuariosPage: React.FC = () => {
  const { tienePermiso, usuario: usuarioActual } = useAuth();
  const queryClient = useQueryClient();

  const [tabActiva, setTabActiva] = useState<'usuarios' | 'roles' | 'unidades' | 'accesos' | 'auditoria'>('usuarios');
  const [busqueda, setBusqueda] = useState('');
  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioLista | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioLista | null>(null);
  const [modalEliminarUsuario, setModalEliminarUsuario] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState<RolItem | null>(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado formulario usuario
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [departamentoId, setDepartamentoId] = useState<number | undefined>(undefined);
  const [accesoGlobal, setAccesoGlobal] = useState(false);
  const [rolesIds, setRolesIds] = useState<number[]>([]);
  const [unidadesIds, setUnidadesIds] = useState<number[]>([]);
  const [equiposIds, setEquiposIds] = useState<number[]>([]);

  // Estados Unidades de Negocio
  const [modalUnidadAbierto, setModalUnidadAbierto] = useState(false);
  const [unidadEnEdicion, setUnidadEnEdicion] = useState<UnidadItem | null>(null);
  const [unidadAEliminar, setUnidadAEliminar] = useState<UnidadItem | null>(null);
  const [modalEliminarUnidadAbierto, setModalEliminarUnidadAbierto] = useState(false);
  const [codigoUnidad, setCodigoUnidad] = useState('');
  const [nombreUnidad, setNombreUnidad] = useState('');
  const [descripcionUnidad, setDescripcionUnidad] = useState('');
  const [zonaHorariaUnidad, setZonaHorariaUnidad] = useState('America/Mexico_City');
  const [activaUnidad, setActivaUnidad] = useState(true);

  // Estados Departamentos
  const [modalDeptoAbierto, setModalDeptoAbierto] = useState(false);
  const [deptoEnEdicion, setDeptoEnEdicion] = useState<DepartamentoItem | null>(null);
  const [deptoAEliminar, setDeptoAEliminar] = useState<DepartamentoItem | null>(null);
  const [modalEliminarDeptoAbierto, setModalEliminarDeptoAbierto] = useState(false);
  const [deptoUnidadId, setDeptoUnidadId] = useState<number>(1);
  const [codigoDepto, setCodigoDepto] = useState('');
  const [nombreDepto, setNombreDepto] = useState('');
  const [descripcionDepto, setDescripcionDepto] = useState('');
  const [activaDepto, setActivaDepto] = useState(true);
  const [modalRestablecerCorpAbierto, setModalRestablecerCorpAbierto] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState<UsuarioLista | null>(null);
  const [nuevoPasswordAdmin, setNuevoPasswordAdmin] = useState('');
  const [confirmacionPasswordAdmin, setConfirmacionPasswordAdmin] = useState('');
  const [debeCambiarPasswordAdmin, setDebeCambiarPasswordAdmin] = useState(true);
  const [mostrarPasswordAdmin, setMostrarPasswordAdmin] = useState(false);

  // Consultas API reales
  const { data: usuarios = [], isLoading: cargandoUsuarios } = useQuery<UsuarioLista[]>({
    queryKey: ['usuarios', busqueda],
    queryFn: () =>
      apiFetch<UsuarioLista[]>(
        `/api/usuarios${busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : ''}`
      ),
  });

  const { data: roles = [] } = useQuery<RolItem[]>({
    queryKey: ['roles'],
    queryFn: () => apiFetch<RolItem[]>('/api/roles'),
  });

  const { data: permisos = [] } = useQuery<PermisoItem[]>({
    queryKey: ['permisos'],
    queryFn: () => apiFetch<PermisoItem[]>('/api/permisos'),
  });

  const { data: unidades = [] } = useQuery<UnidadItem[]>({
    queryKey: ['unidades'],
    queryFn: () => apiFetch<UnidadItem[]>('/api/unidades?incluirTodasAdmin=true'),
  });

  const { data: departamentos = [] } = useQuery<DepartamentoItem[]>({
    queryKey: ['departamentos'],
    queryFn: () => apiFetch<DepartamentoItem[]>('/api/departamentos'),
  });

  const { data: equipos = [] } = useQuery<EquipoItem[]>({
    queryKey: ['equipos'],
    queryFn: () => apiFetch<EquipoItem[]>('/api/equipos'),
  });

  const { data: accesos = [] } = useQuery<HistorialAccesoItem[]>({
    queryKey: ['accesos'],
    queryFn: () => apiFetch<HistorialAccesoItem[]>('/api/usuarios/accesos'),
    enabled: tabActiva === 'accesos',
  });

  const { data: auditoria = [] } = useQuery<AuditoriaEventoItem[]>({
    queryKey: ['auditoria'],
    queryFn: () => apiFetch<AuditoriaEventoItem[]>('/api/auditoria'),
    enabled: tabActiva === 'auditoria' && tienePermiso('auditoria.ver'),
  });

  const abrirNuevoUsuario = () => {
    setUsuarioEditando(null);
    setNombreUsuario('');
    setEmail('');
    setNombreCompleto('');
    setCargo('');
    setTelefono('');
    setPassword('');
    setDepartamentoId(departamentos[0]?.id);
    setAccesoGlobal(false);
    setRolesIds(roles[3] ? [roles[3].id] : []);
    setUnidadesIds(unidades[0] ? [unidades[0].id] : []);
    setEquiposIds([]);
    setModalUsuarioAbierto(true);
  };

  const abrirEdicionUsuario = (u: UsuarioLista) => {
    setUsuarioEditando(u);
    setNombreUsuario(u.nombreUsuario);
    setEmail(u.email);
    setNombreCompleto(u.nombreCompleto);
    setCargo(u.cargo || '');
    setTelefono(u.telefono || '');
    setDepartamentoId(u.departamentoId);
    setAccesoGlobal(u.accesoGlobalUnidades);
    setRolesIds(u.roles.map((r) => r.id));
    setUnidadesIds(u.unidades.map((un) => un.id));
    setEquiposIds([]);
    setModalUsuarioAbierto(true);
  };

  const guardarUsuarioMutation = useMutation({
    mutationFn: async () => {
      const telDigitos = telefono.replace(/\D/g, '');
      if (!telefono.trim() || telDigitos.length < 10) {
        throw new Error('El número de teléfono móvil es obligatorio y debe contener al menos 10 dígitos.');
      }

      if (usuarioEditando) {
        return apiFetch(`/api/usuarios/${usuarioEditando.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            email,
            nombreCompleto,
            cargo,
            telefono,
            departamentoId: departamentoId || null,
            accesoGlobalUnidades: accesoGlobal,
            activo: usuarioEditando.activo,
            rolesIds,
            unidadesIds,
            unidadPrincipalId: unidadesIds[0] || null,
            equiposIds,
          }),
        });
      } else {
        return apiFetch('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify({
            nombreUsuario,
            email,
            nombreCompleto,
            cargo,
            telefono,
            password,
            departamentoId: departamentoId || null,
            accesoGlobalUnidades: accesoGlobal,
            activo: true,
            rolesIds,
            unidadesIds,
            unidadPrincipalId: unidadesIds[0] || null,
            equiposIds,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalUsuarioAbierto(false);
      setMensajeExito('Usuario guardado y auditado correctamente.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const cambiarEstadoMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }) =>
      apiFetch(`/api/usuarios/${id}/estado?activo=${activo}`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setMensajeExito('Estado de cuenta actualizado.');
      setTimeout(() => setMensajeExito(null), 3000);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, nuevoPassword, debeCambiarPassword }: { id: number; nuevoPassword: string; debeCambiarPassword: boolean }) =>
      apiFetch(`/api/usuarios/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ nuevoPassword, debeCambiarPassword }),
      }),
    onSuccess: () => {
      setUsuarioPassword(null);
      setNuevoPasswordAdmin('');
      setConfirmacionPasswordAdmin('');
      setMostrarPasswordAdmin(false);
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setMensajeExito('Contraseña actualizada. Las sesiones anteriores fueron revocadas.');
      setTimeout(() => setMensajeExito(null), 4000);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const abrirRestablecimientoPassword = (u: UsuarioLista) => {
    setUsuarioPassword(u);
    setNuevoPasswordAdmin('');
    setConfirmacionPasswordAdmin('');
    setDebeCambiarPasswordAdmin(true);
    setMostrarPasswordAdmin(false);
    setErrorMsg(null);
  };

  const eliminarUsuarioMutation = useMutation({
    mutationFn: async (id: number) => apiFetch(`/api/usuarios/${id}`, { method: 'DELETE' }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setMensajeExito(data?.mensaje || 'Usuario eliminado / dado de baja exitosamente.');
      setModalEliminarUsuario(false);
      setUsuarioAEliminar(null);
      setTimeout(() => setMensajeExito(null), 4000);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const guardarPermisosRolMutation = useMutation({
    mutationFn: async () => {
      if (!rolSeleccionado) return;
      return apiFetch(`/api/roles/${rolSeleccionado.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          codigo: rolSeleccionado.codigo,
          nombre: rolSeleccionado.nombre,
          descripcion: rolSeleccionado.descripcion,
          activo: rolSeleccionado.activo,
          permisosCodigos: permisosSeleccionados,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setMensajeExito('Matriz de permisos del rol actualizada en SQL Server.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
  });

  const toggleItemArray = <T,>(arr: T[], item: T, setter: (val: T[]) => void) => {
    if (arr.includes(item)) {
      setter(arr.filter((x) => x !== item));
    } else {
      setter([...arr, item]);
    }
  };

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce<Record<string, PermisoItem[]>>((acc, p) => {
    acc[p.modulo] = acc[p.modulo] || [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  const esAdmin =
    usuarioActual?.roles.some((r) => r === 'SUPER_ADMIN' || r === 'ADMIN') ||
    usuarioActual?.accesoGlobalUnidades;
  const puedeGestionarUnidades = tienePermiso('unidades.gestionar') || esAdmin;
  const puedeEliminarUnidades =
    tienePermiso('unidades.eliminar') || tienePermiso('unidades.gestionar') || esAdmin;

  const abrirNuevaUnidad = () => {
    setUnidadEnEdicion(null);
    setCodigoUnidad(`UN-${unidades.length + 10}`);
    setNombreUnidad('');
    setDescripcionUnidad('');
    setZonaHorariaUnidad('America/Mexico_City');
    setActivaUnidad(true);
    setModalUnidadAbierto(true);
  };

  const abrirEditarUnidad = (u: UnidadItem) => {
    setUnidadEnEdicion(u);
    setCodigoUnidad(u.codigo);
    setNombreUnidad(u.nombre);
    setDescripcionUnidad(u.descripcion || '');
    setZonaHorariaUnidad(u.zonaHoraria || 'America/Mexico_City');
    setActivaUnidad(u.activa);
    setModalUnidadAbierto(true);
  };

  const abrirNuevoDepartamento = (targetUnidadId: number) => {
    setDeptoEnEdicion(null);
    setDeptoUnidadId(targetUnidadId);
    setCodigoDepto(`DEP-${Math.floor(Math.random() * 899 + 100)}`);
    setNombreDepto('');
    setDescripcionDepto('');
    setActivaDepto(true);
    setModalDeptoAbierto(true);
  };

  const abrirEditarDepartamento = (d: DepartamentoItem) => {
    setDeptoEnEdicion(d);
    setDeptoUnidadId(d.unidadId);
    setCodigoDepto(d.codigo);
    setNombreDepto(d.nombre);
    setDescripcionDepto(d.descripcion || '');
    setActivaDepto(d.activa);
    setModalDeptoAbierto(true);
  };

  const guardarUnidadMutation = useMutation({
    mutationFn: async () => {
      if (unidadEnEdicion) {
        return apiFetch(`/api/unidades/${unidadEnEdicion.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            codigo: codigoUnidad,
            nombre: nombreUnidad,
            descripcion: descripcionUnidad,
            zonaHoraria: zonaHorariaUnidad,
            activa: activaUnidad,
          }),
        });
      } else {
        return apiFetch('/api/unidades', {
          method: 'POST',
          body: JSON.stringify({
            codigo: codigoUnidad,
            nombre: nombreUnidad,
            descripcion: descripcionUnidad,
            zonaHoraria: zonaHorariaUnidad,
            activa: activaUnidad,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalUnidadAbierto(false);
      setMensajeExito(unidadEnEdicion ? 'Unidad de negocio actualizada.' : 'Unidad de negocio creada.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const eliminarUnidadMutation = useMutation({
    mutationFn: async (id: number) => apiFetch(`/api/unidades/${id}`, { method: 'DELETE' }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalEliminarUnidadAbierto(false);
      setUnidadAEliminar(null);
      setMensajeExito(data?.mensaje || 'Unidad de negocio eliminada.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const guardarDeptoMutation = useMutation({
    mutationFn: async () => {
      if (deptoEnEdicion) {
        return apiFetch(`/api/departamentos/${deptoEnEdicion.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            unidadId: deptoUnidadId,
            codigo: codigoDepto,
            nombre: nombreDepto,
            descripcion: descripcionDepto,
            activa: activaDepto,
          }),
        });
      } else {
        return apiFetch('/api/departamentos', {
          method: 'POST',
          body: JSON.stringify({
            unidadId: deptoUnidadId,
            codigo: codigoDepto,
            nombre: nombreDepto,
            descripcion: descripcionDepto,
            activa: activaDepto,
          }),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalDeptoAbierto(false);
      setMensajeExito(deptoEnEdicion ? 'Departamento actualizado.' : 'Departamento creado.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const eliminarDeptoMutation = useMutation({
    mutationFn: async (id: number) => apiFetch(`/api/departamentos/${id}`, { method: 'DELETE' }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalEliminarDeptoAbierto(false);
      setDeptoAEliminar(null);
      setMensajeExito(data?.mensaje || 'Departamento eliminado.');
      setTimeout(() => setMensajeExito(null), 3500);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  const restablecerCorporativoMutation = useMutation({
    mutationFn: async () => apiFetch('/api/mantenimiento/solo-corporativo', { method: 'POST' }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['unidades'] });
      queryClient.invalidateQueries({ queryKey: ['departamentos'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      setModalRestablecerCorpAbierto(false);
      setMensajeExito(data?.mensaje || 'Base de datos restablecida a solo Corporativo GA.');
      setTimeout(() => setMensajeExito(null), 5000);
    },
    onError: (err: any) => setErrorMsg(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Administración de Usuarios, Roles y Alcance GA
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Modelo corporativo homologado con control de permisos en base de datos y alcance por Unidad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tabActiva === 'usuarios' && tienePermiso('usuarios.crear') && (
            <button
              onClick={abrirNuevoUsuario}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Usuario Corporativo
            </button>
          )}

          {tabActiva === 'unidades' && (
            <>
              {esAdmin && (
                <button
                  onClick={() => setModalRestablecerCorpAbierto(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                  title="Eliminar datos operativos, departamentos y dejar únicamente Corporativo GA"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                  Dejar Solo Corporativo GA
                </button>
              )}
              {puedeGestionarUnidades && (
                <button
                  onClick={abrirNuevaUnidad}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Unidad de Negocio
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
          {mensajeExito}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Pestañas de navegación del módulo */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'usuarios', label: 'Directorio de Usuarios', icon: UserPlus },
          { id: 'roles', label: 'Roles y Matriz de Permisos', icon: Shield },
          { id: 'unidades', label: 'Unidades y Departamentos', icon: Building2 },
          { id: 'accesos', label: 'Historial de Accesos', icon: History },
          { id: 'auditoria', label: 'Bitácora de Auditoría', icon: FileSearch },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTabActiva(t.id as any);
                if (t.id === 'roles' && !rolSeleccionado && roles.length > 0) {
                  setRolSeleccionado(roles[0]);
                  setPermisosSeleccionados(roles[0].permisosCodigos);
                }
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                tabActiva === t.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DIRECTORIO DE USUARIOS */}
      {tabActiva === 'usuarios' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, usuario o correo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
            <span className="text-xs text-slate-400">{usuarios.length} usuarios en alcance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50/50 dark:bg-slate-800/30">
                  <th className="py-3 px-4">Usuario / Correo</th>
                  <th className="py-3 px-4">Departamento</th>
                  <th className="py-3 px-4">Roles Asignados</th>
                  <th className="py-3 px-4">Alcance Unidades</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cargandoUsuarios ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      Cargando directorio de usuarios...
                    </td>
                  </tr>
                ) : (
                  usuarios.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {u.nombreCompleto}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span>@{u.nombreUsuario}</span>
                          <span>·</span>
                          <span>{u.email}</span>
                          {u.telefono && (
                            <>
                              <span>·</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium">📞 {u.telefono}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{u.departamentoNombre || 'Sin departamento'}</div>
                        <div className="text-[11px] text-slate-400">{u.cargo}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium"
                            >
                              {r.nombre}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.accesoGlobalUnidades ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                            🌐 Acceso Global
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.unidades.map((un) => (
                              <span
                                key={un.id}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              >
                                {un.codigo}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold ${
                            u.activo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {u.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {tienePermiso('usuarios.editar') && (
                          <>
                            <button
                              onClick={() => abrirEdicionUsuario(u)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => abrirRestablecimientoPassword(u)}
                              title="Restablecer contraseña y revocar tokens"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 text-amber-600 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5 inline" />
                            </button>
                          </>
                        )}
                        {tienePermiso('usuarios.desactivar') && u.id !== usuarioActual?.id && (
                          <button
                            onClick={() =>
                              cambiarEstadoMutation.mutate({ id: u.id, activo: !u.activo })
                            }
                            title={u.activo ? 'Desactivar usuario' : 'Reactivar usuario'}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 text-red-600 cursor-pointer"
                          >
                            <Power className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                        {tienePermiso('usuarios.eliminar') && u.id !== usuarioActual?.id && (
                          <button
                            onClick={() => {
                              setUsuarioAEliminar(u);
                              setModalEliminarUsuario(true);
                            }}
                            title="Eliminar o dar de baja definitiva al usuario"
                            className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ VISUAL DE ROLES Y PERMISOS */}
      {tabActiva === 'roles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-2.5">
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRolSeleccionado(r);
                  setPermisosSeleccionados(r.permisosCodigos);
                }}
                className={`w-full p-4 rounded-2xl border text-left transition cursor-pointer ${
                  rolSeleccionado?.id === r.id
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{r.nombre}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                    {r.permisosCodigos.length} permisos
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{r.descripcion}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            {rolSeleccionado ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-base">
                      Permisos configurables: {rolSeleccionado.nombre}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Los cambios se persisten en SQL Server y se validan en cada endpoint del backend.
                    </p>
                  </div>
                  {tienePermiso('roles.gestionar') && (
                    <button
                      onClick={() => guardarPermisosRolMutation.mutate()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Guardar Matriz de Permisos
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(permisosPorModulo).map(([modulo, lista]) => (
                    <div
                      key={modulo}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Módulo: {modulo}
                      </div>
                      {lista.map((p) => {
                        const activo = permisosSeleccionados.includes(p.codigo);
                        return (
                          <label
                            key={p.id}
                            className="flex items-start gap-2.5 text-xs cursor-pointer py-1"
                          >
                            <input
                              type="checkbox"
                              checked={activo}
                              onChange={() =>
                                toggleItemArray(
                                  permisosSeleccionados,
                                  p.codigo,
                                  setPermisosSeleccionados
                                )
                              }
                              className="mt-0.5 rounded border-slate-300"
                            />
                            <div>
                              <div className="font-semibold">{p.nombre}</div>
                              <div className="text-[11px] text-slate-400">{p.codigo}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">Seleccione un rol para gestionar sus permisos.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: UNIDADES Y DEPARTAMENTOS */}
      {tabActiva === 'unidades' && (
        <div className="space-y-4">
          {unidades.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold">No hay unidades de negocio registradas</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Haga clic en &quot;Nueva Unidad de Negocio&quot; para registrar las sedes, plantas o centros de operaciones corporativos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unidades.map((u) => (
                <div
                  key={u.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600">{u.codigo}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            u.activa
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {u.activa ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{u.nombre}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {u.zonaHoraria}
                      </span>
                      {puedeGestionarUnidades && (
                        <button
                          onClick={() => abrirEditarUnidad(u)}
                          title="Editar unidad de negocio"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {puedeEliminarUnidades && (
                        <button
                          onClick={() => {
                            setUnidadAEliminar(u);
                            setModalEliminarUnidadAbierto(true);
                          }}
                          title="Eliminar unidad de negocio"
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {u.descripcion || 'Sin descripción detallada.'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Departamentos ({u.departamentos.length}):</span>
                      {puedeGestionarUnidades && (
                        <button
                          onClick={() => abrirNuevoDepartamento(u.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Agregar depto
                        </button>
                      )}
                    </div>

                    {u.departamentos.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">No hay departamentos en esta unidad.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.departamentos.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium group text-slate-800 dark:text-slate-200"
                          >
                            <span>{d.codigo} · {d.nombre}</span>
                            {puedeGestionarUnidades && (
                              <div className="flex items-center gap-1 ml-1">
                                <button
                                  onClick={() => abrirEditarDepartamento(d)}
                                  title="Editar departamento"
                                  className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setDeptoAEliminar(d);
                                    setModalEliminarDeptoAbierto(true);
                                  }}
                                  title="Eliminar departamento"
                                  className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORIAL DE ACCESOS */}
      {tabActiva === 'accesos' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3 px-4">Fecha UTC</th>
                <th className="py-3 px-4">Identificador</th>
                <th className="py-3 px-4">Resultado</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Dirección IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accesos.map((a) => (
                <tr key={a.id}>
                  <td className="py-2.5 px-4">{new Date(a.fechaIntentoUtc).toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-semibold">{a.identificadorIntentado}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        a.exitoso
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {a.exitoso ? 'Exitoso' : 'Fallido'}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">{a.motivo}</td>
                  <td className="py-2.5 px-4 text-slate-400">{a.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: BITÁCORA DE AUDITORÍA */}
      {tabActiva === 'auditoria' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-3 px-4">Fecha UTC</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Módulo / Acción</th>
                <th className="py-3 px-4">Resumen de Operación</th>
                <th className="py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditoria.map((ev) => (
                <tr key={ev.id}>
                  <td className="py-2.5 px-4">{new Date(ev.fechaEventoUtc).toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-semibold">{ev.nombreUsuario || 'Sistema'}</td>
                  <td className="py-2.5 px-4">
                    <span className="font-semibold text-blue-600">{ev.modulo}</span> · {ev.accion}
                  </td>
                  <td className="py-2.5 px-4">{ev.resumen}</td>
                  <td className="py-2.5 px-4 text-slate-400">{ev.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: RESTABLECIMIENTO MANUAL DE CONTRASEÑA */}
      {usuarioPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="titulo-reset-password" className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 id="titulo-reset-password" className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-amber-600" /> Restablecer contraseña
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Usuario: <strong>{usuarioPassword.nombreCompleto} ({usuarioPassword.nombreUsuario})</strong>
            </p>
            <div className="space-y-1">
              <label htmlFor="password-admin-nueva" className="text-xs font-semibold">Nueva contraseña</label>
              <input id="password-admin-nueva" type={mostrarPasswordAdmin ? 'text' : 'password'} autoComplete="new-password"
                value={nuevoPasswordAdmin} onChange={(e) => setNuevoPasswordAdmin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" />
              <p className="text-xs text-slate-500">Mínimo 12 caracteres. Utiliza una contraseña única.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="password-admin-confirmacion" className="text-xs font-semibold">Confirmar contraseña</label>
              <input id="password-admin-confirmacion" type={mostrarPasswordAdmin ? 'text' : 'password'} autoComplete="new-password"
                value={confirmacionPasswordAdmin} onChange={(e) => setConfirmacionPasswordAdmin(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" />
              {confirmacionPasswordAdmin && nuevoPasswordAdmin !== confirmacionPasswordAdmin && (
                <p className="text-xs text-red-600">Las contraseñas no coinciden.</p>
              )}
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={mostrarPasswordAdmin} onChange={(e) => setMostrarPasswordAdmin(e.target.checked)} />
              Mostrar contraseña temporalmente
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={debeCambiarPasswordAdmin} onChange={(e) => setDebeCambiarPasswordAdmin(e.target.checked)} />
              Solicitar cambio de contraseña al iniciar sesión
            </label>
            {resetPasswordMutation.isError && (
              <p role="alert" className="text-xs text-red-600">{resetPasswordMutation.error?.message || 'No se pudo actualizar la contraseña.'}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={resetPasswordMutation.isPending}
                onClick={() => { setUsuarioPassword(null); setNuevoPasswordAdmin(''); setConfirmacionPasswordAdmin(''); }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-700">Cancelar</button>
              <button type="button" disabled={resetPasswordMutation.isPending || nuevoPasswordAdmin.length < 12 || nuevoPasswordAdmin !== confirmacionPasswordAdmin}
                onClick={() => resetPasswordMutation.mutate({ id: usuarioPassword.id, nuevoPassword: nuevoPasswordAdmin, debeCambiarPassword: debeCambiarPasswordAdmin })}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {resetPasswordMutation.isPending ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA / EDICIÓN DE USUARIO */}
      {modalUsuarioAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">
              {usuarioEditando ? `Editar Usuario: ${usuarioEditando.nombreUsuario}` : 'Alta de Usuario Corporativo'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {!usuarioEditando && (
                <div>
                  <label className="block font-semibold mb-1">Nombre de Usuario</label>
                  <input
                    value={nombreUsuario}
                    onChange={(e) => setNombreUsuario(e.target.value)}
                    placeholder="ej. juan.perez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
              )}
              <div>
                <label className="block font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@corporativoga.mx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Nombre Completo</label>
                <input
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Cargo / Puesto</label>
                <input
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Teléfono Móvil / WhatsApp *</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="ej. +52 55 1234 5678 o 5512345678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
                <span className="text-[10px] text-slate-400">Obligatorio (mínimo 10 dígitos). Permite inicio de sesión y no puede repetirse.</span>
              </div>
              <div>
                <label className="block font-semibold mb-1">Departamento</label>
                <select
                  value={departamentoId ?? ''}
                  onChange={(e) => setDepartamentoId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">Sin departamento</option>
                  {departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.unidadNombre} · {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {!usuarioEditando && (
                <div>
                  <label className="block font-semibold mb-1">Contraseña Inicial (mínimo 12 caracteres)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold">Asignación de Roles:</div>
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleItemArray(rolesIds, r.id, setRolesIds)}
                    className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 cursor-pointer ${
                      rolesIds.includes(r.id)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {rolesIds.includes(r.id) && <Check className="w-3.5 h-3.5" />}
                    {r.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Unidades de Negocio Autorizadas:</span>
                {usuarioActual?.accesoGlobalUnidades && (
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accesoGlobal}
                      onChange={(e) => setAccesoGlobal(e.target.checked)}
                    />
                    <span>Otorgar Acceso Global a todas las unidades</span>
                  </label>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {unidades.map((un) => (
                  <button
                    key={un.id}
                    type="button"
                    onClick={() => toggleItemArray(unidadesIds, un.id, setUnidadesIds)}
                    className={`px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 cursor-pointer ${
                      unidadesIds.includes(un.id)
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {unidadesIds.includes(un.id) && <Check className="w-3.5 h-3.5" />}
                    {un.codigo} · {un.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="font-semibold">Equipos de Trabajo:</div>
              <div className="flex flex-wrap gap-2">
                {equipos.map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => toggleItemArray(equiposIds, eq.id, setEquiposIds)}
                    className={`px-3 py-1.5 rounded-xl border font-medium cursor-pointer ${
                      equiposIds.includes(eq.id)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {eq.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => guardarUsuarioMutation.mutate()}
                disabled={guardarUsuarioMutation.isPending || (!usuarioEditando && password.length < 12)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
              >
                Guardar Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE USUARIO */}
      {modalEliminarUsuario && usuarioAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar cuenta de usuario?
              </h3>
              <p className="text-slate-500 mt-1">
                Está a punto de procesar la eliminación de{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {usuarioAEliminar.nombreCompleto} ({usuarioAEliminar.nombreUsuario})
                </strong>
                .
              </p>
              <p className="text-slate-400 mt-2">
                Si el usuario cuenta con actividades creadas, tickets asignados o registros en bitácora, el sistema aplicará una <strong>baja lógica definitiva</strong> revocando todas sus sesiones activas para proteger la integridad histórica. Si no tiene historial, se eliminará por completo.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalEliminarUsuario(false);
                  setUsuarioAEliminar(null);
                }}
                disabled={eliminarUsuarioMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarUsuarioMutation.mutate(usuarioAEliminar.id)}
                disabled={eliminarUsuarioMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5"
              >
                {eliminarUsuarioMutation.isPending ? 'Procesando...' : 'Confirmar baja / eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR UNIDAD */}
      {modalUnidadAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {unidadEnEdicion ? 'Editar Unidad de Negocio' : 'Registrar Unidad de Negocio'}
            </h3>

            {guardarUnidadMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guardarUnidadMutation.error?.message || 'Error al guardar la unidad'}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Código</label>
                  <input
                    value={codigoUnidad}
                    disabled={!!unidadEnEdicion}
                    onChange={(e) => setCodigoUnidad(e.target.value)}
                    placeholder="UN-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Zona Horaria</label>
                  <input
                    value={zonaHorariaUnidad}
                    onChange={(e) => setZonaHorariaUnidad(e.target.value)}
                    placeholder="America/Mexico_City"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre de la Unidad</label>
                <input
                  value={nombreUnidad}
                  onChange={(e) => setNombreUnidad(e.target.value)}
                  placeholder="Ej. Sede Corporativa Reforma"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción</label>
                <textarea
                  value={descripcionUnidad}
                  onChange={(e) => setDescripcionUnidad(e.target.value)}
                  rows={2}
                  placeholder="Ubicación o alcance de la unidad de negocio"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={activaUnidad}
                  onChange={(e) => setActivaUnidad(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="font-semibold">Unidad activa para operaciones</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalUnidadAbierto(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardarUnidadMutation.isPending || !nombreUnidad.trim() || !codigoUnidad.trim()}
                onClick={() => guardarUnidadMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {guardarUnidadMutation.isPending ? 'Guardando...' : unidadEnEdicion ? 'Actualizar Unidad' : 'Guardar Unidad'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE UNIDAD */}
      {modalEliminarUnidadAbierto && unidadAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar unidad de negocio?
              </h3>
              <p className="text-slate-500 mt-1">
                Está a punto de eliminar la unidad{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {unidadAEliminar.codigo}: {unidadAEliminar.nombre}
                </strong>
                .
              </p>
              <p className="text-slate-400 mt-2">
                Se desvincularán los usuarios asignados a esta unidad y sus {unidadAEliminar.departamentos.length} departamentos.
                El sistema verificará que no existan proyectos, actividades o tickets activos antes de procesar el borrado.
              </p>
            </div>

            {eliminarUnidadMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eliminarUnidadMutation.error?.message || 'Error al eliminar la unidad'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalEliminarUnidadAbierto(false);
                  setUnidadAEliminar(null);
                }}
                disabled={eliminarUnidadMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarUnidadMutation.mutate(unidadAEliminar.id)}
                disabled={eliminarUnidadMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {eliminarUnidadMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR DEPARTAMENTO */}
      {modalDeptoAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 text-xs shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {deptoEnEdicion ? 'Editar Departamento' : 'Registrar Departamento'}
            </h3>

            {guardarDeptoMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guardarDeptoMutation.error?.message || 'Error al guardar departamento'}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Unidad de Negocio</label>
                <select
                  value={deptoUnidadId}
                  disabled={!!deptoEnEdicion}
                  onChange={(e) => setDeptoUnidadId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.codigo} · {u.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Código</label>
                  <input
                    value={codigoDepto}
                    onChange={(e) => setCodigoDepto(e.target.value)}
                    placeholder="DEP-TI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nombre</label>
                  <input
                    value={nombreDepto}
                    onChange={(e) => setNombreDepto(e.target.value)}
                    placeholder="Tecnología"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción</label>
                <textarea
                  value={descripcionDepto}
                  onChange={(e) => setDescripcionDepto(e.target.value)}
                  rows={2}
                  placeholder="Funciones o alcance del departamento"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-transparent"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={activaDepto}
                  onChange={(e) => setActivaDepto(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="font-semibold">Departamento activo</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalDeptoAbierto(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardarDeptoMutation.isPending || !nombreDepto.trim() || !codigoDepto.trim()}
                onClick={() => guardarDeptoMutation.mutate()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {guardarDeptoMutation.isPending ? 'Guardando...' : deptoEnEdicion ? 'Actualizar Depto' : 'Guardar Depto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINACIÓN DE DEPARTAMENTO */}
      {modalEliminarDeptoAbierto && deptoAEliminar && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                ¿Eliminar departamento?
              </h3>
              <p className="text-slate-500 mt-1">
                Está a punto de eliminar el departamento{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {deptoAEliminar.codigo}: {deptoAEliminar.nombre}
                </strong>
                .
              </p>
              <p className="text-slate-400 mt-2">
                Los usuarios que pertenecían a este departamento quedarán sin departamento asignado.
                Si existen tickets, proyectos o equipos vinculados a este departamento, el sistema impedirá su eliminación.
              </p>
            </div>

            {eliminarDeptoMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{eliminarDeptoMutation.error?.message || 'Error al eliminar el departamento'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalEliminarDeptoAbierto(false);
                  setDeptoAEliminar(null);
                }}
                disabled={eliminarDeptoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => eliminarDeptoMutation.mutate(deptoAEliminar.id)}
                disabled={eliminarDeptoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {eliminarDeptoMutation.isPending ? 'Eliminando...' : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: RESTABLECER A SOLO CORPORATIVO GA */}
      {modalRestablecerCorpAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Restablecer a Solo Corporativo GA
                </h3>
                <p className="text-xs text-slate-500">
                  Acción administrativa de limpieza organizativa
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Esta acción ejecutará las siguientes tareas de forma atómica:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                <li>Eliminará todos los <strong>datos operativos</strong> (Equipos, Proyectos, Actividades, Tickets y Grupos de WhatsApp).</li>
                <li>Eliminará todos los <strong>departamentos</strong> existentes.</li>
                <li>Eliminará todas las <strong>unidades secundarias</strong> y dejará únicamente <strong>Corporativo GA</strong>.</li>
                <li><strong className="text-emerald-600 dark:text-emerald-400">CONSERVARÁ todos los usuarios</strong>, sus contraseñas, roles y accesos, reasignándolos a Corporativo GA.</li>
              </ul>
            </div>

            {restablecerCorporativoMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{restablecerCorporativoMutation.error?.message || 'Error al restablecer la organización'}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setModalRestablecerCorpAbierto(false)}
                disabled={restablecerCorporativoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => restablecerCorporativoMutation.mutate()}
                disabled={restablecerCorporativoMutation.isPending}
                className="px-4 py-2 rounded-xl font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {restablecerCorporativoMutation.isPending ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    Procesando limpieza...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Confirmar y Restablecer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
