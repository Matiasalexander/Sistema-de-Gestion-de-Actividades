import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from './App';
import { StatusBadge } from '../components/StatusBadge';

describe('Sistema de Gestión GA - Pruebas de Componentes y Seguridad UI', () => {
  it('Renderiza la pantalla de Login corporativo cuando no existe sesión activa', () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByText(/Sistema de Gestión GA/i)).toBeInTheDocument();
    expect(screen.getByText(/Plataforma Corporativa/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Acceder a la Plataforma/i })).toBeInTheDocument();
    expect(screen.getByText(/¿Olvidaste tu contraseña\?/i)).toBeInTheDocument();
  });

  it('Permite navegar a la pantalla de recuperación de contraseña', () => {
    localStorage.clear();
    render(<App />);
    const linkOlvido = screen.getByText(/¿Olvidaste tu contraseña\?/i);
    expect(linkOlvido).toBeInTheDocument();
    expect(linkOlvido.getAttribute('href')).toBe('/recuperar-password');
  });

  it('Renderiza correctamente el componente reutilizable StatusBadge con prioridad o estado', () => {
    render(<StatusBadge label="En progreso" colorHex="#F59E0B" />);
    expect(screen.getByText('En progreso')).toBeInTheDocument();
  });
});
