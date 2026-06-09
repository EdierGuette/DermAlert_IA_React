import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth_modal.css';

function AuthModal({ isOpen, onClose, onVerify, title, message }) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const modalRef = useRef(null);
    const passwordInputRef = useRef(null);
    const isPressedRef = useRef(false);

    // Manejar cierre con Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
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

        setLoading(true);

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

            const data = await response.json();

            if (response.ok && data.valid) {
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
            console.error('Error verificando contraseña:', error);
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
            <div className="auth-modal-overlay" onClick={onClose}></div>
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
                    <button className="auth-modal-close" id="closeAuthModal" onClick={onClose}>
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