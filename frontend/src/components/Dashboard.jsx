import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Sidebar from './Sidebar';
import Inicio from './Inicio';
import Diagnostico from './Diagnostico';
import Resultados from './Resultados';
import Historial from './Historial';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Dashboard() {
  const [activeView, setActiveView] = useState('home');
  const [user, setUser] = useState(null);
  const [hasDiagnostics, setHasDiagnostics] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    errorCapture.logAction('Dashboard', 'MOUNT', 'Dashboard montado');
    return () => {
      errorCapture.logAction('Dashboard', 'UNMOUNT', 'Dashboard desmontado');
    };
  }, []);

  window.changeView = (view) => {
    errorCapture.logAction('Dashboard', 'CHANGE_VIEW_EXTERNAL', `Cambio de vista externo a: ${view}`);
    setActiveView(view);
  };

  const checkDiagnostics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      errorCapture.logWarning('Dashboard', 'CHECK_DIAGNOSTICS', 'No hay token para verificar diagnósticos');
      return false;
    }
    
    errorCapture.logAction('Dashboard', 'CHECK_DIAGNOSTICS_START', 'Verificando existencia de diagnósticos');
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/diagnosticos/', {
        headers: { 
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const diagnosticos = await response.json();
        const hasDiag = diagnosticos && diagnosticos.length > 0;
        setHasDiagnostics(hasDiag);
        
        errorCapture.logAction('Dashboard', 'CHECK_DIAGNOSTICS_SUCCESS', 'Diagnósticos verificados', {
          cantidad: diagnosticos?.length || 0,
          tiene_diagnosticos: hasDiag,
          duration_ms: duration
        });
        return hasDiag;
      } else if (response.status === 401) {
        errorCapture.logWarning('Dashboard', 'TOKEN_INVALID', 'Token inválido o expirado');
        return false;
      }
    } catch (error) {
      errorCapture.logError('Dashboard', 'CHECK_DIAGNOSTICS_ERROR', 'Error al verificar diagnósticos', {
        error_message: error.message
      });
    }
    return false;
  };
  
  const handleSessionExpired = () => {
    errorCapture.logAction('Dashboard', 'SESSION_EXPIRED', 'Manejando sesión expirada');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Swal.fire({
      icon: 'warning',
      title: 'Sesión expirada',
      text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      confirmButtonColor: '#2f7a7a',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      errorCapture.logAction('Dashboard', 'REDIRECT_LOGIN', 'Redirigiendo a login por sesión expirada');
      navigate('/login');
    });
  };
  
  const checkDiagnosticCookie = () => {
    errorCapture.logAction('Dashboard', 'CHECK_COOKIE', 'Verificando cookie open_diagnostico');
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'open_diagnostico' && value === 'true') {
        errorCapture.logAction('Dashboard', 'COOKIE_FOUND', 'Cookie open_diagnostico encontrada, abriendo diagnóstico');
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
    errorCapture.logAction('Dashboard', 'LOGOUT_ATTEMPT', 'Intentando cerrar sesión', {
      usuario_id: user?.id,
      identificacion: user?.identificacion
    });
    
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
      errorCapture.logAction('Dashboard', 'LOGOUT_CONFIRMED', 'Usuario confirmó cierre de sesión');
      
      const token = localStorage.getItem('token');
      
      try {
        if (token) {
          await fetch('/api/logout/', {
            method: 'POST',
            headers: { 'Authorization': `Token ${token}` }
          });
        }
      } catch (error) {
        errorCapture.logError('Dashboard', 'LOGOUT_API_ERROR', 'Error en API de logout');
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      errorCapture.logAction('Dashboard', 'LOGOUT_SUCCESS', 'Sesión cerrada correctamente');
      
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
    errorCapture.logWarning('Dashboard', 'NO_RESULTS_ALERT', 'Usuario intentó ver resultados sin diagnósticos');
    
    Swal.fire({
      icon: 'info',
      title: 'Resultados no disponibles',
      text: 'Aún no hay ningún resultado disponible. Realiza tu primer diagnóstico para ver los resultados.',
      confirmButtonText: 'Ir a Diagnóstico',
      confirmButtonColor: '#2f7a7a'
    }).then((result) => {
      if (result.isConfirmed) {
        errorCapture.logAction('Dashboard', 'NO_RESULTS_REDIRECT', 'Redirigiendo a diagnóstico desde alerta');
        setActiveView('diagnose');
      }
    });
  };
  
  const handleViewChange = (view) => {
    errorCapture.logAction('Dashboard', 'NAVIGATION', `Cambiando vista de ${activeView} a ${view}`);
    
    if (view === 'results' && !hasDiagnostics) {
      errorCapture.logWarning('Dashboard', 'RESULTS_BLOCKED', 'Bloqueado acceso a resultados sin diagnósticos');
      showNoResultsAlert();
      return;
    }
    
    setActiveView(view);
  };
  
  const enableResultsButton = () => {
    errorCapture.logAction('Dashboard', 'RESULTS_ENABLED', 'Habilitando botón de resultados después de diagnóstico');
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

  // Efecto principal
  useEffect(() => {
    const initDashboard = async () => {
      errorCapture.logAction('Dashboard', 'INIT', 'Inicializando Dashboard');
      
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      errorCapture.logAction('Dashboard', 'AUTH_CHECK', 'Verificando autenticación', {
        hasToken: !!token,
        hasUserData: !!userData
      });
      
      if (!token || !userData) {
        errorCapture.logWarning('Dashboard', 'AUTH_FAILED', 'No hay token o userData');
        setIsLoading(false);
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        errorCapture.logAction('Dashboard', 'USER_SET', 'Usuario cargado correctamente', {
          usuario_id: parsedUser.id,
          identificacion: parsedUser.identificacion,
          rol: parsedUser.rol
        });
        
        await checkDiagnostics();
        setIsLoading(false);
        
      } catch (e) {
        errorCapture.logError('Dashboard', 'PARSE_USER_ERROR', 'Error al parsear userData', {
          error: e.message
        });
        setIsLoading(false);
      }
      
      checkDiagnosticCookie();
    };
    
    initDashboard();
  }, []);

  // Si no hay usuario después de cargar, redirigir a login
  useEffect(() => {
    if (!isLoading && !user) {
      errorCapture.logAction('Dashboard', 'NO_USER_REDIRECT', 'No hay usuario, redirigiendo a login');
      navigate('/login');
    }
  }, [isLoading, user, navigate]);

  if (isLoading) {
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
          <p>Cargando dashboard...</p>
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
  
  if (!user) {
    return null;
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
        <div style={{ display: activeView === 'home' ? 'block' : 'none' }}>
          <Inicio />
        </div>
        <div style={{ display: activeView === 'diagnose' ? 'block' : 'none' }}>
          <Diagnostico 
            onDiagnosisComplete={enableResultsButton}
            hasDiagnostics={hasDiagnostics}
          />
        </div>
        <div style={{ display: activeView === 'results' ? 'block' : 'none' }}>
          <Resultados />
        </div>
        <div style={{ display: activeView === 'history' ? 'block' : 'none' }}>
          <Historial onViewChange={setActiveView} />
        </div>
      </main>
    </div>
  );
}

export default Dashboard;