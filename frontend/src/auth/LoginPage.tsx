import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  ChevronDown, 
  AlertCircle,
  Subtitles
} from 'lucide-react';
import { useAuth } from './AuthContext';
import logo from '../img/gandersons-wlogo.png';

/*PREPARACIÓN DEL CARRUSEL*/
import slide1 from '../img/login-image.jpg';
import slide2 from '../img/login-image2.jpg';
import slide3 from '../img/login-image3.jpg';
  //const del carrusel
const carouselSlides = [
  {
    image: slide1
  },
  {
    image: slide2
  },
  {
    image: slide3
  }
];

import '../styles/LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  //carrousel
  const [currentSlide, setCurrentSlide] = useState(0);
  //intervalo de tiempo 
  useEffect(()=> {
    const timer = setInterval(() => {
      setCurrentSlide((prev)=>(prev+1) % carouselSlides.length);
    }, 5000);
    return()=>clearInterval(timer);
  }, [carouselSlides.length]);
  // Estados del formulario
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [businessUnit, setBusinessUnit] = useState('corp');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
  
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('reset-password')) {
      navigate(`/recuperar-password${window.location.hash}`, { replace: true });
    }
  }, [navigate]);

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
          if (firstErr?.name === 'TypeError' || !firstErr?.response) {
            await (login as any)(userClean, password);
          } else {
            throw firstErr;
          }
        }
      }

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
    <div className="login-split-page">
      
      <div className="login-col-form">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        <div className="login-form-container">

          {/* Cabecera & Logotipo */}
          <div className="login-header">
            <div className="login-logo-container">
              <img className="login-logo" src={logo} alt="Grupo Anderson's Logo" />
            </div>

            <div className="login-header-text">
              <h1 className="login-title">Sistema de Gestión GA</h1>
              <div className="login-title-bar" />
            </div>
          </div>

          {/* Banner de error */}
          {errorMessage && (
            <div className="login-alert">
              <AlertCircle className="login-alert-icon" />
              <span className="login-alert-text">{errorMessage}</span>
            </div>
          )}

          {/* Formulario de Login */}
          <form onSubmit={handleSubmit} className="login-form">
            
            {/* Usuario */}
            <div className="login-field">
              <label htmlFor="identifier" className="login-label">
                Correo electrónico o Usuario:
              </label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <User className="login-icon" />
                </span>
                <input
                  id="identifier"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="usuario@grupoandersons.com"
                  className="login-input"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="login-field">
              <label htmlFor="password" className="login-label">
                Contraseña:
              </label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <Lock className="login-icon" />
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
                  className="login-input login-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="login-eye" color="#3478F3" /> : <Eye className="login-eye" color="#3478F3" />}
                </button>
              </div>
            </div>

            {/* Unidad de Negocio */}
            <div className="login-field">
              <label htmlFor="businessUnit" className="login-label">
                Unidad de Negocio / Sucursal:
              </label>
              <div className="login-input-group">
                <span className="login-input-icon">
                  <Building2 className="login-icon" />
                </span>
                <select
                  id="businessUnit"
                  value={businessUnit}
                  onChange={(e) => setBusinessUnit(e.target.value)}
                  className="login-select"
                >
                  <option value="corp" className="login-select-option">Grupo Anderson's Corporativo</option>
                  <option value="frogs" className="login-select-option">Señor Frog's</option>
                  <option value="harrys" className="login-select-option">Harry's Steakhouse</option>
                  <option value="charlies" className="login-select-option">Carlos'n Charlie's</option>
                </select>
                <span className="login-select-chevron">
                  <ChevronDown className="login-icon" />
                </span>
              </div>
            </div>

            {/* Opciones adicionales: Recordar y Recuperar contraseña en la misma fila */}
            <div className="login-options">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                <span className="login-checkbox-text">Recordarme</span>
              </label>

              <Link to="/recuperar-password" className="login-forgot-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Botón de Envío */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
            >
              {isLoading ? (
                <div className="login-spinner" />
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </form>

          {/* Pie de página corporativo tipo referencia */}
          <div className="login-footer-text">
            <span>Sistema Web Corporativo - Grupo Anderson's</span>
          </div>

        </div>
      </div>

     {/* Columna Derecha: Carrusel a Pantalla Completa */}
<div className="login-col-image">
  <div className="login-carousel-container">
    {carouselSlides.map((slide, index) => (
      <div 
        key={index}
        className={`login-carousel-slide ${index === currentSlide ? 'active' : ''}`}
      >
        <img 
          src={slide.image} 
          className="login-full-image" 
        />
        <div className="login-image-gradient" />
      </div>
    ))}

    {/* Indicadores / Puntos de navegación en la parte inferior */}
    <div className="login-carousel-dots">
      {carouselSlides.map((_, dotIdx) => (
        <button
          key={dotIdx}
          type="button"
          onClick={() => setCurrentSlide(dotIdx)}
          className={`login-carousel-dot ${dotIdx === currentSlide ? 'active' : ''}`}
          aria-label={`Ir a diapositiva ${dotIdx + 1}`}
        />
      ))}
    </div>
  </div>
</div>

    </div>
  );
};

export default LoginPage;
