import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/auth.css';
import '../css/styles/global.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getLogoIconSync, getAppVersionSync } from '../services/config';

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

    // Estados para errores en tiempo real
    const [errors, setErrors] = useState({
        first_name: '',
        last_name: '',
        identificacion: '',
        telefono: '',
        password: '',
        password_confirm: ''
    });

    const [departamentos, setDepartamentos] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [departamentosCargados, setDepartamentosCargados] = useState(false);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '', class: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const projectName = getProjectNameSync();
    const logoIcon = getLogoIconSync();
    const appVersion = getAppVersionSync();

    useEffect(() => {
        errorCapture.logAction('Register', 'MOUNT', 'Página de registro montada', {
            project_name: projectName,
            app_version: appVersion
        });
        return () => {
            errorCapture.logAction('Register', 'UNMOUNT', 'Página de registro desmontada');
        };
    }, [projectName, appVersion]);

    // Validaciones en tiempo real
    const validateNombre = (value) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, first_name: '' }));
            return true;
        }
        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
            setErrors(prev => ({ ...prev, first_name: '' }));
            return true;
        } else {
            setErrors(prev => ({ ...prev, first_name: 'Solo letras' }));
            return false;
        }
    };

    const validateApellido = (value) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, last_name: '' }));
            return true;
        }
        if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
            setErrors(prev => ({ ...prev, last_name: '' }));
            return true;
        } else {
            setErrors(prev => ({ ...prev, last_name: 'Solo letras' }));
            return false;
        }
    };

    const validateIdentificacion = (value) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, identificacion: '' }));
            return true;
        }
        if (/^[0-9]+$/.test(value)) {
            setErrors(prev => ({ ...prev, identificacion: '' }));
            return true;
        } else {
            setErrors(prev => ({ ...prev, identificacion: 'Solo números' }));
            return false;
        }
    };

    const validateTelefono = (value) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, telefono: '' }));
            return true;
        }
        if (/^[0-9]+$/.test(value)) {
            setErrors(prev => ({ ...prev, telefono: '' }));
            return true;
        } else {
            setErrors(prev => ({ ...prev, telefono: 'Solo números' }));
            return false;
        }
    };

    const validatePassword = (value) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, password: '' }));
            return true;
        }
        if (value.length < 8) {
            setErrors(prev => ({ ...prev, password: 'Mínimo 8 caracteres' }));
            return false;
        } else {
            setErrors(prev => ({ ...prev, password: '' }));
            return true;
        }
    };

    const validatePasswordConfirm = (value, passwordValue) => {
        if (value === '') {
            setErrors(prev => ({ ...prev, password_confirm: '' }));
            return true;
        }
        if (value !== passwordValue) {
            setErrors(prev => ({ ...prev, password_confirm: 'No coinciden' }));
            return false;
        } else {
            setErrors(prev => ({ ...prev, password_confirm: '' }));
            return true;
        }
    };

    const handleChange = (e) => {
        const { id, value } = e.target;
        
        setFormData(prev => ({ ...prev, [id]: value }));

        switch (id) {
            case 'first_name':
                validateNombre(value);
                break;
            case 'last_name':
                validateApellido(value);
                break;
            case 'identificacion':
                validateIdentificacion(value);
                break;
            case 'telefono':
                validateTelefono(value);
                break;
            case 'password':
                validatePassword(value);
                checkPasswordStrength(value);
                if (formData.password_confirm) {
                    validatePasswordConfirm(formData.password_confirm, value);
                }
                break;
            case 'password_confirm':
                validatePasswordConfirm(value, formData.password);
                break;
            default:
                break;
        }

        errorCapture.logAction('Register', 'FIELD_CHANGE', `Campo ${id} modificado`);
    };

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
    };

    const handleDepartamentoChange = (e) => {
        const deptoNombre = e.target.value;
        setFormData({ ...formData, departamento: deptoNombre, ciudad: '' });

        const deptoObj = departamentos.find(d => d.departamento === deptoNombre);
        if (deptoObj && deptoObj.ciudades) {
            const ciudadesOrdenadas = [...deptoObj.ciudades].sort((a, b) =>
                a.localeCompare(b, 'es')
            );
            setCiudades(ciudadesOrdenadas);
        } else {
            setCiudades([]);
        }
    };

    // Cargar departamentos
    useEffect(() => {
        const cargarDepartamentos = async () => {
            try {
                const response = await fetch('/data/colombia.json');
                const data = await response.json();
                const ordenados = [...data].sort((a, b) =>
                    a.departamento.localeCompare(b.departamento, 'es')
                );
                setDepartamentos(ordenados);
                setDepartamentosCargados(true);
            } catch (error) {
                errorCapture.logError('Register', 'LOAD_DEPARTMENTS_ERROR', 'Error cargando departamentos');
            }
        };
        cargarDepartamentos();
    }, []);

    // Verificar si hay campos vacíos
    const hasEmptyFields = () => {
        const { first_name, last_name, identificacion, telefono, sexo, departamento, ciudad, password, password_confirm } = formData;
        return !first_name || !last_name || !identificacion || !telefono || !sexo || !departamento || !ciudad || !password || !password_confirm;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // SweetAlert para campos vacíos
        if (hasEmptyFields()) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: 'Completa todos los campos',
                confirmButtonColor: '#2f7a7a',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        // Validar que no haya errores en los campos
        if (errors.first_name || errors.last_name || errors.identificacion || errors.telefono || errors.password || errors.password_confirm) {
            Swal.fire({
                icon: 'warning',
                title: 'Errores en el formulario',
                text: 'Corrige los errores antes de continuar',
                confirmButtonColor: '#2f7a7a',
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        // Validar fortaleza de contraseña
        if (passwordStrength.strength < 3) {
            Swal.fire({
                icon: 'warning',
                title: 'Contraseña débil',
                text: 'Mínimo 8 caracteres, mayúsculas, minúsculas y números',
                confirmButtonColor: '#2f7a7a',
                timer: 2500,
                timerProgressBar: true,
                showConfirmButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            return;
        }

        setLoading(true);

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
            const response = await fetch('/api/register/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            });

            const data = await response.json();

        if (response.ok) {
            // Guardar token y usuario
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
                    <p style="margin-top: 15px; font-size: 14px;">Ahora puedes iniciar sesión con tus credenciales.</p>
                </div>`,
                confirmButtonColor: '#2f7a7a',
                timer: 3000,
                showConfirmButton: false
            });

            navigate('/login');  // ← REDIRIGIR AL LOGIN
        } else {
                let errorMsg = 'Error en el registro';
                if (data.identificacion) {
                    errorMsg = 'El número de identificación ya está registrado';
                } else if (data.username) {
                    errorMsg = 'El número de identificación ya está registrado';
                } else {
                    errorMsg = data.error || 'Error en el registro. Verifica los datos ingresados.';
                }

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMsg,
                    confirmButtonColor: '#d9534f',
                    confirmButtonText: 'Entendido'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                confirmButtonColor: '#d9534f',
                confirmButtonText: 'Entendido'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBackToHome = () => {
        errorCapture.logAction('Register', 'BACK_TO_HOME', 'Usuario regresa a la página principal');
    };

    const handleMouseDownPassword = () => setShowPassword(true);
    const handleMouseUpPassword = () => setShowPassword(false);
    const handleMouseLeavePassword = () => setShowPassword(false);

    const handleMouseDownConfirm = () => setShowConfirmPassword(true);
    const handleMouseUpConfirm = () => setShowConfirmPassword(false);
    const handleMouseLeaveConfirm = () => setShowConfirmPassword(false);

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
                                            className={errors.first_name ? 'error' : ''}
                                        />
                                        <label htmlFor="first_name">Nombre</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className={`error-message ${errors.first_name ? '' : 'hidden'}`}>
                                            {errors.first_name}
                                        </div>
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
                                            className={errors.last_name ? 'error' : ''}
                                        />
                                        <label htmlFor="last_name">Apellido</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className={`error-message ${errors.last_name ? '' : 'hidden'}`}>
                                            {errors.last_name}
                                        </div>
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
                                        className={errors.identificacion ? 'error' : ''}
                                    />
                                    <label htmlFor="identificacion">Número de Identificación</label>
                                </div>
                                <div className="error-message-container">
                                    <div className={`error-message ${errors.identificacion ? '' : 'hidden'}`}>
                                        {errors.identificacion}
                                    </div>
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
                                            className={errors.telefono ? 'error' : ''}
                                        />
                                        <label htmlFor="telefono">Teléfono</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className={`error-message ${errors.telefono ? '' : 'hidden'}`}>
                                            {errors.telefono}
                                        </div>
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
                                        >
                                            <option value="" disabled selected> </option>
                                            <option value="masculino">Masculino</option>
                                            <option value="femenino">Femenino</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                        <label htmlFor="sexo">Sexo</label>
                                    </div>
                                    <div className="error-message-container">
                                        <div className="error-message hidden"></div>
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
                                    <div className="error-message hidden"></div>
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
                                    <div className="error-message hidden"></div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            id="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            className={errors.password ? 'error' : ''}
                                        />
                                        <label htmlFor="password">Contraseña</label>
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onMouseDown={handleMouseDownPassword}
                                            onMouseUp={handleMouseUpPassword}
                                            onMouseLeave={handleMouseLeavePassword}
                                            onTouchStart={handleMouseDownPassword}
                                            onTouchEnd={handleMouseUpPassword}
                                            onTouchCancel={handleMouseLeavePassword}
                                        >
                                            <ion-icon name={showPassword ? "eye-off-outline" : "eye-outline"}></ion-icon>
                                        </button>
                                    </div>
                                    <div className="error-message-container">
                                        <div className={`error-message ${errors.password ? '' : 'hidden'}`}>
                                            {errors.password}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group floating">
                                    <div className="input-icon-wrapper">
                                        <ion-icon name="lock-closed-outline" className="input-icon"></ion-icon>
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            id="password_confirm"
                                            value={formData.password_confirm}
                                            onChange={handleChange}
                                            placeholder=" "
                                            required
                                            className={errors.password_confirm ? 'error' : ''}
                                        />
                                        <label htmlFor="password_confirm">Confirmar Contraseña</label>
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onMouseDown={handleMouseDownConfirm}
                                            onMouseUp={handleMouseUpConfirm}
                                            onMouseLeave={handleMouseLeaveConfirm}
                                            onTouchStart={handleMouseDownConfirm}
                                            onTouchEnd={handleMouseUpConfirm}
                                            onTouchCancel={handleMouseLeaveConfirm}
                                        >
                                            <ion-icon name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}></ion-icon>
                                        </button>
                                    </div>
                                    <div className="error-message-container">
                                        <div className={`error-message ${errors.password_confirm ? '' : 'hidden'}`}>
                                            {errors.password_confirm}
                                        </div>
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
                            >
                                <span>{loading ? 'Registrando...' : 'Registrarse'}</span>
                                {loading && <div className="btn-loader"></div>}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>¿Ya tienes una cuenta? &nbsp;
                                <Link to="/login">
                                    Inicia sesión aquí
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

export default Register;