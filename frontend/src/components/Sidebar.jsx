import React from 'react';

function Sidebar({ user, activeView, onViewChange, onLogout }) {
    const menuItems = [
        { id: 'home', name: 'Inicio', icon: 'home-outline' },
        { id: 'diagnose', name: 'Diagnóstico', icon: 'camera-outline' },
        { id: 'results', name: 'Resultados', icon: 'bar-chart-outline' },
        { id: 'history', name: 'Historial', icon: 'time-outline' }
    ];

    // Obtener el rol del usuario con primera letra mayúscula
    const userRole = user?.rol ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1) : 'Usuario';
    const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Usuario';

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
                        onClick={() => onViewChange(item.id)}
                    >
                        <ion-icon name={item.icon} className="menu-icon"></ion-icon>
                        <span className="menu-text">{item.name}</span>
                    </button>
                ))}
            </nav>

            <div className="logout-container">
                <button className="menu-btn logout-btn" id="logoutBtn" onClick={onLogout}>
                    <ion-icon name="log-out-outline" className="logout-icon"></ion-icon>
                    <span className="menu-text">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;