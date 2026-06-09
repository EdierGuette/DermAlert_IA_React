import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth_modal.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function AuthModal({ isOpen, onClose, onVerify, title, message }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const modalRef = useRef(null);
    const passwordInputRef = useRef(null);
    const isPressedRef = useRef(false);

    // Log cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            errorCapture.logAction('AuthModal', 'MODAL_OPEN', 'Modal de autenticación abierto', {
                title: title,
                hasMessage: !!message
            });
        }
    }, [isOpen, title, message]);

    // Manejar cierre con Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                errorCapture.logAction('AuthModal', 'MODAL_CLOSE', 'Modal cerrado con tecla ESC');
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Enfocar input cuando se abre el modal
    useEffect(() => {
        if (isOpen && passwordInputRef.current) {
            setTimeout(() => passwordInputRef.current.focus(), 100);
        }
    }, [isOpen]);

    // Mostrar/ocultar contraseña (clic = mostrar, soltar = ocultar)
    const handleMouseDown = () => {
        isPressedRef.current = true;
        setShowPassword(true);
    };

    const handleMouseUp = () => {
        isPressedRef.current = false;
        setShowPassword(false);
    };

    const handleMouseLeave = () => {
        if (isPressedRef.current) {
            isPressedRef.current = false;
            setShowPassword(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!password.trim()) {
            errorCapture.logWarning('AuthModal', 'VALIDATION_ERROR', 'Intento de verificación sin contraseña');
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, ingresa tu contraseña',
                confirmButtonColor: '#d9534f',
                timer: 1500,
                showConfirmButton: false
            });
            return;
        }

        errorCapture.logAction('AuthModal', 'VERIFY_ATTEMPT', 'Iniciando verificación de contraseña');
        setLoading(true);
        const startTime = Date.now();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/verify-password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ password })
            });

            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok && data.valid) {
                errorCapture.logAction('AuthModal', 'VERIFY_SUCCESS', 'Verificación de contraseña exitosa', {
                    duration_ms: duration
                });
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Verificación exitosa',
                    text: 'Acceso concedido',
                    confirmButtonColor: '#2f7a7a',
                    timer: 800,
                    showConfirmButton: false
                });
                onVerify(true);
                onClose();
                setPassword('');
            } else {
                errorCapture.logWarning('AuthModal', 'VERIFY_FAILED', 'Verificación de contraseña fallida', {
                    error: data.error,
                    duration_ms: duration
                });
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error de verificación',
                    text: data.error || 'Contraseña incorrecta. Inténtalo de nuevo.',
                    confirmButtonColor: '#d9534f',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            errorCapture.logError('AuthModal', 'VERIFY_ERROR', 'Error en verificación de contraseña', {
                error_message: error.message,
                error_stack: error.stack
            });
            
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión. Inténtalo de nuevo.',
                confirmButtonColor: '#d9534f'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal" ref={modalRef}>
            <div className="auth-modal-overlay" onClick={() => {
                errorCapture.logAction('AuthModal', 'MODAL_CLOSE', 'Modal cerrado por clic en overlay');
                onClose();
            }}></div>
            <div className="auth-modal-container">
                <div className="auth-modal-header">
                    <div className="auth-modal-logo">
                        <div className="auth-modal-logo-icon">
                            <ion-icon name="medical-outline"></ion-icon>
                        </div>
                        <div className="auth-modal-logo-text">DermAlert IA</div>
                    </div>
                    <h3 id="authModalTitle">{title || 'Verificar identidad'}</h3>
                    <p id="authModalMessage">{message || 'Por favor, ingresa tu contraseña para continuar'}</p>
                    <button className="auth-modal-close" id="closeAuthModal" onClick={() => {
                        errorCapture.logAction('AuthModal', 'MODAL_CLOSE', 'Modal cerrado por botón X');
                        onClose();
                    }}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div className="auth-modal-body">
                    <form id="authForm" className="auth-modal-form" onSubmit={handleSubmit}>
                        <div className="auth-modal-form-group">
                            <div className="auth-modal-input-icon">
                                <ion-icon name="lock-closed-outline"></ion-icon>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="authPassword"
                                ref={passwordInputRef}
                                placeholder="Contraseña"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
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
                        <button type="submit" id="authSubmitBtn" className="auth-modal-btn" disabled={loading}>
                            <span id="authBtnText">{loading ? 'Verificando...' : 'Verificar'}</span>
                            {loading && <div id="authBtnLoader" className="auth-modal-loader"></div>}
                        </button>
                    </form>
                </div>
                <div className="auth-modal-footer">
                    <p>Esta acción requiere verificación de seguridad</p>
                </div>
            </div>
        </div>
    );
}

export default AuthModal;