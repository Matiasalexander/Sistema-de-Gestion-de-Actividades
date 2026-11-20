// ==========================================
// INTERFACES DE MODELO Y AUTENTICACIÓN
// ==========================================

export interface UnidadResumen {
  id: number;
  codigo: string;
  nombre: string;
  esPrincipal: boolean;
}

export interface UsuarioAutenticado {
  id: number;
  nombreUsuario: string;
  email: string;
  nombreCompleto: string;
  cargo?: string;
  departamentoId?: number;
  departamentoNombre?: string;
  accesoGlobalUnidades: boolean;
  unidades: UnidadResumen[];
  roles: string[];
  permisos: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiraEnUtc: string;
  usuario: UsuarioAutenticado;
}

export interface CatalogoItem {
  id: number;
  codigo: string;
  nombre: string;
  colorHex: string;
  orden: number;
  esFinal: boolean;
  pausaSla: boolean;
}

export interface CatalogosOperativos {
  prioridades: CatalogoItem[];
  estadosProyecto: CatalogoItem[];
  estadosActividad: CatalogoItem[];
  estadosTicket: CatalogoItem[];
  tiposTicket: CatalogoItem[];
  categoriasTicket: CatalogoItem[];
}

export interface PermisoItem {
  id: number;
  codigo: string;
  modulo: string;
  accion: string;
  nombre: string;
  descripcion?: string;
}

export interface RolItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  esSistema: boolean;
  activo: boolean;
  totalUsuarios: number;
  permisosCodigos: string[];
}

export interface DepartamentoItem {
  id: number;
  unidadId: number;
  unidadNombre: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface UnidadItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  zonaHoraria: string;
  activa: boolean;
  totalDepartamentos: number;
  totalUsuarios: number;
  departamentos: DepartamentoItem[];
}

export interface EquipoIntegrante {
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rolEnEquipo: string;
}

export interface EquipoItem {
  id: number;
  codigo: string;
  unidadId: number;
  unidadNombre: string;
  departamentoId?: number;
  departamentoNombre?: string;
  nombre: string;
  descripcion?: string;
  colorHex: string;
  liderUsuarioId?: number;
  liderNombre?: string;
  activo: boolean;
  integrantes: EquipoIntegrante[];
}

export interface UsuarioLista {
  id: number;
  nombreUsuario: string;
  email: string;
  nombreCompleto: string;
  cargo?: string;
  telefono?: string;
  departamentoId?: number;
  departamentoNombre?: string;
  accesoGlobalUnidades: boolean;
  activo: boolean;
  ultimoAccesoUtc?: string;
  fechaCreacionUtc: string;
  roles: { id: number; codigo: string; nombre: string }[];
  unidades: UnidadResumen[];
  equipos: string[];
}

export interface ProyectoFase {
  id: number;
  proyectoId: number;
  nombre: string;
  descripcion?: string;
  orden: number;
  esHito: boolean;
  fechaInicio?: string;
  fechaFinEstimada?: string;
  completada: boolean;
  porcentajeAvance: number;
}

export interface ProyectoItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  unidadId: number;
  unidadNombre: string;
  departamentoId?: number;
  departamentoNombre?: string;
  equipoId?: number;
  equipoNombre?: string;
  responsableId: number;
  responsableNombre: string;
  prioridadId: number;
  prioridadNombre: string;
  prioridadColor: string;
  EstadoProyectoId?: number;
  estadoProyectoId: number;
  estadoCodigo: string;
  estadoNombre: string;
  estadoColor: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFinReal?: string;
  porcentajeAvance: number;
  archivado: boolean;
  totalActividades: number;
  actividadesCompletadas: number;
  fechaCreacionUtc: string;
  fases: ProyectoFase[];
  integrantes: EquipoIntegrante[];
}

export interface ChecklistItem {
  id: number;
  actividadId: number;
  titulo: string;
  orden: number;
  completado: boolean;
  fechaCompletadoUtc?: string;
}

export interface DependenciaActividad {
  id: number;
  actividadId: number;
  actividadPredecesoraId: number;
  predecesoraCodigo: string;
  predecesoraTitulo: string;
  predecesoraEstado: string;
  tipoDependencia: string;
}

export interface TiempoActividad {
  id: number;
  actividadId: number;
  usuarioId: number;
  usuarioNombre: string;
  minutosTrabajados: number;
  fechaTrabajo: string;
  descripcion?: string;
  fechaRegistroUtc: string;
}

export interface ActividadHistorial {
  id: number;
  actividadId: number;
  usuarioNombre?: string;
  tipoCambio: string;
  valorAnterior?: string;
  valorNuevo?: string;
  detalle?: string;
  fechaCambioUtc: string;
}

export interface ActividadItem {
  id: number;
  codigo: string;
  proyectoId?: number;
  proyectoCodigo?: string;
  proyectoNombre?: string;
  faseProyectoId?: number;
  faseNombre?: string;
  actividadPadreId?: number;
  unidadId: number;
  unidadNombre: string;
  departamentoId?: number;
  departamentoNombre?: string;
  equipoId?: number;
  equipoNombre?: string;
  titulo: string;
  descripcion?: string;
  prioridadId: number;
  prioridadCodigo: string;
  prioridadNombre: string;
  prioridadColor: string;
  estadoActividadId: number;
  estadoCodigo: string;
  estadoNombre: string;
  estadoColor: string;
  fechaInicio?: string;
  fechaVencimiento?: string;
  fechaFinalizacionRealUtc?: string;
  tiempoEstimadoMinutos: number;
  tiempoTrabajadoMinutos: number;
  porcentajeAvance: number;
  esRecurrente: boolean;
  patronRecurrencia?: string;
  archivada: boolean;
  estaVencida: boolean;
  totalSubtareas: number;
  subtareasCompletadas: number;
  totalChecklist: number;
  checklistCompletados: number;
  fechaCreacionUtc: string;
  asignados: { usuarioId: number; nombreCompleto: string; email: string; esPrincipal: boolean }[];
  checklists: ChecklistItem[];
  dependencias: DependenciaActividad[];
  tiempos: TiempoActividad[];
  historial: ActividadHistorial[];
  ticketsVinculadosFolios: string[];
  chatGrupoId?: number;
  chatGrupoNombre?: string;
}

export interface ComentarioItem {
  id: number;
  proyectoId?: number;
  actividadId?: number;
  ticketId?: number;
  autorId: number;
  autorNombre: string;
  contenido: string;
  mencionesJson?: string;
  esInterno: boolean;
  fechaCreacionUtc: string;
}

export interface AdjuntoItem {
  id: number;
  proyectoId?: number;
  actividadId?: number;
  ticketId?: number;
  nombreOriginal: string;
  contentType: string;
  tamanoBytes: number;
  esEvidencia: boolean;
  subidoPorId: number;
  subidoPorNombre: string;
  fechaSubidaUtc: string;
}

export interface TicketItem {
  id: number;
  folio: string;
  titulo: string;
  descripcion: string;
  ticketTipoId: number;
  tipoNombre: string;
  ticketCategoriaId: number;
  categoriaNombre: string;
  prioridadId: number;
  prioridadCodigo: string;
  prioridadNombre: string;
  prioridadColor: string;
  estadoTicketId: number;
  estadoCodigo: string;
  estadoNombre: string;
  estadoColor: string;
  solicitanteId: number;
  solicitanteNombre: string;
  responsableId?: number;
  responsableNombre?: string;
  equipoAsignadoId?: number;
  equipoAsignadoNombre?: string;
  unidadId: number;
  unidadNombre: string;
  departamentoId?: number;
  departamentoNombre?: string;
  politicaSlaId?: number;
  politicaSlaNombre?: string;
  fechaCreacionUtc: string;
  fechaPrimeraRespuestaUtc?: string;
  fechaResolucionUtc?: string;
  fechaCierreUtc?: string;
  fechaLimitePrimeraRespuestaUtc?: string;
  fechaLimiteResolucionUtc?: string;
  minutosPausadoSla: number;
  estadoSla: string;
  escalado: boolean;
  actividadesRelacionadas: {
    actividadId: number;
    codigo: string;
    titulo: string;
    estadoNombre: string;
    estadoColor: string;
    porcentajeAvance: number;
  }[];
  historial: {
    id: number;
    ticketId: number;
    usuarioNombre?: string;
    accion: string;
    estadoAnterior?: string;
    estadoNuevo?: string;
    detalle?: string;
    fechaEventoUtc: string;
  }[];
  comentarios: ComentarioItem[];
  adjuntos: AdjuntoItem[];
}

export interface DashboardEjecutivo {
  totalProyectos: number;
  proyectosActivos: number;
  actividadesPendientes: number;
  actividadesEnProgreso: number;
  actividadesCompletadas: number;
  actividadesVencidas: number;
  ticketsAbiertos: number;
  ticketsResueltos: number;
  ticketsVencidosSla: number;
  porcentajeCumplimientoSla: number;
  tiempoPromedioPrimeraRespuestaMin: number;
  tiempoPromedioResolucionMin: number;
  actividadesPorEstado: { etiqueta: string; valor: number; colorHex?: string }[];
  ticketsPorPrioridad: { etiqueta: string; valor: number; colorHex?: string }[];
  ticketsPorCategoria: { etiqueta: string; valor: number; colorHex?: string }[];
  tendenciaMensualTickets: { etiqueta: string; valor: number; colorHex?: string }[];
  distribucionSla: { etiqueta: string; valor: number; colorHex?: string }[];
  avanceProyectos: { etiqueta: string; valor: number; colorHex?: string }[];
  comparativoUnidades: { etiqueta: string; valor: number; colorHex?: string }[];
  productividadResponsables: {
    usuarioId: number;
    nombreCompleto: string;
    cargo?: string;
    unidadNombre: string;
    actividadesActivas: number;
    actividadesCompletadas: number;
    actividadesVencidas: number;
    ticketsAsignados: number;
    minutosEstimados: number;
    minutosTrabajados: number;
    indiceProductividad: number;
  }[];
}

export interface NotificacionItem {
  id: number;
  tipoEvento: string;
  titulo: string;
  mensaje: string;
  urlDestino?: string;
  leida: boolean;
  fechaCreacionUtc: string;
}

export interface PoliticaSlaItem {
  id: number;
  nombre: string;
  prioridadId: number;
  prioridadNombre: string;
  ticketTipoId?: number;
  tipoNombre?: string;
  ticketCategoriaId?: number;
  categoriaNombre?: string;
  unidadId?: number;
  unidadNombre?: string;
  calendarioSlaId?: number;
  calendarioNombre?: string;
  tiempoPrimeraRespuestaMinutos: number;
  tiempoResolucionMinutos: number;
  umbralAlertaPorcentaje: number;
  activa: boolean;
}

export interface ReglaAutomatizacionItem {
  id: number;
  nombre: string;
  descripcion?: string;
  eventoDisparador: string;
  condicionJson: string;
  accionTipo: string;
  accionConfigJson: string;
  activa: boolean;
  totalEjecuciones: number;
  totalFallos: number;
  ultimaEjecucionUtc?: string;
}

export interface AuditoriaEventoItem {
  id: number;
  usuarioId?: number;
  nombreUsuario?: string;
  modulo: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  unidadId?: number;
  resumen?: string;
  valoresAnteriores?: string;
  valoresNuevos?: string;
  ipAddress?: string;
  fechaEventoUtc: string;
}

export interface HistorialAccesoItem {
  id: number;
  usuarioId?: number;
  identificadorIntentado: string;
  exitoso: boolean;
  motivo?: string;
  ipAddress?: string;
  fechaIntentoUtc: string;
}

export interface ChatMiembroItem {
  usuarioId: number;
  nombreCompleto: string;
  nombreUsuario: string;
  email: string;
  cargo?: string;
  esAdmin: boolean;
  fechaUnionUtc: string;
}

export interface ChatGrupoItem {
  id: number;
  nombre: string;
  descripcion?: string;
  unidadId: number;
  unidadNombre: string;
  actividadActivaId?: number;
  actividadActivaCodigo?: string;
  actividadActivaTitulo?: string;
  actividadActivaEstado?: string;
  actividadActivaEstadoColor?: string;
  creadoPorId: number;
  creadoPorNombre: string;
  fechaCreacionUtc: string;
  activo: boolean;
  totalMiembros: number;
  ultimoMensaje?: string;
  ultimoMensajeFechaUtc?: string;
  miembros: ChatMiembroItem[];
}

export interface OpcionInteractiva {
  id: string;
  texto: string;
  accion: string;
  color?: string;
}

export interface ChatMensajeItem {
  id: number;
  chatGrupoId: number;
  usuarioId: number;
  nombreUsuario: string;
  nombreCompleto: string;
  actividadId?: number;
  actividadCodigo?: string;
  texto: string;
  tipoMensaje: string; // 'Texto' | 'Sistema' | 'PreguntaInteractiva' | 'RespuestaInteractiva'
  opcionesInteractivasJson?: string;
  opcionSeleccionada?: string;
  respondidoPorUsuarioId?: number;
  respondidoPorNombre?: string;
  fechaRespuestaUtc?: string;
  fechaCreacionUtc: string;
  esMio: boolean;
}

// ==========================================
// ALMACENAMIENTO DE TOKENS
// ==========================================

const TOKEN_KEY = 'sga_access_token';
const REFRESH_KEY = 'sga_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ==========================================
// RESOLUCIÓN DE URL BASE Y CLIENTE HTTP
// ==========================================

/**
 * Obtiene la URL base de la API asegurando que no termine en '/'
 * Ejemplo en producción: https://sistemagestionga-api-prod-gqcgfbfqadf3gkam.mexicocentral-01.azurewebsites.net
 */
const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';
export const API_BASE_URL = RAW_API_URL.endsWith('/')
  ? RAW_API_URL.slice(0, -1)
  : RAW_API_URL;

/**
 * Construye la URL completa apuntando al backend
 */
function buildFullUrl(path: string): string {
  // Si ya es una URL absoluta (http/https), se respeta
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  reintento = true
): Promise<T> {
  const token = tokenStorage.getAccess();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Se resuelve la URL absoluta hacia la API de Azure
  const targetUrl = buildFullUrl(path);

  const response = await fetch(targetUrl, { ...options, headers });

  // Manejo de expiración de token y refresco automático
  if (
    response.status === 401 &&
    reintento &&
    !path.includes('/api/auth/login') &&
    !path.includes('/api/auth/refresh')
  ) {
    const refreshToken = tokenStorage.getRefresh();
    if (refreshToken) {
      const refreshUrl = buildFullUrl('/api/auth/refresh');
      const refreshResp = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResp.ok) {
        const data: LoginResponse = await refreshResp.json();
        tokenStorage.setTokens(data.accessToken, data.refreshToken);
        return apiFetch<T>(path, options, false);
      } else {
        tokenStorage.clear();
      }
    }
  }

  if (!response.ok) {
    let errorMsg = `Error HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
      else if (errJson.title) errorMsg = errJson.title;
      else if (errJson.message) errorMsg = errJson.message;
    } catch {
      // Ignorar error de parsing si la respuesta no es JSON
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}