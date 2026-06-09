import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/landing_page/contacto.css';

function ContactModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        mensaje: ''
    });
    const [loading, setLoading] = useState(false);
    const itiRef = useRef(null);
    const phoneInputRef = useRef(null);

    // Inicializar intl-tel-input
    useEffect(() => {
        if (isOpen && phoneInputRef.current && window.intlTelInput && !itiRef.current) {
            itiRef.current = window.intlTelInput(phoneInputRef.current, {
                initialCountry: "co",
                separateDialCode: true,
                preferredCountries: ["co", "us", "es", "mx"],
                utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js"
            });

            // Filtrar solo números
            phoneInputRef.current.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
            });

            phoneInputRef.current.addEventListener('keypress', (e) => {
                const char = String.fromCharCode(e.which);
                if (!/[0-9]/.test(char)) {
                    e.preventDefault();
                }
            });
        }

        return () => {
            if (itiRef.current) {
                itiRef.current.destroy();
                itiRef.current = null;
            }
        };
    }, [isOpen]);

    const abrirModal = () => {
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const cerrarModal = () => {
        setIsOpen(false);
        document.body.style.overflow = '';
        setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
        if (itiRef.current) {
            itiRef.current.setNumber('');
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const getCSRFToken = () => {
        const name = 'csrftoken';
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    };

    const enviarFormulario = async (e) => {
        e.preventDefault();

        let telefonoCompleto = '';
        if (itiRef.current && formData.telefono) {
            telefonoCompleto = itiRef.current.getNumber();
        } else {
            telefonoCompleto = formData.telefono;
        }

        const submitData = {
            nombre: formData.nombre,
            email: formData.email,
            telefono: telefonoCompleto,
            mensaje: formData.mensaje
        };

        if (!submitData.nombre || !submitData.email || !submitData.mensaje) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor completa todos los campos obligatorios.',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(submitData.email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor ingresa un correo electrónico válido.',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/enviar-contacto/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(submitData)
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no devolvió una respuesta válida');
            }

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Mensaje enviado!',
                    text: data.message,
                    confirmButtonColor: '#2f7a7a'
                });
                cerrarModal();
            } else {
                throw new Error(data.error || 'Error al enviar');
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo enviar el mensaje. Intenta más tarde.',
                confirmButtonColor: '#d9534f'
            });
        } finally {
            setLoading(false);
        }
    };

    // Agregar event listeners a los botones de abrir
    useEffect(() => {
        const abrirBtns = document.querySelectorAll('#abrirContacto, #abrirContacto2');
        abrirBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModal();
            });
        });

        return () => {
            abrirBtns.forEach(btn => {
                btn.removeEventListener('click', abrirModal);
            });
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="contact-modal active">
            <div className="contact-modal-content">
                <div className="modal-header">
                    <div className="modal-logo">
                        <div className="modal-logo-icon">
                            <ion-icon name="medical-outline"></ion-icon>
                        </div>
                        <div className="modal-logo-text">DermAlert IA</div>
                    </div>
                    <h3>Contáctanos</h3>
                    <p>Estamos aquí para ayudarte</p>
                    <div className="modal-header-wave">
                        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                            <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                        </svg>
                    </div>
                    <button className="close-modal" id="cerrarModal" onClick={cerrarModal}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>

                <div className="modal-body">
                    <form className="contact-form" id="contactForm" onSubmit={enviarFormulario}>
                        <div className="form-group">
                            <label htmlFor="contactNombre">Nombre completo *</label>
                            <input
                                type="text"
                                id="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Edier Guette"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="contactEmail">Correo electrónico *</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tucorreo@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactTelefono">Teléfono</label>
                                <div className="phone-input-container">
                                    <input
                                        type="tel"
                                        id="telefono"
                                        ref={phoneInputRef}
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        placeholder="3229282626"
                                    />
                                </div>
                                <small className="phone-hint">Solo números, sin espacios ni guiones</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="contactMensaje">Mensaje *</label>
                            <textarea
                                id="mensaje"
                                value={formData.mensaje}
                                onChange={handleChange}
                                placeholder="¿En qué podemos ayudarte?"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar mensaje'}
                        </button>
                    </form>

                    <div className="contact-info">
                        <div className="info-item">
                            <ion-icon name="mail-outline"></ion-icon>
                            <span>edierjose01@gmail.com</span>
                        </div>
                        <div className="info-item">
                            <ion-icon name="call-outline"></ion-icon>
                            <span>322 928 2626</span>
                        </div>
                        <div className="info-item">
                            <ion-icon name="person-outline"></ion-icon>
                            <span>Edier Guette</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactModal;