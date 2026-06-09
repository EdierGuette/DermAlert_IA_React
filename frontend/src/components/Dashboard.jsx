import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/styles/dashboard.css';
import '../css/styles/global.css';
import '../css/styles/logout.css';

// Importar componentes del dashboard
import Sidebar from './Sidebar';
import Inicio from './Inicio';
import Diagnostico from './Diagnostico';
import Resultados from './Resultados';
import Historial from './Historial';

function Dashboard() {
    const [activeView, setActiveView] = useState('home');
    const [user, setUser] = useState(null);
    const [hasDiagnostics, setHasDiagnostics] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar autenticación
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            navigate('/login');
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        }

        // Verificar si hay diagnósticos
        checkDiagnostics();

        // Verificar cookie para abrir diagnóstico automáticamente
        checkDiagnosticCookie();
    }, [navigate]);

    const checkDiagnostics = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/diagnosticos/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.ok) {
                const diagnosticos = await response.json();
                setHasDiagnostics(diagnosticos && diagnosticos.length > 0);
            } else if (response.status === 401) {
                handleSessionExpired();
            }
        } catch (error) {
            console.error('Error checking diagnostics:', error);
        }
    };

    const handleSessionExpired = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            confirmButtonColor: '#2f7a7a'
        }).then(() => {
            navigate('/login');
        });
    };

    const checkDiagnosticCookie = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'open_diagnostico' && value === 'true') {
                document.cookie = 'open_diagnostico=; max-age=0; path=/';
                setActiveView('diagnose');
                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: 'Has sido redirigido directamente a la sección de diagnóstico. ¡Comienza tu análisis ahora!',
                    confirmButtonColor: '#2f7a7a',
                    timer: 4000,
                    showConfirmButton: false
                });
                break;
            }
        }
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: "¿Estás seguro de que deseas salir de tu cuenta?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d9534f',
            cancelButtonColor: '#2f7a7a',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            const token = localStorage.getItem('token');
            try {
                await fetch('/api/logout/', {
                    method: 'POST',
                    headers: { 'Authorization': `Token ${token}` }
                });
            } catch (error) {
                console.error('Error en logout:', error);
            }

            localStorage.removeItem('token');
            localStorage.removeItem('user');

            await Swal.fire({
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente',
                icon: 'success',
                confirmButtonColor: '#2f7a7a',
                timer: 2000,
                showConfirmButton: false
            });

            navigate('/');
        }
    };

    const showNoResultsAlert = () => {
        Swal.fire({
            icon: 'info',
            title: 'Resultados no disponibles',
            text: 'Aún no hay ningún resultado disponible. Realiza tu primer diagnóstico para ver los resultados.',
            confirmButtonText: 'Ir a Diagnóstico',
            confirmButtonColor: '#2f7a7a'
        }).then((result) => {
            if (result.isConfirmed) {
                setActiveView('diagnose');
            }
        });
    };

    const handleViewChange = (view) => {
        if (view === 'results' && !hasDiagnostics) {
            showNoResultsAlert();
            return;
        }
        setActiveView(view);
    };

    // Función para habilitar resultados después de un diagnóstico
    const enableResultsButton = () => {
        setHasDiagnostics(true);
        Swal.fire({
            icon: "success",
            title: "✅ Análisis completado",
            text: "Los resultados están disponibles en la gráfica.",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#2f7a7a",
            timer: 3000
        });
    };

    if (!user) {
        return <div className="loading-container">Cargando...</div>;
    }

    return (
        <div className="app">
            <Sidebar
                user={user}
                activeView={activeView}
                onViewChange={handleViewChange}
                onLogout={handleLogout}
            />

            <main className="main">
                {activeView === 'home' && <Inicio />}
                {activeView === 'diagnose' && (
                    <Diagnostico
                        onDiagnosisComplete={enableResultsButton}
                        hasDiagnostics={hasDiagnostics}
                    />
                )}
                {activeView === 'results' && <Resultados />}
                {activeView === 'history' && <Historial />}
            </main>
        </div>
    );
}

export default Dashboard;