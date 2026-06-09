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
  const navigate = useNavigate();

  // Log de montaje/desmontaje
  useEffect(() => {
    errorCapture.logAction('Dashboard', 'MOUNT', 'Dashboard montado');
    return () => {
      errorCapture.logAction('Dashboard', 'UNMOUNT', 'Dashboard desmontado');
    };
  }, []);

  // 🔥 EXPONER la función para cambiar vista (para que Resultados.jsx la use)
  window.changeView = (view) => {
    errorCapture.logAction('Dashboard', 'CHANGE_VIEW_EXTERNAL', `Cambio de vista externo a: ${view}`);
    setActiveView(view);
  };

  useEffect(() => {
    errorCapture.logAction('Dashboard', 'INIT', 'Inicializando Dashboard');
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    errorCapture.logAction('Dashboard', 'AUTH_CHECK', 'Verificando autenticación', {
      hasToken: !!token,
      hasUserData: !!userData
    });
    
    if (!token || !userData) {
      errorCapture.logWarning('Dashboard', 'AUTH_FAILED', 'No hay token o userData, redirigiendo a login');
      navigate('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      errorCapture.logAction('Dashboard', 'USER_SET', 'Usuario cargado correctamente', {
        usuario_id: parsedUser.id,
        identificacion: parsedUser.identificacion,
        rol: parsedUser.rol,
        nombre: `${parsedUser.first_name} ${parsedUser.last_name}`
      });
    } catch (e) {
      errorCapture.logError('Dashboard', 'PARSE_USER_ERROR', 'Error al parsear userData', {
        error: e.message,
        userData: userData
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    }
    
    checkDiagnostics();
    checkDiagnosticCookie();
  }, [navigate]);

  const checkDiagnostics = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      errorCapture.logWarning('Dashboard', 'CHECK_DIAGNOSTICS', 'No hay token para verificar diagnósticos');
      return;
    }
    
    errorCapture.logAction('Dashboard', 'CHECK_DIAGNOSTICS_START', 'Verificando existencia de diagnósticos');
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/diagnosticos/', {
        headers: { 'Authorization': `Token ${token}` }
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
      } else if (response.status === 401) {
        errorCapture.logWarning('Dashboard', 'SESSION_EXPIRED', 'Sesión expirada al verificar diagnósticos');
        handleSessionExpired();
      }
    } catch (error) {
      errorCapture.logError('Dashboard', 'CHECK_DIAGNOSTICS_ERROR', 'Error al verificar diagnósticos', {
        error_message: error.message,
        error_stack: error.stack
      });
    }
  };
  
  const handleSessionExpired = () => {
    errorCapture.logAction('Dashboard', 'SESSION_EXPIRED', 'Manejando sesión expirada');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    Swal.fire({
      icon: 'warning',
      title: 'Sesión expirada',
      text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      confirmButtonColor: '#2f7a7a'
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
      const startTime = Date.now();
      
      try {
        await fetch('/api/logout/', {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}` }
        });
        
        const duration = Date.now() - startTime;
        errorCapture.logAction('Dashboard', 'LOGOUT_API_SUCCESS', 'API de logout exitosa', {
          duration_ms: duration
        });
      } catch (error) {
        errorCapture.logError('Dashboard', 'LOGOUT_API_ERROR', 'Error en API de logout', {
          error_message: error.message
        });
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
    } else {
      errorCapture.logAction('Dashboard', 'LOGOUT_CANCELLED', 'Usuario canceló cierre de sesión');
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
  
  // 🔧 FUNCIÓN CORREGIDA
  const handleViewChange = (view) => {
    errorCapture.logAction('Dashboard', 'NAVIGATION', `Cambiando vista de ${activeView} a ${view}`, {
      from_view: activeView,
      to_view: view,
      has_diagnostics: hasDiagnostics
    });
    
    if (view === 'results' && !hasDiagnostics) {
      errorCapture.logWarning('Dashboard', 'RESULTS_BLOCKED', 'Bloqueado acceso a resultados sin diagnósticos', {
        from_view: activeView,
        to_view: view,
        has_diagnostics: hasDiagnostics
      });
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
  
  if (!user) {
    errorCapture.logAction('Dashboard', 'LOADING', 'Mostrando pantalla de carga mientras se carga usuario');
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