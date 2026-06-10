import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import confetti from 'canvas-confetti';

// Importar CSS
import '../css/auth.css';
import '../css/styles/global.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getLogoIconSync, getAppVersionSync } from '../services/config';

function Login() {
    const [identificacion, setIdentificacion] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [identificacionError, setIdentificacionError] = useState('');
    const navigate = useNavigate();

    const projectName = getProjectNameSync();
    const logoIcon = getLogoIconSync();

    useEffect(() => {
        errorCapture.logAction('Login', 'MOUNT', 'Página de login montada', {
            project_name: projectName
        });
        return () => {
            errorCapture.logAction('Login', 'UNMOUNT', 'Página de login desmontada');
        };
    }, [projectName]);

    // Validar identificación en tiempo real (solo números)
    const handleIdentificacionChange = (e) => {
        const value = e.target.value;
        
        if (value === '') {
            setIdentificacion('');
            setIdentificacionError('');
            return;
        }
        
        if (/^[0-9]+$/.test(value)) {
            setIdentificacion(value);
            setIdentificacionError('');
        } else {
            const onlyNumbers = value.replace(/[^0-9]/g, '');
            setIdentificacion(onlyNumbers);
            setIdentificacionError('Solo se permiten números');
        }
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    // Función para lanzar confeti
    const lanzarConfeti = () => {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '99999';
        document.body.appendChild(canvas);
        
        const myConfetti = confetti.create(canvas, {
            resize: true,
            useWorker: true
        });
        
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        
        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }
        
        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                setTimeout(() => {
                    if (document.body.contains(canvas)) {
                        document.body.removeChild(canvas);
                    }
                }, 500);
                return;
            }
            
            const particleCount = 50 * (timeLeft / duration);
            
            myConfetti({
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            
            myConfetti({
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        errorCapture.logAction('Login', 'LOGIN_ATTEMPT', 'Intento de inicio de sesión', {
            identificacion: identificacion,
            hasPassword: !!password
        });

        // SweetAlert SOLO cuando hay campos vacíos
        if (!identificacion || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor completa todos los campos',
                confirmButtonColor: '#2f7a7a',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        setLoading(true);
        const startTime = Date.now();

        try {
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
                    duration_ms: duration
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                const fullName = `${data.user.first_name} ${data.user.last_name}`;

                lanzarConfeti();

                Swal.fire({
                    title: '¡Bienvenido!',
                    html: `
                        <div style="text-align: center;">
                            <p style="margin-bottom: 15px; font-size: 16px;">Has iniciado sesión correctamente.</p>
                            <div style="background: #eef6f5; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <strong style="color: #2f7a7a;">Usuario:</strong><br>
                                <span style="font-weight: 600;">${fullName}</span>
                            </div>
                            <div style="width: 100%; height: 4px; background: #eef6f5; border-radius: 4px; overflow: hidden;">
                                <div id="progressBar" style="width: 100%; height: 100%; background: linear-gradient(90deg, #2f7a7a, #1e5f5f); transition: width 0.1s linear;"></div>
                            </div>
                        </div>
                    `,
                    icon: 'success',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        const progressBar = document.getElementById('progressBar');
                        let width = 100;
                        const interval = setInterval(() => {
                            width -= 2;
                            if (progressBar) {
                                progressBar.style.width = width + '%';
                            }
                            if (width <= 0) {
                                clearInterval(interval);
                            }
                        }, 40);
                        
                        setTimeout(() => {
                            Swal.close();
                            navigate('/dashboard');
                        }, 2000);
                    }
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Datos incorrectos',
                    confirmButtonColor: '#d9534f',
                    showConfirmButton: false,  // ← OCULTA EL BOTÓN
                    timer: 2500,
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });

                errorCapture.logWarning('Login', 'LOGIN_FAILED', 'Inicio de sesión fallido', {
                    identificacion: identificacion,
                    status: response.status,
                    duration_ms: duration
                });
            }
        } catch (error) {
            errorCapture.logError('Login', 'CONNECTION_ERROR', 'Error de conexión', {
                error_message: error.message
            });

            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                confirmButtonColor: '#d9534f'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBackToHome = () => {
        errorCapture.logAction('Login', 'BACK_TO_HOME', 'Usuario regresa a la página principal');
    };

    const handleMouseDown = () => setShowPassword(true);
    const handleMouseUp = () => setShowPassword(false);
    const handleMouseLeave = () => setShowPassword(false);

    return (
        <div className="auth-wrapper">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <div className="auth-logo-icon">
                                <ion-icon name={logoIcon}></ion-icon>
                            </div>
                            <div className="auth-logo-text">{projectName}</div>
                        </div>
                        <h2>Iniciar sesión</h2>
                        <div className="auth-header-wave">
                            <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                                <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="auth-body">
                        <form onSubmit={handleSubmit} className="auth-form" noValidate>
                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="card-outline" className="input-icon"></ion-icon>
                                    <input
                                        type="text"
                                        id="identificacion"
                                        value={identificacion}
                                        onChange={handleIdentificacionChange}
                                        placeholder=" "
                                        required
                                        className={identificacionError ? 'error' : ''}
                                    />
                                    <label htmlFor="identificacion">Número de Identificación</label>
                                </div>
                                <div className="error-message-container">
                                    <div className={`error-message ${identificacionError ? '' : 'hidden'}`}>
                                        {identificacionError}
                                    </div>
                                </div>
                            </div>

                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        value={password}
                                        onChange={handlePasswordChange}
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
                                    <div className="error-message hidden"></div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-btn"
                                disabled={loading}
                            >
                                <span>{loading ? 'Iniciando...' : 'Iniciar Sesión'}</span>
                                {loading && <div className="btn-loader"></div>}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿No tienes una cuenta? &nbsp;
                                <Link to="/register">
                                    Regístrate aquí
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="back-to-home">
                <Link to="/" className="back-btn" onClick={handleBackToHome}>
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default Login;