import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { LoginPage } from '../auth/LoginPage';
import { PasswordRecoveryPage } from '../auth/PasswordRecoveryPage';
import { MainLayout } from '../layouts/MainLayout';
import { DashboardPage } from '../modules/dashboard/DashboardPage';
import { ProyectosPage } from '../modules/proyectos/ProyectosPage';
import { ActividadesPage } from '../modules/actividades/ActividadesPage';
import { TablerosPage } from '../modules/tableros/TablerosPage';
import { TicketsPage } from '../modules/tickets/TicketsPage';
import { EquiposPage } from '../modules/equipos/EquiposPage';
import { UsuariosPage } from '../modules/usuarios/UsuariosPage';
import { ReportesPage } from '../modules/reportes/ReportesPage';
import { ConfiguracionPage } from '../modules/configuracion/ConfiguracionPage';
import { ChatPage } from '../modules/chat/ChatPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoutes: React.FC = () => {
  const { usuario, cargando, tienePermiso } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
        Inicializando sesión corporativa GA...
      </div>
    );
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/recuperar-password" element={<PasswordRecoveryPage />} />
        <Route path="/restablecer-password" element={<PasswordRecoveryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/recuperar-password" element={<PasswordRecoveryPage />} />
      <Route path="/restablecer-password" element={<PasswordRecoveryPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route
          path="/proyectos"
          element={tienePermiso('proyectos.ver') ? <ProyectosPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/actividades"
          element={
            tienePermiso('actividades.ver') ? <ActividadesPage /> : <Navigate to="/" replace />
          }
        />
        <Route path="/chat" element={<ChatPage />} />
        <Route
          path="/tableros"
          element={tienePermiso('actividades.ver') ? <TablerosPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/tickets"
          element={tienePermiso('tickets.ver') ? <TicketsPage /> : <Navigate to="/" replace />}
        />
        <Route path="/equipos" element={<EquiposPage />} />
        <Route
          path="/usuarios"
          element={tienePermiso('usuarios.ver') ? <UsuariosPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/reportes"
          element={tienePermiso('reportes.ver') ? <ReportesPage /> : <Navigate to="/" replace />}
        />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
