import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

// Importar CSS
import '../css/landing_page/landing.css';
import '../css/landing_page/landing-responsive.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getLogoIconSync, getAppVersionSync } from '../services/config';

function QRLanding() {
    // Obtener configuración de forma síncrona (ya debería estar cargada)
    const projectName = getProjectNameSync();
    const logoIcon = getLogoIconSync();
    const appVersion = getAppVersionSync();

    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('QRLanding', 'MOUNT', 'Página QRLanding montada', {
            project_name: projectName,
            app_version: appVersion
        });
        
        // Registrar acceso por QR
        const referrer = document.referrer;
        const userAgent = navigator.userAgent;
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent);
        
        errorCapture.logAction('QRLanding', 'QR_ACCESS', 'Acceso a través de código QR', {
            referrer: referrer || 'direct',
            isMobile: isMobile,
            userAgent: userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            timestamp: new Date().toISOString(),
            project_name: projectName
        });
        
        return () => {
            errorCapture.logAction('QRLanding', 'UNMOUNT', 'Página QRLanding desmontada');
        };
    }, [projectName, appVersion]);

    // Log de vista cargada
    useEffect(() => {
        errorCapture.logAction('QRLanding', 'VIEW_LOADED', 'Página QR Landing cargada correctamente', {
            project_name: projectName,
            app_version: appVersion
        });
        
        // Registrar tiempo de carga
        const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        errorCapture.logAction('QRLanding', 'PAGE_LOAD_TIME', `Tiempo de carga: ${loadTime}ms`, {
            load_time_ms: loadTime
        });
    }, [projectName, appVersion]);

    return (
        <>
            {/* Ondas de fondo */}
            <div className="bg-waves">
                <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path d="M0,128L48,144C96,160,192,192,288,186.7C384,181,480,139,576,138.7C672,139,768,181,864,192C960,203,1056,181,1152,154.7C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#2f7a7a" opacity="0.1"></path>
                </svg>
            </div>

            <div className="qr-landing">
                <div className="qr-card">
                    {/* HEADER CON COLOR */}
                    <div className="qr-header">
                        <div className="logo">
                            <div className="logo-icon">
                                <ion-icon name={logoIcon}></ion-icon>
                            </div>
                            <div className="logo-text">{projectName}</div>
                        </div>

                        {/* Onda dentro del header */}
                        <div className="header-wave">
                            <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
                                <path d="M0,20L48,23.3C96,27,192,33,288,36.7C384,40,480,40,576,36.7C672,33,768,27,864,23.3C960,20,1056,20,1152,23.3C1248,27,1344,33,1392,36.7L1440,40L1440,60L1392,60C1344,60,1248,60,1152,60C1056,60,960,60,864,60C768,60,672,60,576,60C480,60,384,60,288,60C192,60,96,60,48,60L0,60Z" fill="white" opacity="0.2"></path>
                            </svg>
                        </div>
                    </div>

                    {/* Icono principal */}
                    <div className="qr-icon">
                        <ion-icon name={logoIcon}></ion-icon>
                    </div>

                    {/* Títulos */}
                    <h1>🔍 Diagnóstico Rápido</h1>
                    <p>Has escaneado el código QR para acceder a nuestro servicio de detección temprana de cáncer de piel.</p>

                    {/* Opciones de botones */}
                    <div className="qr-options">
                        <Link 
                            to="/register"
                            className="qr-btn qr-btn-primary"
                            onClick={() => errorCapture.logAction('QRLanding', 'CREATE_ACCOUNT_CLICK', 'Click en botón Crear cuenta desde QR', {
                                project_name: projectName
                            })}
                        >
                            <ion-icon name="person-add-outline"></ion-icon>
                            Crear cuenta
                        </Link>
                        <Link 
                            to="/login"
                            className="qr-btn qr-btn-secondary"
                            onClick={() => errorCapture.logAction('QRLanding', 'LOGIN_CLICK', 'Click en botón Ya tengo cuenta desde QR', {
                                project_name: projectName
                            })}
                        >
                            <ion-icon name="log-in-outline"></ion-icon>
                            Ya tengo cuenta
                        </Link>
                    </div>

                    {/* Botón volver al inicio */}
                    <div className="back-link">
                        <Link 
                            to="/" 
                            className="back-home-btn"
                            onClick={() => errorCapture.logAction('QRLanding', 'BACK_HOME_CLICK', 'Click en botón Volver al inicio desde QR', {
                                project_name: projectName
                            })}
                        >
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            Volver al inicio
                        </Link>
                    </div>

                    {/* Nota */}
                    <div className="qr-note">
                        {projectName} v{appVersion} - Regístrate o inicia sesión para comenzar
                    </div>
                </div>
            </div>

            <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Roboto, Arial, sans-serif;
          background: linear-gradient(135deg, #f6f7f9 0%, #e8f4f3 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        .bg-waves {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 200px;
          z-index: 0;
          opacity: 0.2;
        }
        
        .bg-waves svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 200px;
          fill: #2f7a7a;
        }
        
        .qr-landing {
          width: 100%;
          max-width: 480px;
          z-index: 10;
          position: relative;
          margin: 0 auto;
        }
        
        .qr-card {
          background: white;
          border-radius: 30px;
          padding: 40px 35px 35px 35px;
          box-shadow: 0 25px 50px rgba(47,122,122,0.3);
          border: 1px solid rgba(47,122,122,0.15);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .qr-header {
          background: linear-gradient(135deg, #2f7a7a, #1e5f5f);
          margin: -40px -35px 25px -35px;
          padding: 35px 35px 25px 35px;
          border-radius: 30px 30px 0 0;
          position: relative;
          overflow: hidden;
        }
        
        .header-wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          z-index: 1;
        }
        
        .header-wave svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 30px;
          fill: white;
          opacity: 0.15;
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
          z-index: 2;
        }
        
        .logo-icon {
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          transform: rotate(-5deg);
          transition: transform 0.3s ease;
          border: 2px solid rgba(255,255,255,0.3);
        }
        
        .logo-icon:hover {
          transform: rotate(0deg) scale(1.1);
        }
        
        .logo-text {
          font-size: 28px;
          font-weight: 800;
          color: white;
          letter-spacing: 0.5px;
        }
        
        .logo-text span {
          color: rgba(255,255,255,0.8);
          font-weight: 400;
        }
        
        .qr-icon {
          width: 90px;
          height: 90px;
          background: rgba(47,122,122,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 25px;
          color: #2f7a7a;
          font-size: 45px;
          border: 2px dashed #2f7a7a;
          position: relative;
          z-index: 1;
        }
        
        .qr-icon ion-icon {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .qr-card h1 {
          color: #2f7a7a;
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
          position: relative;
          z-index: 1;
        }
        
        .qr-card p {
          color: #4a6a6a;
          font-size: 16px;
          margin-bottom: 35px;
          line-height: 1.6;
          position: relative;
          z-index: 1;
          max-width: 380px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .qr-options {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        
        .qr-btn {
          padding: 16px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 180px;
          border: none;
          cursor: pointer;
        }
        
        .qr-btn-primary {
          background: linear-gradient(135deg, #2f7a7a, #1e5f5f);
          color: white;
          box-shadow: 0 8px 20px rgba(47,122,122,0.3);
        }
        
        .qr-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 25px rgba(47,122,122,0.4);
        }
        
        .qr-btn-primary ion-icon {
          font-size: 20px;
        }
        
        .qr-btn-secondary {
          background: white;
          color: #2f7a7a;
          border: 2px solid #2f7a7a;
          box-shadow: 0 4px 10px rgba(47,122,122,0.1);
        }
        
        .qr-btn-secondary:hover {
          background: #f0f8f8;
          transform: translateY(-3px);
          box-shadow: 0 8px 15px rgba(47,122,122,0.15);
        }
        
        .qr-btn-secondary ion-icon {
          font-size: 20px;
        }
        
        .back-link {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 2px solid rgba(47,122,122,0.15);
          position: relative;
          z-index: 1;
        }
        
        .back-home-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #2f7a7a;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          padding: 12px 25px;
          border-radius: 50px;
          background: rgba(47,122,122,0.08);
          transition: all 0.3s ease;
          border: 2px solid rgba(47,122,122,0.2);
          width: auto;
          min-width: 200px;
        }
        
        .back-home-btn:hover {
          background: rgba(47,122,122,0.15);
          transform: translateX(-5px);
          border-color: #2f7a7a;
        }
        
        .back-home-btn ion-icon {
          font-size: 20px;
          transition: transform 0.3s ease;
        }
        
        .back-home-btn:hover ion-icon {
          transform: translateX(-5px);
        }
        
        .qr-note {
          color: #000000;
          font-size: 13px;
          margin-top: 20px;
          position: relative;
          z-index: 1;
          opacity: 0.8;
        }
        
        @media (max-width: 520px) {
          .qr-landing { max-width: 100%; }
          .qr-card { padding: 35px 25px 30px 25px; }
          .qr-header { margin: -35px -25px 20px -25px; padding: 30px 25px 20px 25px; }
          .logo-icon { width: 45px; height: 45px; font-size: 24px; }
          .logo-text { font-size: 24px; }
          .qr-card h1 { font-size: 24px; }
          .qr-card p { font-size: 15px; margin-bottom: 30px; }
          .qr-options { flex-direction: column; gap: 12px; }
          .qr-btn { width: 100%; min-width: auto; padding: 15px 20px; }
          .back-home-btn { min-width: 180px; padding: 10px 20px; font-size: 15px; }
        }
        
        @media (max-width: 380px) {
          .qr-card { padding: 30px 20px 25px 20px; }
          .qr-header { margin: -30px -20px 15px -20px; padding: 25px 20px 15px 20px; }
          .logo-icon { width: 40px; height: 40px; font-size: 22px; }
          .logo-text { font-size: 22px; }
          .qr-icon { width: 70px; height: 70px; font-size: 35px; }
          .qr-card h1 { font-size: 22px; }
          .qr-card p { font-size: 14px; }
          .back-home-btn { min-width: 160px; padding: 8px 15px; font-size: 14px; }
        }
      `}</style>
        </>
    );
}

export default QRLanding;