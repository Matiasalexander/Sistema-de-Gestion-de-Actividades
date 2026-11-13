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
  const [password, setPassword] = useState('UsuarioGA2026!');
  const [departamentoId, setDepartamentoId] = useState<number | undefined>(undefined);
  const [accesoGlobal, setAccesoGlobal] = useState(false);
  const [rolesIds, setRolesIds] = useState<number[]>([]);
  const [unidadesIds, setUnidadesIds] = useState<number[]>([]);
  const [equiposIds, setEquiposIds] = useState<number[]>([]);

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
    setPassword('UsuarioGA2026!');
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
    mutationFn: async (id: number) =>
      apiFetch(`/api/usuarios/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ nuevoPassword: 'AdminGA2026!', debeCambiarPassword: true }),
      }),
    onSuccess: () => {
      setMensajeExito('Contraseña restablecida a AdminGA2026! y sesiones previas revocadas.');
      setTimeout(() => setMensajeExito(null), 4000);
    },
  });

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

        {tienePermiso('usuarios.crear') && (
          <button
            onClick={abrirNuevoUsuario}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario Corporativo
          </button>
        )}
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
                        <div className="text-[11px] text-slate-500">
                          @{u.nombreUsuario} · {u.email}
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
                              onClick={() => resetPasswordMutation.mutate(u.id)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unidades.map((u) => (
            <div
              key={u.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600">{u.codigo}</span>
                  <h3 className="text-base font-bold">{u.nombre}</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
                  {u.zonaHoraria}
                </span>
              </div>
              <p className="text-xs text-slate-500">{u.descripcion}</p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-semibold mb-2">
                  Departamentos ({u.departamentos.length}):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {u.departamentos.map((d) => (
                    <span
                      key={d.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium"
                    >
                      {d.codigo} · {d.nombre}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
                  <label className="block font-semibold mb-1">Contraseña Inicial</label>
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
    </div>
  );
};
