import React, { useEffect } from 'react';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Sidebar({ user, activeView, onViewChange, onLogout }) {
    
    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Sidebar', 'MOUNT', 'Sidebar montada', {
            user_rol: user?.rol,
            user_name: user?.first_name
        });
        return () => {
            errorCapture.logAction('Sidebar', 'UNMOUNT', 'Sidebar desmontada');
        };
    }, [user]);

    // Log de cambios de usuario (solo cuando se actualiza)
    useEffect(() => {
        if (user) {
            errorCapture.logAction('Sidebar', 'USER_INFO', 'Información de usuario cargada', {
                rol: user?.rol,
                nombre_completo: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
                identificacion: user?.identificacion
            });
        }
    }, [user]);

    const menuItems = [
        { id: 'home', name: 'Inicio', icon: 'home-outline' },
        { id: 'diagnose', name: 'Diagnóstico', icon: 'camera-outline' },
        { id: 'results', name: 'Resultados', icon: 'bar-chart-outline' },
        { id: 'history', name: 'Historial', icon: 'time-outline' }
    ];

    // Obtener el rol del usuario con primera letra mayúscula
    const userRole = user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Usuario';
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Usuario';

    const handleViewChange = (viewId, viewName) => {
        errorCapture.logAction('Sidebar', 'MENU_CLICK', `Click en menú: ${viewName}`, {
            from_view: activeView,
            to_view: viewId,
            view_name: viewName,
            user_rol: user?.rol
        });
        onViewChange(viewId);
    };

    const handleLogout = () => {
        errorCapture.logAction('Sidebar', 'LOGOUT_CLICK', 'Click en botón de cerrar sesión', {
            user_name: userName,
            user_rol: user?.rol
        });
        onLogout();
    };

    return (
        <aside className="sidebar" id="sidebar">
            <div className="brand">
                <div className="brand-logo">
                    <ion-icon name="medical-outline"></ion-icon>
                </div>
                <div>DermAlert IA</div>
            </div>

            <div className="user-info" id="userInfo">
                <div className="user-role" id="userRole">{userRole}</div>
                <div className="user-name" id="userName">{userName}</div>
            </div>

            <nav className="menu">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`menu-btn ${activeView === item.id ? 'active' : ''}`}
                        onClick={() => handleViewChange(item.id, item.name)}
                        onMouseEnter={() => errorCapture.logAction('Sidebar', 'MENU_HOVER', `Hover en menú: ${item.name}`, {
                            view_name: item.name
                        })}
                    >
                        <ion-icon name={item.icon} className="menu-icon"></ion-icon>
                        <span className="menu-text">{item.name}</span>
                    </button>
                ))}
            </nav>

            <div className="logout-container">
                <button 
                    className="menu-btn logout-btn" 
                    id="logoutBtn" 
                    onClick={handleLogout}
                    onMouseEnter={() => errorCapture.logAction('Sidebar', 'LOGOUT_HOVER', 'Hover en botón de cerrar sesión')}
                >
                    <ion-icon name="log-out-outline" className="logout-icon"></ion-icon>
                    <span className="menu-text">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;