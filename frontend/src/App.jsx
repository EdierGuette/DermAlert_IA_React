import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import QRLanding from './components/QRLanding';
import { loadConfig, getProjectNameSync } from './services/config';
import errorCapture from './services/errorCapture';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        errorCapture.logAction('App', 'PROTECTED_ROUTE', 'Acceso denegado a ruta protegida, redirigiendo a login');
        return <Navigate to="/login" />;
    }
    return children;
};

function App() {
    const [configLoaded, setConfigLoaded] = useState(false);
    const [configError, setConfigError] = useState(false);

    useEffect(() => {
        // Cargar configuración global al iniciar la app
        const initConfig = async () => {
            errorCapture.logAction('App', 'INIT_START', 'Iniciando carga de configuración global');
            try {
                const config = await loadConfig();
                // Actualizar el título de la página
                document.title = `${config.PROJECT_NAME}`;
                setConfigLoaded(true);
                setConfigError(false);
                errorCapture.logAction('App', 'INIT_SUCCESS', 'Configuración global cargada correctamente', {
                    project_name: config.PROJECT_NAME,
                    app_version: config.APP_VERSION,
                    title: document.title
                });
            } catch (error) {
                errorCapture.logError('App', 'INIT_ERROR', 'Error cargando configuración global', {
                    error_message: error.message
                });
                setConfigError(true);
                // Aún así permitimos que la app cargue con valores por defecto
                setConfigLoaded(true);
                // Título por defecto
                document.title = 'DermAlert IA - Detección temprana de cáncer de piel';
            }
        };

        initConfig();
    }, []);

    // Mostrar pantalla de carga mientras se carga la configuración
    if (!configLoaded) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontFamily: 'sans-serif',
                color: '#2f7a7a'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #eef6f5',
                        borderTop: '4px solid #2f7a7a',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p>Cargando {getProjectNameSync()}...</p>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/qr-diagnostico/" element={<QRLanding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/dashboard/*"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;