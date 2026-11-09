import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';
import { StatusBadge } from '../components/StatusBadge';

describe('Sistema de Gestión GA - Pruebas de Componentes y Seguridad UI', () => {
  it('Renderiza la pantalla de Login corporativo cuando no existe sesión activa', () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByText(/Sistema de Gestión GA/i)).toBeInTheDocument();
    expect(screen.getByText(/Iniciar sesión corporativa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acceder a la Plataforma/i })).toBeInTheDocument();
  });

  it('Autocompleta credenciales de validación al seleccionar un perfil preconfigurado', () => {
    localStorage.clear();
    render(<App />);
    const btnAdmin = screen.getByText(/Director TI \(Alcance Global\)/i);
    fireEvent.click(btnAdmin);

    const inputUsuario = screen.getByLabelText(/Usuario o correo electrónico/i) as HTMLInputElement;
    expect(inputUsuario.value).toBe('admin');
  });

  it('Renderiza correctamente el componente reutilizable StatusBadge con prioridad o estado', () => {
    render(<StatusBadge label="En progreso" colorHex="#F59E0B" />);
    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });
});
