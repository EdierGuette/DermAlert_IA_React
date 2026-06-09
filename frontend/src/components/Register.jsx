import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth.css';
import '../css/styles/global.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Register() {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        identificacion: '',
        telefono: '',
        sexo: '',
        departamento: '',
        ciudad: '',
        password: '',
        password_confirm: ''
    });

    const [departamentos, setDepartamentos] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [departamentosCargados, setDepartamentosCargados] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '', class: '' });
    const navigate = useNavigate();

    // Log de montaje
    useEffect(() => {
        errorCapture.logAction('Register', 'MOUNT', 'Página de registro montada');
        return () => {
            errorCapture.logAction('Register', 'UNMOUNT', 'Página de registro desmontada');
        };
    }, []);

    // Cargar departamentos desde colombia.json
    useEffect(() => {
        errorCapture.logAction('Register', 'LOAD_DEPARTMENTS_START', 'Cargando departamentos desde colombia.json');
        
        const cargarDepartamentos = async () => {
            const startTime = Date.now();
            try {
                const response = await fetch('/data/colombia.json');
                const data = await response.json();
                // Ordenar alfabéticamente
                const ordenados = [...data].sort((a, b) =>
                    a.departamento.localeCompare(b.departamento, 'es')
                );
                setDepartamentos(ordenados);
                setDepartamentosCargados(true);
                
                const duration = Date.now() - startTime;
                errorCapture.logAction('Register', 'LOAD_DEPARTMENTS_SUCCESS', 'Departamentos cargados exitosamente', {
                    cantidad: ordenados.length,
                    duration_ms: duration
                });
            } catch (error) {
                const duration = Date.now() - startTime;
                errorCapture.logError('Register', 'LOAD_DEPARTMENTS_ERROR', 'Error cargando departamentos', {
                    error_message: error.message,
                    duration_ms: duration
                });
                Swal.fire({
                    icon: 'warning',
                    title: 'Aviso',
                    text: 'No se pudieron cargar los departamentos. Algunas funcionalidades pueden verse afectadas.',
                    confirmButtonColor: '#2f7a7a'
                });
            }
        };
        cargarDepartamentos();
    }, []);

    // Actualizar ciudades cuando cambia el departamento
    const handleDepartamentoChange = (e) => {
        const deptoNombre = e.target.value;
        errorCapture.logAction('Register', 'DEPARTMENT_CHANGE', `Departamento seleccionado: ${deptoNombre}`);
        
        setFormData({ ...formData, departamento: deptoNombre, ciudad: '' });

        const deptoObj = departamentos.find(d => d.departamento === deptoNombre);
        if (deptoObj && deptoObj.ciudades) {
            const ciudadesOrdenadas = [...deptoObj.ciudades].sort((a, b) =>
                a.localeCompare(b, 'es')
            );
            setCiudades(ciudadesOrdenadas);
            errorCapture.logAction('Register', 'CITIES_LOADED', `Ciudades cargadas para ${deptoNombre}`, {
                cantidad: ciudadesOrdenadas.length
            });
        } else {
            setCiudades([]);
            errorCapture.logWarning('Register', 'NO_CITIES', `No hay ciudades disponibles para ${deptoNombre}`);
        }
    };

    // Validar fortaleza de contraseña
    const checkPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[$@#&!]/.test(password)) strength++;

        let text = '';
        let classname = '';
        if (strength <= 2) {
            text = 'Contraseña débil';
            classname = 'weak';
        } else if (strength <= 4) {
            text = 'Contraseña media';
            classname = 'medium';
        } else {
            text = 'Contraseña fuerte';
            classname = 'strong';
        }

        setPasswordStrength({ strength, text, class: classname });
        
        errorCapture.logAction('Register', 'PASSWORD_STRENGTH', `Fortaleza de contraseña: ${text}`, {
            strength_level: strength,
            strength_text: text
        });
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
        
        // Log para cambios en campos (solo en desarrollo, opcional)
        if (process.env.NODE_ENV === 'development' && !['password', 'password_confirm'].includes(id)) {
            errorCapture.logAction('Register', 'FIELD_CHANGE', `Campo ${id} modificado`, {
                field: id,
                value_length: value.length
            });
        }

        if (id === 'password') {
            checkPasswordStrength(value);
        }
    };

    const validateForm = () => {
        const { first_name, last_name, identificacion, telefono, sexo, departamento, ciudad, password, password_confirm } = formData;

        errorCapture.logAction('Register', 'VALIDATION_START', 'Validando formulario de registro');

        if (!first_name || !last_name || !identificacion || !telefono || !sexo || !departamento || !ciudad || !password || !password_confirm) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Campos requeridos faltantes', {
                missing: {
                    first_name: !first_name,
                    last_name: !last_name,
                    identificacion: !identificacion,
                    telefono: !telefono,
                    sexo: !sexo,
                    departamento: !departamento,
                    ciudad: !ciudad,
                    password: !password,
                    password_confirm: !password_confirm
                }
            });
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Por favor, complete todos los campos',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(first_name) || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(last_name)) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Nombre o apellido con formato inválido', {
                first_name: first_name,
                last_name: last_name
            });
            Swal.fire({
                icon: 'warning',
                title: 'Formato inválido',
                text: 'Los nombres solo pueden contener letras',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (!/^[0-9]+$/.test(identificacion)) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Identificación con formato inválido', {
                identificacion: identificacion
            });
            Swal.fire({
                icon: 'warning',
                title: 'Formato inválido',
                text: 'La identificación solo debe contener números',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (!/^[0-9]+$/.test(telefono)) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Teléfono con formato inválido', {
                telefono: telefono
            });
            Swal.fire({
                icon: 'warning',
                title: 'Formato inválido',
                text: 'El teléfono solo debe contener números',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (password.length < 8) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Contraseña demasiado corta', {
                password_length: password.length
            });
            Swal.fire({
                icon: 'warning',
                title: 'Contraseña débil',
                text: 'La contraseña debe tener al menos 8 caracteres',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (password !== password_confirm) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Las contraseñas no coinciden');
            Swal.fire({
                icon: 'warning',
                title: 'Contraseñas no coinciden',
                text: 'Las contraseñas no coinciden',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        if (passwordStrength.strength < 3) {
            errorCapture.logWarning('Register', 'VALIDATION_FAILED', 'Contraseña muy débil', {
                strength: passwordStrength.strength,
                required_minimum: 3
            });
            Swal.fire({
                icon: 'warning',
                title: 'Contraseña muy débil',
                text: 'La contraseña debe contener al menos 8 caracteres, mayúsculas, minúsculas y números',
                confirmButtonColor: '#2f7a7a'
            });
            return false;
        }

        errorCapture.logAction('Register', 'VALIDATION_SUCCESS', 'Formulario validado correctamente');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        errorCapture.logAction('Register', 'REGISTER_ATTEMPT', 'Intento de registro', {
            identificacion: formData.identificacion
        });

        if (!validateForm()) return;

        setLoading(true);
        const startTime = Date.now();

        const submitData = {
            username: formData.identificacion,
            first_name: formData.first_name,
            last_name: formData.last_name,
            identificacion: formData.identificacion,
            telefono: formData.telefono,
            sexo: formData.sexo,
            departamento: formData.departamento,
            ciudad: formData.ciudad,
            password: formData.password,
            password_confirm: formData.password_confirm
        };

        try {
            errorCapture.logAction('Register', 'API_CALL_START', 'Llamando a API de registro', {
                endpoint: '/api/register/',
                method: 'POST'
            });

            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
                errorCapture.logAction('Register', 'REGISTER_SUCCESS', 'Registro exitoso', {
                    identificacion: formData.identificacion,
                    user_id: data.user?.id,
                    rol: data.user?.rol,
                    duration_ms: duration,
                    departamento: formData.departamento,
                    ciudad: formData.ciudad
                });

                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                const fullName = `${data.user.first_name} ${data.user.last_name}`;

                await Swal.fire({
                    icon: 'success',
                    title: '¡Registro exitoso!',
                    html: `<div style="text-align: center;">
            <p>Tu cuenta ha sido creada correctamente.</p>
            <div style="background: #eef6f5; padding: 12px; border-radius: 8px; margin-top: 10px;">
              <strong style="color: #2f7a7a;">Usuario:</strong><br>
              <span style="font-weight: 600;">${fullName}</span>
            </div>
          </div>`,
                    confirmButtonColor: '#2f7a7a',
                    timer: 2500,
                    showConfirmButton: false
                });

                errorCapture.logAction('Register', 'REDIRECT', 'Redirigiendo a dashboard');
                navigate('/dashboard');
            } else {
                let errorMsg = 'Error en el registro';
                let errorType = 'unknown';
                
                if (response.status >= 500) {
                    errorMsg = 'Error del servidor. Por favor, intente más tarde.';
                    errorType = 'server_error';
                } else if (data.identificacion) {
                    errorMsg = 'El número de identificación ya está registrado';
                    errorType = 'duplicate_identification';
                } else if (data.username) {
                    errorMsg = 'El nombre de usuario ya está en uso';
                    errorType = 'duplicate_username';
                } else if (data.non_field_errors) {
                    errorMsg = data.non_field_errors[0];
                    errorType = 'validation_error';
                } else {
                    errorMsg = data.error || 'Error en el registro. Verifica los datos ingresados.';
                    errorType = 'unknown';
                }

                errorCapture.logWarning('Register', 'REGISTER_FAILED', 'Registro fallido', {
                    identificacion: formData.identificacion,
                    status: response.status,
                    error: errorMsg,
                    error_type: errorType,
                    duration_ms: duration
                });

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonColor: '#d9534f'
                });
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            errorCapture.logError('Register', 'CONNECTION_ERROR', 'Error de conexión en registro', {
                error_message: error.message,
                error_stack: error.stack,
                duration_ms: duration,
                identificacion: formData.identificacion
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
        errorCapture.logAction('Register', 'BACK_TO_HOME', 'Usuario regresa a la página principal');
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
                        <h2>Crear cuenta</h2>
                        <div className="auth-header-wave">
                            <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                                <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="auth-body">
                        <form onSubmit={handleSubmit} className="auth-form" noValidate>
                            <div className="form-row">
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="person-outline" className="input-icon"></ion-icon>
                                        <input
                                            type="text"
                                            id="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo nombre enfocado')}
                                        />
                                        <label htmlFor="first_name">Nombre</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-first_name"></div>
                                    </div>
                                </div>
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="person-outline" className="input-icon"></ion-icon>
                                        <input
                                            type="text"
                                            id="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo apellido enfocado')}
                                        />
                                        <label htmlFor="last_name">Apellido</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-last_name"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="card-outline" className="input-icon"></ion-icon>
                                    <input
                                        type="text"
                                        id="identificacion"
                                        value={formData.identificacion}
                                        onChange={handleChange}
                                        placeholder=" "
                                        required
                                        onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo identificación enfocado')}
                                    />
                                    <label htmlFor="identificacion">Número de Identificación</label>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-identificacion"></div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="call-outline" className="input-icon"></ion-icon>
                                        <input
                                            type="tel"
                                            id="telefono"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo teléfono enfocado')}
                                        />
                                        <label htmlFor="telefono">Teléfono</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-telefono"></div>
                                    </div>
                                </div>
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="male-female-outline" className="input-icon"></ion-icon>
                                        <select
                                            id="sexo"
                                            value={formData.sexo}
                                            onChange={handleChange}
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo sexo enfocado')}
                                        >
                                            <option value="" disabled selected> </option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                        <label htmlFor="sexo">Sexo</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-sexo"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="map-outline" className="input-icon"></ion-icon>
                                    <select
                                        id="departamento"
                                        value={formData.departamento}
                                        onChange={handleDepartamentoChange}
                                        required
                                        disabled={!departamentosCargados}
                                        onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo departamento enfocado')}
                                    >
                                        <option value="" disabled selected> </option>
                                        {departamentos.map((depto) => (
                                            <option key={depto.id} value={depto.departamento}>
                                                {depto.departamento}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="departamento">Departamento</label>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-departamento"></div>
                                </div>
                            </div>

                            <div className="form-group floating">
                                <div className="input-icon-wrapper">
                                    <ion-icon name="location-outline" className="input-icon"></ion-icon>
                                    <select
                                        id="ciudad"
                                        value={formData.ciudad}
                                        onChange={handleChange}
                                        required
                                        disabled={!formData.departamento || ciudades.length === 0}
                                        onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo ciudad enfocado')}
                                    >
                                        <option value="" disabled selected> </option>
                                        {ciudades.map((ciudad, idx) => (
                                            <option key={idx} value={ciudad}>
                                                {ciudad}
                                            </option>
                                        ))}
                                    </select>
                                    <label htmlFor="ciudad">Ciudad / Municipio</label>
                                </div>
                                <div className="error-message-container">
                                    <div className="error-message" id="error-ciudad"></div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                        <input
                                            type="password"
                                            id="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo contraseña enfocado')}
                                        />
                                        <label htmlFor="password">Contraseña</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-password"></div>
                                    </div>
                                </div>
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                        <input
                                            type="password"
                                            id="password_confirm"
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            onFocus={() => errorCapture.logAction('Register', 'FIELD_FOCUS', 'Campo confirmar contraseña enfocado')}
                                        />
                                        <label htmlFor="password_confirm">Confirmar Contraseña</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message" id="error-password_confirm"></div>
                                    </div>
                                </div>
                            </div>

                            {formData.password && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className={`strength-segment ${i < passwordStrength.strength ? 'active' : ''}`}
                                            ></div>
                                        ))}
                                    </div>
                                    <div className={`strength-text ${passwordStrength.class}`}>
                                        {passwordStrength.text}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="auth-btn" 
                                disabled={loading}
                                onClick={() => errorCapture.logAction('Register', 'SUBMIT_BUTTON_CLICK', 'Botón de registro presionado')}
                            >
                                <span id="btnText">{loading ? 'Registrando...' : 'Registrarse'}</span>
                                {loading && <div className="btn-loader"></div>}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿Ya tienes una cuenta? 
                                <Link 
                                    to="/login"
                                    onClick={() => errorCapture.logAction('Register', 'LOGIN_LINK_CLICK', 'Click en enlace de inicio de sesión')}
                                >
                                    Inicia sesión aquí
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

export default Register;