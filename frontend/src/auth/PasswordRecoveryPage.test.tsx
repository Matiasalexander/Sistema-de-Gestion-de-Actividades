import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PasswordRecoveryPage } from './PasswordRecoveryPage';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  apiFetch: vi.fn(),
}));

describe('PasswordRecoveryPage - Vista inteligente de recuperación de contraseña', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renderiza en modo solicitud cuando no se proporciona token en la URL', () => {
    render(
      <MemoryRouter initialEntries={['/recuperar-password']}>
        <PasswordRecoveryPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Recuperar Acceso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Corporativo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar instrucciones/i })).toBeInTheDocument();
    expect(screen.getByText(/Volver al inicio de sesión/i)).toBeInTheDocument();
  });

  it('Envía solicitud de recuperación y muestra pantalla de instrucciones enviadas', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({ mensaje: 'Instrucciones enviadas' });

    render(
      <MemoryRouter initialEntries={['/recuperar-password']}>
        <PasswordRecoveryPage />
      </MemoryRouter>
    );

    const inputEmail = screen.getByLabelText(/Correo Corporativo/i);
    fireEvent.change(inputEmail, { target: { value: 'matias.arceo@grupoandersons.com' } });

    const submitBtn = screen.getByRole('button', { name: /Enviar instrucciones/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Instrucciones enviadas/i)).toBeInTheDocument();
    });

    expect(api.apiFetch).toHaveBeenCalledWith('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'matias.arceo@grupoandersons.com' }),
    });
  });

  it('Renderiza en modo restablecimiento cuando detecta un token en la query string', () => {
    render(
      <MemoryRouter initialEntries={['/recuperar-password?token=token-seguro-123']}>
        <PasswordRecoveryPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Nueva Contraseña/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nueva Contraseña$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmar Contraseña$/i)).toBeInTheDocument();
    expect(screen.getByText(/Mínimo 12 caracteres requeridos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar nueva contraseña/i })).toBeDisabled();
  });

  it('Renderiza en modo restablecimiento cuando detecta un token en el fragmento hash', () => {
    render(
      <MemoryRouter initialEntries={['/#reset-password?token=hash-token-456']}>
        <PasswordRecoveryPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Nueva Contraseña/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nueva Contraseña$/i)).toBeInTheDocument();
  });

  it('Habilita el botón de guardado y permite restablecer cuando cumple requisitos (>=12 caracteres y coincidencia)', async () => {
    vi.mocked(api.apiFetch).mockResolvedValueOnce({ mensaje: 'Contraseña actualizada' });

    render(
      <MemoryRouter initialEntries={['/recuperar-password?token=token-prueba-valido']}>
        <PasswordRecoveryPage />
      </MemoryRouter>
    );

    const inputNew = screen.getByLabelText(/^Nueva Contraseña$/i);
    const inputConfirm = screen.getByLabelText(/^Confirmar Contraseña$/i);

    fireEvent.change(inputNew, { target: { value: 'ContrasenaSegura2026!' } });
    fireEvent.change(inputConfirm, { target: { value: 'ContrasenaSegura2026!' } });

    const submitBtn = screen.getByRole('button', { name: /Guardar nueva contraseña/i });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/¡Contraseña actualizada!/i)).toBeInTheDocument();
    });

    expect(api.apiFetch).toHaveBeenCalledWith('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token: 'token-prueba-valido',
        nuevoPassword: 'ContrasenaSegura2026!',
      }),
    });
  });
});
