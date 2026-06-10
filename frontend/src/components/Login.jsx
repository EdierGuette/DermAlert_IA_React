import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth.css';
import '../css/styles/global.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Login() {
    const [identificacion, setIdentificacion] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // ← NUEVO
    const navigate = useNavigate();

    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Login', 'MOUNT', 'Página de login montada');
        return () => {
            errorCapture.logAction('Login', 'UNMOUNT', 'Página de login desmontada');
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        errorCapture.logAction('Login', 'LOGIN_ATTEMPT', 'Intento de inicio de sesión', {
            identificacion: identificacion,
            hasPassword: !!password
        });

        if (!identificacion || !password) {
            errorCapture.logWarning('Login', 'VALIDATION_ERROR', 'Campos requeridos faltantes', {
                hasIdentificacion: !!identificacion,
                hasPassword: !!password
            });
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor ingresa tu identificación y contraseña',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        if (!/^[0-9]+$/.test(identificacion)) {
            errorCapture.logWarning('Login', 'VALIDATION_ERROR', 'Formato de identificación inválido', {
                identificacion: identificacion
            });
            Swal.fire({
                icon: 'warning',
                title: 'Formato inválido',
                text: 'La identificación solo debe contener números',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        setLoading(true);
        const startTime = Date.now();

        try {
            errorCapture.logAction('Login', 'API_CALL_START', 'Llamando a API de login', {
                endpoint: '/api/login/',
                method: 'POST'
            });

            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identificacion, password })
            });

            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
                errorCapture.logAction('Login', 'LOGIN_SUCCESS', 'Inicio de sesión exitoso', {
                    identificacion: identificacion,
                    user_id: data.user?.id,
                    user_rol: data.user?.rol,
                    duration_ms: duration,
                    project_name: data.project_name
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                const fullName = `${data.user.first_name} ${data.user.last_name}`;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Inicio de sesión exitoso!',
                    html: `<div style="text-align: center;">
            <p style="margin-bottom: 15px;">Has iniciado sesión correctamente en ${data.project_name || 'DermAlert IA'}.</p>
            <div style="background: #eef6f5; padding: 12px; border-radius: 8px;">
              <strong style="color: #2f7a7a;">Usuario:</strong><br>
              <span style="font-weight: 600;">${fullName}</span>
            </div>
          </div>`,
                    confirmButtonColor: '#2f7a7a',
                    timer: 2000,
                    showConfirmButton: false
                });

                errorCapture.logAction('Login', 'REDIRECT', 'Redirigiendo a dashboard');
                navigate('/dashboard');
            } else {
                let errorMsg = 'Credenciales incorrectas';
                let errorType = 'unknown';

                if (response.status === 400 || response.status === 401) {
                    errorMsg = 'Contraseña incorrecta';
                    errorType = 'invalid_credentials';
                } else if (response.status === 403) {
                    errorMsg = 'No tienes permisos para acceder. Verifica tu cuenta.';
                    errorType = 'forbidden';
                } else if (response.status >= 500) {
                    errorMsg = 'Error del servidor. Por favor, intente más tarde.';
                    errorType = 'server_error';
                } else {
                    errorMsg = data.detail || data.error || 'Credenciales incorrectas';
                    errorType = 'unknown';
                }

                errorCapture.logWarning('Login', 'LOGIN_FAILED', 'Inicio de sesión fallido', {
                    identificacion: identificacion,
                    status: response.status,
                    error: errorMsg,
                    error_type: errorType,
                    duration_ms: duration
                });

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonColor: '#d9534f',
                    timer: 2000
                });
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            errorCapture.logError('Login', 'CONNECTION_ERROR', 'Error de conexión al servidor', {
                error_message: error.message,
                error_stack: error.stack,
                duration_ms: duration,
                identificacion: identificacion
            });

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor. Verifica que el servidor esté corriendo.',
                confirmButtonColor: '#d9534f'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBackToHome = () => {
        errorCapture.logAction('Login', 'BACK_TO_HOME', 'Usuario regresa a la página principal');
    };

    // Handlers para el toggle de contraseña (muestra mientras se presiona)
    const handleMouseDown = () => {
        setShowPassword(true);
    };

    const handleMouseUp = () => {
        setShowPassword(false);
    };

    const handleMouseLeave = () => {
        setShowPassword(false);
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">
                                <ion-icon name="medical-outline"></ion-icon>
                            </div>
                            <div className="auth-logo-text">DermAlert IA</div>
                        </div>
                        <h2>Iniciar sesión</h2>
                        <div className="auth-header-wave">
                            <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                                <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="auth-body">
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="card-outline" className="input-icon"></ion-icon>
                                    <input
                                        type="text"
                                        id="identificacion"
                                        value={identificacion}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setIdentificacion(value);
                                            if (value.length > 0) {
                                                errorCapture.logAction('Login', 'FIELD_INPUT', 'Campo identificación modificado', {
                                                    length: value.length
                                                });
                                            }
                                        }}
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="identificacion">Número de Identificación</label>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-identificacion"></div>
                                </div>
                            </div>

                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setPassword(value);
                                            if (value.length > 0) {
                                                errorCapture.logAction('Login', 'FIELD_INPUT', 'Campo contraseña modificado', {
                                                    length: value.length
                                                });
                                            }
                                        }}
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="password">Contraseña</label>
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onMouseDown={handleMouseDown}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseLeave}
                                        onTouchStart={handleMouseDown}
                                        onTouchEnd={handleMouseUp}
                                        onTouchCancel={handleMouseLeave}
                                    >
                                        <ion-icon name={showPassword ? "eye-off-outline" : "eye-outline"}></ion-icon>
                                    </button>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-password"></div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-btn"
                                disabled={loading}
                                onClick={() => errorCapture.logAction('Login', 'SUBMIT_BUTTON_CLICK', 'Botón de inicio de sesión presionado')}
                            >
                                <span id="btnText">{loading ? 'Iniciando...' : 'Iniciar Sesión'}</span>
                                {loading && <div className="btn-loader"></div>}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿No tienes una cuenta? &nbsp;
                                <Link
                                    to="/register"
                                    onClick={() => errorCapture.logAction('Login', 'REGISTER_LINK_CLICK', 'Click en enlace de registro')}
                                >
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="back-to-home">
                <Link
                    to="/"
                    className="back-btn"
                    onClick={handleBackToHome}
                >
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default Login;