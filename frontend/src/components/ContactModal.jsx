import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/landing_page/contacto.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getLogoIconSync, getAppVersionSync } from '../services/config';

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

    // Obtener configuración de forma síncrona (ya debería estar cargada)
    const projectName = getProjectNameSync();
    const logoIcon = getLogoIconSync();
    const appVersion = getAppVersionSync();

    // Log cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            errorCapture.logAction('ContactModal', 'MODAL_OPEN', 'Modal de contacto abierto', {
                project_name: projectName
            });
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen, projectName]);

    // Inicializar intl-tel-input
    useEffect(() => {
        if (isOpen && phoneInputRef.current && window.intlTelInput && !itiRef.current) {
            errorCapture.logAction('ContactModal', 'INTL_TEL_INIT', 'Inicializando selector de país para teléfono', {
                project_name: projectName
            });
            
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
            
            errorCapture.logAction('ContactModal', 'INTL_TEL_READY', 'Selector de país inicializado correctamente');
        }

        return () => {
            if (itiRef.current) {
                errorCapture.logAction('ContactModal', 'INTL_TEL_DESTROY', 'Destruyendo selector de país');
                itiRef.current.destroy();
                itiRef.current = null;
            }
        };
    }, [isOpen, projectName]);

    const abrirModal = () => {
        errorCapture.logAction('ContactModal', 'MODAL_OPEN_TRIGGER', 'Modal de contacto abierto desde botón', {
            project_name: projectName
        });
        setIsOpen(true);
    };

    const cerrarModal = () => {
        errorCapture.logAction('ContactModal', 'MODAL_CLOSE', 'Modal de contacto cerrado', {
            formulario_lleno: {
                nombre: !!formData.nombre,
                email: !!formData.email,
                telefono: !!formData.telefono,
                mensaje: !!formData.mensaje
            },
            project_name: projectName
        });
        setIsOpen(false);
        setFormData({ nombre: '', email: '', telefono: '', mensaje: '' });
        if (itiRef.current) {
            itiRef.current.setNumber('');
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        
        // Log para cambios en campos (solo en desarrollo, opcional)
        if (process.env.NODE_ENV === 'development') {
            errorCapture.logAction('ContactModal', 'FORM_FIELD_CHANGE', `Campo ${id} modificado`, {
                field: id,
                value_length: value.length
            });
        }
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

        errorCapture.logAction('ContactModal', 'FORM_SUBMIT_START', 'Iniciando envío de formulario de contacto', {
            project_name: projectName
        });

        let telefonoCompleto = '';
        if (itiRef.current && formData.telefono) {
            telefonoCompleto = itiRef.current.getNumber();
            errorCapture.logAction('ContactModal', 'PHONE_FORMAT', 'Teléfono formateado con código de país', {
                raw: formData.telefono,
                formatted: telefonoCompleto
            });
        } else {
            telefonoCompleto = formData.telefono;
        }

        const submitData = {
            nombre: formData.nombre.trim(),
            email: formData.email.trim(),
            telefono: telefonoCompleto,
            mensaje: formData.mensaje.trim()
        };

        // Validación de campos requeridos
        if (!submitData.nombre || !submitData.email || !submitData.mensaje) {
            errorCapture.logWarning('ContactModal', 'VALIDATION_ERROR', 'Campos requeridos faltantes', {
                nombre: !!submitData.nombre,
                email: !!submitData.email,
                mensaje: !!submitData.mensaje,
                project_name: projectName
            });
            
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor completa todos los campos obligatorios.',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        // Validación de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(submitData.email)) {
            errorCapture.logWarning('ContactModal', 'VALIDATION_ERROR', 'Email inválido', {
                email: submitData.email,
                project_name: projectName
            });
            
            Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor ingresa un correo electrónico válido.',
                confirmButtonColor: '#2f7a7a'
            });
            return;
        }

        setLoading(true);
        const startTime = Date.now();

        try {
            errorCapture.logAction('ContactModal', 'API_CALL_START', 'Enviando petición a /api/enviar-contacto/', {
                nombre: submitData.nombre,
                email: submitData.email,
                tiene_telefono: !!submitData.telefono,
                mensaje_length: submitData.mensaje.length,
                project_name: projectName
            });

            const response = await fetch('/api/enviar-contacto/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(submitData)
            });

            const duration = Date.now() - startTime;
            const contentType = response.headers.get('content-type');
            
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('El servidor no devolvió una respuesta válida');
            }

            const data = await response.json();

            if (data.success) {
                errorCapture.logAction('ContactModal', 'FORM_SUBMIT_SUCCESS', 'Formulario de contacto enviado exitosamente', {
                    duration_ms: duration,
                    nombre: submitData.nombre,
                    email: submitData.email,
                    project_name: projectName
                });
                
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
            const duration = Date.now() - startTime;
            errorCapture.logError('ContactModal', 'FORM_SUBMIT_ERROR', 'Error al enviar formulario de contacto', {
                error_message: error.message,
                duration_ms: duration,
                nombre: submitData.nombre,
                email: submitData.email,
                project_name: projectName
            });
            
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
        errorCapture.logAction('ContactModal', 'SETUP_LISTENERS', 'Configurando event listeners para botones de contacto', {
            project_name: projectName
        });
        
        const abrirBtns = document.querySelectorAll('#abrirContacto, #abrirContacto2');
        const handleClick = (e) => {
            e.preventDefault();
            abrirModal();
        };
        
        abrirBtns.forEach(btn => {
            btn.addEventListener('click', handleClick);
        });

        return () => {
            errorCapture.logAction('ContactModal', 'CLEANUP_LISTENERS', 'Limpiando event listeners');
            abrirBtns.forEach(btn => {
                btn.removeEventListener('click', handleClick);
            });
        };
    }, [projectName]);

    if (!isOpen) return null;

    return (
        <div className="contact-modal active">
            <div className="contact-modal-content">
                <div className="modal-header">
                    <div className="modal-logo">
                        <div className="modal-logo-icon">
                            <ion-icon name={logoIcon}></ion-icon>
                        </div>
                        <div className="modal-logo-text">{projectName}</div>
                    </div>
                    <h3>Contáctanos</h3>
                    <p>Estamos aquí para ayudarte</p>
                    <div className="modal-header-wave">
                        <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                            <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                        </svg>
                    </div>
                    <button 
                        className="close-modal" 
                        id="cerrarModal" 
                        onClick={() => {
                            errorCapture.logAction('ContactModal', 'MODAL_CLOSE_BUTTON', 'Modal cerrado por botón X', {
                                project_name: projectName
                            });
                            cerrarModal();
                        }}
                    >
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
                                onFocus={() => errorCapture.logAction('ContactModal', 'FIELD_FOCUS', 'Campo nombre enfocado')}
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
                                    onFocus={() => errorCapture.logAction('ContactModal', 'FIELD_FOCUS', 'Campo email enfocado')}
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
                                        onFocus={() => errorCapture.logAction('ContactModal', 'FIELD_FOCUS', 'Campo teléfono enfocado')}
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
                                onFocus={() => errorCapture.logAction('ContactModal', 'FIELD_FOCUS', 'Campo mensaje enfocado')}
                            ></textarea>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={loading}
                            onClick={() => errorCapture.logAction('ContactModal', 'SUBMIT_BUTTON_CLICK', 'Botón enviar presionado', {
                                project_name: projectName
                            })}
                        >
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