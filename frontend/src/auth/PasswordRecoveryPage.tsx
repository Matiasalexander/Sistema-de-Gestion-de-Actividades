import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  MailCheck,
  RefreshCw,
} from "lucide-react";
import { apiFetch } from "../services/api";
import logo from "../img/gandersons-wlogo.png";

/* PREPARACIÓN DEL CARRUSEL */
import slide1 from "../img/login-image.jpg";
import slide2 from "../img/login-image2.jpg";
import slide3 from "../img/login-image3.jpg";

const carouselSlides = [
  { image: slide1 },
  { image: slide2 },
  { image: slide3 }
];

import "../styles/PasswordRecoveryPage.css";

export const PasswordRecoveryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Carrusel automático
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const token = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tokenFromSearch = searchParams.get("token");
    if (tokenFromSearch) return tokenFromSearch;

    if (location.hash) {
      const hashContent = location.hash.includes("?")
        ? location.hash.split("?")[1]
        : location.hash.replace(/^#/, "");
      const hashParams = new URLSearchParams(hashContent);
      return hashParams.get("token") || "";
    }

    return "";
  }, [location.search, location.hash]);

  const isResetMode = Boolean(token);

  // Estados del modo Solicitud
  const [email, setEmail] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Estados del modo Restablecimiento
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Estados comunes de control
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validaciones en tiempo real para la contraseña
  const hasMinLength = newPassword.length >= 12;
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword;

  // Manejar solicitud de enlace
  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailClean = email.trim();
    if (!emailClean) {
      setErrorMessage("Por favor ingrese su correo corporativo.");
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch<{ mensaje: string }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: emailClean }),
      });
      setRequestSuccess(true);
    } catch (err: any) {
      console.error("Error al solicitar recuperación:", err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo procesar la solicitud en este momento. Intente más tarde.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar cambio efectivo de contraseña
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!hasMinLength) {
      setErrorMessage("La contraseña debe tener al menos 12 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      setIsLoading(true);
      await apiFetch<{ mensaje: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token,
          nuevoPassword: newPassword,
        }),
      });
      setResetSuccess(true);
    } catch (err: any) {
      console.error("Error al restablecer contraseña:", err);
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        err?.message ||
        "El enlace ha expirado o no es válido. Por favor solicita uno nuevo.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolverAlLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (typeof window !== "undefined") {
      window.location.hash = "";
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="login-split-page">
      {/* Columna Izquierda: Formulario (contenido libre sin tarjeta rígida) */}
      <div className="login-col-form">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />

        <div className="login-form-container">
          {/* Cabecera & Logotipo acorde a LoginPage */}
          <div className="login-header">
            <div className="login-logo-container">
              <img
                className="login-logo"
                src={logo}
                alt="Grupo Anderson's Logo"
              />
            </div>

            <div className="login-header-text">
              <h1 className="login-title">
                {isResetMode ? "NUEVA CONTRASEÑA" : "RECUPERAR ACCESO"}
              </h1>
              <div className="login-title-bar" />
              <p className="login-subtitle">
                {isResetMode
                  ? "Establece una nueva contraseña segura para tu cuenta corporativa."
                  : "Ingresa tu correo corporativo para obtener el link de restablecimiento."}
              </p>
            </div>
          </div>

          {/* Banner de error */}
          {errorMessage && (
            <div className="login-alert">
              <AlertCircle className="login-alert-icon" />
              <span className="login-alert-text">{errorMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* CASO 1: Modo Solicitud - Correo enviado con éxito               */}
          {/* ============================================================== */}
          {!isResetMode && requestSuccess ? (
            <div className="recovery-success-box">
              <div className="recovery-success-icon-wrap">
                <MailCheck className="recovery-success-icon" />
              </div>

              <div>
                <h2 className="recovery-success-title">
                  Instrucciones enviadas
                </h2>
                <p className="recovery-success-message">
                  Si la cuenta{" "}
                  <strong style={{ color: "#bfdbfe", fontWeight: 500 }}>
                    {email}
                  </strong>{" "}
                  está registrada y activa en la plataforma, recibirás un correo
                  con un enlace de recuperación con validez de{" "}
                  <strong style={{ color: "#fff" }}>15 minutos</strong>.
                </p>
                <p className="recovery-success-hint">
                  Revisa también tu bandeja de correo no deseado o spam.
                </p>
              </div>

              <div className="recovery-actions-column">
                <button
                  type="button"
                  onClick={handleVolverAlLogin}
                  className="recovery-btn-submit"
                >
                  <ArrowLeft className="recovery-icon" />
                  <span>Volver al inicio de sesión</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestSuccess(false);
                    setEmail("");
                  }}
                  className="recovery-btn-secondary"
                >
                  <RefreshCw
                    className="recovery-icon"
                    style={{ width: "0.875rem", height: "0.875rem" }}
                  />
                  <span>Probar con otro correo</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* ============================================================== */}
          {/* CASO 2: Modo Solicitud - Formulario de Correo                   */}
          {/* ============================================================== */}
          {!isResetMode && !requestSuccess ? (
            <form onSubmit={handleRequestSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="email" className="login-label">
                  Correo Corporativo
                </label>
                <div className="login-input-group">
                  <span className="login-input-icon">
                    <Mail className="login-icon" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@grupoandersons.com"
                    className="login-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="recovery-btn-submit"
              >
                {isLoading ? (
                  <div className="recovery-spinner" />
                ) : (
                  <>
                    <span>Enviar instrucciones</span>
                    <ArrowRight className="recovery-btn-arrow" />
                  </>
                )}
              </button>

              <div className="recovery-back-container">
                <button
                  type="button"
                  onClick={handleVolverAlLogin}
                  className="recovery-btn-back-link"
                >
                  <ArrowLeft
                    className="recovery-icon"
                    style={{ width: "0.875rem", height: "0.875rem" }}
                  />
                  <span>Volver al inicio de sesión</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* ============================================================== */}
          {/* CASO 3: Modo Restablecimiento - Contraseña cambiada con éxito   */}
          {/* ============================================================== */}
          {isResetMode && resetSuccess ? (
            <div className="recovery-success-box">
              <div className="recovery-success-icon-wrap">
                <CheckCircle2 className="recovery-success-icon" />
              </div>

              <div>
                <h2 className="recovery-success-title">
                  ¡Contraseña actualizada!
                </h2>
                <p className="recovery-success-message">
                  Tu contraseña ha sido restablecida exitosamente. Ya puedes
                  ingresar al sistema con tus nuevas credenciales.
                </p>
              </div>

              <div style={{ paddingTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleVolverAlLogin}
                  className="recovery-btn-submit"
                >
                  <span>Iniciar Sesión Ahora</span>
                  <ArrowRight className="recovery-icon" />
                </button>
              </div>
            </div>
          ) : null}

          {/* ============================================================== */}
          {/* CASO 4: Modo Restablecimiento - Formulario de Nueva Contraseña  */}
          {/* ============================================================== */}
          {isResetMode && !resetSuccess ? (
            <form onSubmit={handleResetSubmit} className="login-form">
              {/* Nueva Contraseña */}
              <div className="login-field">
                <label htmlFor="newPassword" className="login-label">
                  Nueva Contraseña
                </label>
                <div className="login-input-group">
                  <span className="login-input-icon">
                    <Lock className="login-icon" />
                  </span>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 12 caracteres"
                    className="login-input login-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Ver contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="login-icon" color="#3478F3" />
                    ) : (
                      <Eye className="login-icon" color="#3478F3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="login-field">
                <label htmlFor="confirmPassword" className="login-label">
                  Confirmar Contraseña
                </label>
                <div className="login-input-group">
                  <span className="login-input-icon">
                    <Lock className="login-icon" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="login-input login-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="login-password-toggle"
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar contraseña"
                        : "Ver contraseña"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="login-icon" color="#3478F3" />
                    ) : (
                      <Eye className="login-icon" color="#3478F3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Indicadores de requisitos de contraseña */}
              <div className="recovery-requirements">
                <div className="recovery-req-item">
                  <span
                    className={`recovery-req-bullet ${hasMinLength ? "valid" : "invalid"}`}
                  >
                    {hasMinLength ? "✓" : "•"}
                  </span>
                  <span
                    className={`recovery-req-text ${hasMinLength ? "valid" : "invalid"}`}
                  >
                    Mínimo 12 caracteres requeridos
                  </span>
                </div>
                <div className="recovery-req-item">
                  <span
                    className={`recovery-req-bullet ${passwordsMatch ? "valid" : "invalid"}`}
                  >
                    {passwordsMatch ? "✓" : "•"}
                  </span>
                  <span
                    className={`recovery-req-text ${passwordsMatch ? "valid" : "invalid"}`}
                  >
                    Las contraseñas coinciden
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !hasMinLength || !passwordsMatch}
                className="recovery-btn-submit"
              >
                {isLoading ? (
                  <div className="recovery-spinner" />
                ) : (
                  <>
                    <span>Guardar nueva contraseña</span>
                    <ArrowRight className="recovery-btn-arrow" />
                  </>
                )}
              </button>

              <div className="recovery-back-container">
                <button
                  type="button"
                  onClick={handleVolverAlLogin}
                  className="recovery-btn-back-link"
                >
                  <ArrowLeft
                    className="recovery-icon"
                    style={{ width: "0.875rem", height: "0.875rem" }}
                  />
                  <span>Cancelar y volver al login</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Pie de página corporativo */}
          <div className="login-footer-text">
            <span>Sistema Web Corporativo - Grupo Anderson's</span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Carrusel a Pantalla Completa (HERMANO de login-col-form) */}
      <div className="login-col-image">
        <div className="login-carousel-container">
          {carouselSlides.map((slide, index) => (
            <div
              key={index}
              className={`login-carousel-slide ${index === currentSlide ? "active" : ""}`}
            >
              <img
                src={slide.image}
                alt="Grupo Anderson's"
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
                className={`login-carousel-dot ${dotIdx === currentSlide ? "active" : ""}`}
                aria-label={`Ir a diapositiva ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryPage;
