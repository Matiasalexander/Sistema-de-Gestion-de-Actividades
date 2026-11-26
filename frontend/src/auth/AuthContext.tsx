import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  apiFetch,
  LoginResponse,
  tokenStorage,
  UsuarioAutenticado,
} from '../services/api';

interface AuthContextValue {
  usuario: UsuarioAutenticado | null;
  cargando: boolean;
  unidadActivaId: number | undefined;
  setUnidadActivaId: (id: number | undefined) => void;
  login: (identificador: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  tienePermiso: (permiso: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [unidadActivaId, setUnidadActivaId] = useState<number | undefined>(undefined);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setCargando(false);
      return;
    }

    apiFetch<UsuarioAutenticado>('/api/auth/me')
      .then((usr) => {
        setUsuario(usr);
        if (!usr.accesoGlobalUnidades && usr.unidades.length > 0) {
          const principal = usr.unidades.find((u) => u.esPrincipal) || usr.unidades[0];
          setUnidadActivaId(principal.id);
        }
      })
      .catch(() => {
        tokenStorage.clear();
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = async (identificador: string, password: string) => {
    const resp = await apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identificador, password }),
    });
    tokenStorage.setTokens(resp.accessToken, resp.refreshToken);
    setUsuario(resp.usuario);
    if (!resp.usuario.accesoGlobalUnidades && resp.usuario.unidades.length > 0) {
      const principal = resp.usuario.unidades.find((u) => u.esPrincipal) || resp.usuario.unidades[0];
      setUnidadActivaId(principal.id);
    } else {
      setUnidadActivaId(undefined);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = tokenStorage.getRefresh();
      if (refreshToken) {
        await apiFetch('/api/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // ignore error on logout
    } finally {
      tokenStorage.clear();
      setUsuario(null);
      setUnidadActivaId(undefined);
    }
  };

  const tienePermiso = (permiso: string): boolean => {
    if (!usuario) return false;
    const esAdmin =
      usuario.roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN' || r.toUpperCase() === 'ADMIN') ||
      usuario.accesoGlobalUnidades;
    if (esAdmin) return true;
    return usuario.permisos.some((p) => p.toLowerCase() === permiso.toLowerCase());
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        unidadActivaId,
        setUnidadActivaId,
        login,
        logout,
        tienePermiso,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
export const esColaboradorSistemas = (usuario: UsuarioAutenticado | null): boolean => {
  if (!usuario) return false;

  // Acceso concedido a Administrador General / Acceso Global
  if (
    usuario.accesoGlobalUnidades ||
    usuario.roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN' || r.toUpperCase() === 'ADMIN')
  ) {
    return true;
  }

  // Validación estricta por DEPARTAMENTO DE SISTEMAS
  const depto = (usuario.departamentoNombre || '').toLowerCase();
  return depto.includes('sistema') || depto.includes('tecnolog') || depto === 'ti';
};
