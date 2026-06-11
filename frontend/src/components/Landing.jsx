import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swiper from 'swiper';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

// Importar CSS
import '../css/landing_page/landing.css';
import '../css/landing_page/landing-responsive.css';

// Importar componentes hijos
import Estadisticas from './Estadisticas';
import ContactModal from './ContactModal';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getLogoIconSync, getAppVersionSync } from '../services/config';

function Landing() {
    // Obtener configuración de forma síncrona (ya debería estar cargada)
    const projectName = getProjectNameSync();
    const logoIcon = getLogoIconSync();
    const appVersion = getAppVersionSync();

    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Landing', 'MOUNT', 'Landing page montada', {
            project_name: projectName,
            app_version: appVersion
        });

        // Inicializar Swiper
        errorCapture.logAction('Landing', 'SWIPER_INIT', 'Inicializando Swiper');
        const swiper = new Swiper('.medicalSwiper', {
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            effect: 'fade',
            fadeEffect: {
                crossFade: true
            },
        });
        errorCapture.logAction('Landing', 'SWIPER_READY', 'Swiper inicializado correctamente');

        // Smooth scroll para enlaces internos
        errorCapture.logAction('Landing', 'SMOOTH_SCROLL_SETUP', 'Configurando smooth scroll para enlaces internos');

        const smoothScrollHandler = function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href === '#') return;

            const targetElement = document.querySelector(href);
            if (targetElement) {
                errorCapture.logAction('Landing', 'SMOOTH_SCROLL', `Navegando a: ${href}`);
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        };

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', smoothScrollHandler);
        });

        // Animación de entrada para elementos al hacer scroll
        errorCapture.logAction('Landing', 'INTERSECTION_OBSERVER_SETUP', 'Configurando IntersectionObserver para animaciones');

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    errorCapture.logAction('Landing', 'ELEMENT_VISIBLE', `Elemento visible: ${entry.target.className || entry.target.tagName}`);
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        const animatedElements = document.querySelectorAll('.feature-card, .hero-left, .hero-right');
        errorCapture.logAction('Landing', 'ANIMATED_ELEMENTS_FOUND', `Elementos a animar encontrados: ${animatedElements.length}`);

        animatedElements.forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'all 0.6s ease';
                observer.observe(el);
            }
        });

        // Generar QR al cargar
        errorCapture.logAction('Landing', 'QR_GENERATION_START', 'Generando código QR');
        const qrContainer = document.getElementById('qrCode');
        if (qrContainer && window.QRCode) {
            const baseUrl = window.location.origin;
            const qrUrl = baseUrl + '/qr-diagnostico/';
            qrContainer.innerHTML = '';
            new window.QRCode(qrContainer, {
                text: qrUrl,
                width: 200,
                height: 200,
                colorDark: "#2f7a7a",
                colorLight: "#ffffff",
                correctLevel: window.QRCode.CorrectLevel.H
            });
            errorCapture.logAction('Landing', 'QR_GENERATED', 'Código QR generado correctamente', {
                url: qrUrl
            });
        } else {
            errorCapture.logWarning('Landing', 'QR_ERROR', 'No se pudo generar el código QR', {
                hasContainer: !!qrContainer,
                hasQRCodeLib: !!window.QRCode
            });
        }

        return () => {
            errorCapture.logAction('Landing', 'UNMOUNT', 'Landing page desmontada, limpiando recursos');
            swiper.destroy(true, true);
            observer.disconnect();
            errorCapture.logAction('Landing', 'CLEANUP_COMPLETE', 'Recursos liberados correctamente');
        };
    }, [projectName, appVersion]);

    // Log cuando se carga la landing (vista)
    useEffect(() => {
        errorCapture.logAction('Landing', 'VIEW_LOADED', 'Landing page cargada correctamente', {
            project_name: projectName,
            app_version: appVersion
        });

        // Registrar tiempo de carga de la página
        const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
        errorCapture.logAction('Landing', 'PAGE_LOAD_TIME', `Tiempo de carga: ${loadTime}ms`, {
            load_time_ms: loadTime
        });
    }, [projectName, appVersion]);

    const slides = [
        { icon: 'medical-outline', title: 'Diagnóstico profesional', description: 'Apoyado por inteligencia artificial' },
        { icon: 'scan-outline', title: 'Análisis preciso', description: 'Detección temprana de anomalías' },
        { icon: 'rocket-outline', title: 'Resultados instantáneos', description: 'En menos de 5 segundos' },
        { icon: 'time-outline', title: 'Historial completo', description: 'Seguimiento de tus diagnósticos' }
    ];

    const features = [
        { icon: 'rocket-outline', title: 'Resultados instantáneos', description: 'Obtén análisis detallados en segundos utilizando inteligencia artificial de última generación.' },
        { icon: 'shield-checkmark-outline', title: '100% Gratuito', description: 'Acceso completo a todas las funcionalidades sin ningún costo. La salud es lo primero.' },
        { icon: 'analytics-outline', title: 'Historial detallado', description: 'Guarda y consulta todos tus análisis anteriores para darle seguimiento a tu salud.' },
        { icon: 'medical-outline', title: 'Fácil de usar', description: 'Solo necesitas una foto clara de la lesión cutánea y obtendrás resultados al instante.' }
    ];

    return (
        <>
            {/* HEADER */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">
                            <ion-icon name={logoIcon}></ion-icon>
                        </div>
                        <div>{projectName}</div>
                    </div>

                    <nav className="nav-menu">
                        <a
                            href="#inicio"
                            className="nav-link"
                            onClick={() => errorCapture.logAction('Landing', 'NAV_CLICK', 'Navegación a Inicio')}
                        >
                            Inicio
                        </a>
                        <a
                            href="#estadisticas"
                            className="nav-link"
                            onClick={() => errorCapture.logAction('Landing', 'NAV_CLICK', 'Navegación a Estadísticas')}
                        >
                            Estadísticas
                        </a>
                        <a
                            href="#caracteristicas"
                            className="nav-link"
                            onClick={() => errorCapture.logAction('Landing', 'NAV_CLICK', 'Navegación a Características')}
                        >
                            Características
                        </a>
                        <a
                            href="#"
                            className="nav-link"
                            id="abrirContacto"
                            onClick={() => errorCapture.logAction('Landing', 'CONTACT_CLICK', 'Click en Contáctanos')}
                        >
                            Contáctanos
                        </a>
                        <div className="nav-buttons">
                            <Link
                                to="/login"
                                className="btn btn-outline"
                                onClick={() => errorCapture.logAction('Landing', 'LOGIN_CLICK', 'Click en Iniciar Sesión')}
                            >
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register"
                                className="btn btn-primary"
                                onClick={() => errorCapture.logAction('Landing', 'REGISTER_CLICK', 'Click en Registrarse')}
                            >
                                Registrarse
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* HERO SECTION */}
            <section className="hero" id="inicio">
                <div className="hero-container">
                    <div className="hero-left">
                        <div className="slider-container">
                            <div className="swiper medicalSwiper">
                                <div className="swiper-wrapper">
                                    {slides.map((slide, index) => (
                                        <div
                                            key={index}
                                            className="swiper-slide"
                                            onClick={() => errorCapture.logAction('Landing', 'SLIDE_CLICK', `Slide ${index + 1} clickeado`, {
                                                slide: index + 1,
                                                title: slide.title
                                            })}
                                        >
                                            <div className="slide-content">
                                                <div className="slide-icon">
                                                    <ion-icon name={slide.icon}></ion-icon>
                                                </div>
                                                <h4>{slide.title}</h4>
                                                <p>{slide.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="swiper-pagination"></div>
                            </div>
                        </div>

                        <div className="hero-text-container">
                            <h1 className="hero-title">
                                Detección temprana
                                <span>de cáncer de piel</span>
                            </h1>
                            <p className="hero-description">
                                Utiliza inteligencia artificial para analizar tus lunares y lesiones cutáneas
                                de forma rápida, segura y gratuita. Obtén resultados al instante.
                            </p>
                            <div className="hero-buttons">
                                <Link
                                    to="/register"
                                    className="btn btn-primary"
                                    onClick={() => errorCapture.logAction('Landing', 'HERO_BUTTON_CLICK', 'Click en Comenzar ahora')}
                                >
                                    Comenzar ahora
                                </Link>
                                <a
                                    href="#"
                                    className="btn btn-secondary"
                                    id="abrirContacto2"
                                    onClick={() => errorCapture.logAction('Landing', 'HERO_BUTTON_CLICK', 'Click en Hablar con experto')}
                                >
                                    Hablar con experto
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right">
                        <div className="qr-container">
                            <div className="qr-code-real" id="qrCode"></div>
                            <h3 className="qr-title">¿Quieres hacerte un chequeo de cáncer de piel gratis?</h3>
                            <p className="qr-subtitle">
                                Escanea el código QR con tu celular y comienza tu diagnóstico ahora mismo
                            </p>
                            <div className="qr-features">
                                <div className="qr-feature">
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Gratuito</span>
                                </div>
                                <div className="qr-feature">
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Rápido</span>
                                </div>
                                <div className="qr-feature">
                                    <ion-icon name="checkmark-circle-outline"></ion-icon>
                                    <span>Seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SECCIÓN DE ESTADÍSTICAS */}
            <Estadisticas />

            {/* FEATURES SECTION */}
            <section className="features" id="caracteristicas">
                <div className="features-content">
                    <div className="features-title">
                        <h2>¿Por qué elegir {projectName}?</h2>
                        <p>Tecnología avanzada al servicio de tu salud</p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="feature-card"
                                onClick={() => errorCapture.logAction('Landing', 'FEATURE_CLICK', `Característica clickeada: ${feature.title}`, {
                                    feature: feature.title,
                                    description: feature.description
                                })}
                            >
                                <div className="feature-icon">
                                    <ion-icon name={feature.icon}></ion-icon>
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* MODAL DE CONTACTO */}
            <ContactModal />

            {/* FOOTER - CON ICONO CUADRADO MEJORADO */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-logo">
                        <div className="footer-logo-icon">
                            <ion-icon name={logoIcon}></ion-icon>
                        </div>
                        <div className="footer-logo-text">{projectName}</div>
                    </div>
                    <div className="footer-copyright">
                        © 2025 {projectName} v{appVersion}. Todos los derechos reservados.
                    </div>
                    <div className="footer-contact">
                        <ion-icon name="mail-outline"></ion-icon>
                        <span>edierjose01@gmail.com</span>
                    </div>
                </div>
            </footer>
        </>
    );
}

export default Landing;