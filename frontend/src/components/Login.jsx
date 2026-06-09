import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth.css';
import '../css/styles/global.css';

function Login() {
    const [identificacion, setIdentificacion] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identificacion || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor ingresa tu identificación y contraseña',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        if (!/^[0-9]+$/.test(identificacion)) {
            Swal.fire({
                icon: 'warning',
                title: 'Formato inválido',
                text: 'La identificación solo debe contener números',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identificacion, password })
            });

            const data = await response.json();

            if (response.ok) {
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

                navigate('/dashboard');
            } else {
                let errorMsg = 'Credenciales incorrectas';
                if (response.status === 400 || response.status === 401) {
                    errorMsg = 'Contraseña incorrecta';
                } else if (response.status === 403) {
                    errorMsg = 'No tienes permisos para acceder. Verifica tu cuenta.';
                } else if (response.status >= 500) {
                    errorMsg = 'Error del servidor. Por favor, intente más tarde.';
                } else {
                    errorMsg = data.detail || data.error || 'Credenciales incorrectas';
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonColor: '#d9534f',
                    timer: 2000
                });
            }
        } catch (error) {
            console.error('Error en login:', error);
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
                                        onChange={(e) => setIdentificacion(e.target.value)}
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
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder=" "
                                        required
                                    />
                                    <label htmlFor="password">Contraseña</label>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-password"></div>
                                </div>
                            </div>

                            <button type="submit" className="auth-btn" disabled={loading}>
                                <span id="btnText">{loading ? 'Iniciando...' : 'Iniciar Sesión'}</span>
                                {loading && <div className="btn-loader"></div>}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿No tienes una cuenta? <Link to="/register">Regístrate aquí</Link></p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="back-to-home">
                <Link to="/" className="back-btn">
                    <ion-icon name="arrow-back-outline"></ion-icon>
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default Login;