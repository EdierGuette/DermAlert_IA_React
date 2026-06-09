import React, { useEffect } from 'react';

// Importar CSS
import '../css/inicio/body.css';
import '../css/inicio/footer.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Inicio() {
    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Inicio', 'MOUNT', 'Componente Inicio montado');
        
        // Animaciones y efectos al cargar el componente
        const processSteps = document.querySelectorAll('.process-step');
        
        errorCapture.logAction('Inicio', 'ELEMENTS_FOUND', 'Elementos encontrados en el DOM', {
            processStepsCount: processSteps.length
        });

        const handleMouseEnter = (step, index) => {
            step.style.transform = 'translateY(-5px)';
            step.style.transition = 'transform 0.3s ease';
            errorCapture.logAction('Inicio', 'MOUSE_ENTER', `Mouse enter en paso ${index + 1}`);
        };

        const handleMouseLeave = (step, index) => {
            step.style.transform = 'translateY(0)';
            errorCapture.logAction('Inicio', 'MOUSE_LEAVE', `Mouse leave en paso ${index + 1}`);
        };

        processSteps.forEach((step, index) => {
            step.addEventListener('mouseenter', () => handleMouseEnter(step, index));
            step.addEventListener('mouseleave', () => handleMouseLeave(step, index));
        });

        // Log de interacción con cards de prevención
        const preventionItems = document.querySelectorAll('.prevention-item');
        preventionItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                errorCapture.logAction('Inicio', 'PREVENTION_ITEM_CLICK', `Item de prevención clickeado`, {
                    index: index,
                    text: item.querySelector('span:last-child')?.textContent
                });
            });
        });

        // Log de interacción con noticias
        const newsItems = document.querySelectorAll('.news-item');
        newsItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                errorCapture.logAction('Inicio', 'NEWS_ITEM_CLICK', `Noticia clickeada`, {
                    index: index,
                    title: item.querySelector('h4')?.textContent
                });
            });
        });

        // Log de interacción con enlaces del footer
        const footerLinks = document.querySelectorAll('.footer-link');
        footerLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                errorCapture.logAction('Inicio', 'FOOTER_LINK_CLICK', `Enlace del footer clickeado`, {
                    text: link.textContent,
                    href: link.getAttribute('href')
                });
            });
        });

        // Limpiar event listeners al desmontar
        return () => {
            errorCapture.logAction('Inicio', 'UNMOUNT', 'Componente Inicio desmontado, limpiando event listeners');
            
            processSteps.forEach((step, index) => {
                step.removeEventListener('mouseenter', () => handleMouseEnter(step, index));
                step.removeEventListener('mouseleave', () => handleMouseLeave(step, index));
            });
            
            preventionItems.forEach((item) => {
                item.removeEventListener('click', () => {});
            });
            
            newsItems.forEach((item) => {
                item.removeEventListener('click', () => {});
            });
            
            footerLinks.forEach((link) => {
                link.removeEventListener('click', () => {});
            });
        };
    }, []);

    // Log cuando se carga el componente (para tracking de vista)
    useEffect(() => {
        errorCapture.logAction('Inicio', 'VIEW_LOADED', 'Vista de inicio cargada correctamente');
    }, []);

    const preventionItems = [
        { text: 'Usa protector solar SPF 30+', icon: '✔' },
        { text: 'Evita exposición prolongada al sol (10am - 4pm)', icon: '✔' },
        { text: 'Revisa cambios en lunares periódicamente', icon: '✔' },
        { text: 'Consulta a un dermatólogo si notas alteraciones', icon: '✔' }
    ];

    const cancerTypes = [
        { name: 'Melanoma', description: 'El más agresivo, se origina en melanocitos. Requiere detección temprana.' },
        { name: 'Carcinoma Basocelular', description: 'El más frecuente, crecimiento lento, rara vez metastatiza.' },
        { name: 'Carcinoma Escamocelular', description: 'Puede ser agresivo localmente, riesgo moderado de metástasis.' },
        { name: 'Lesiones premalignas', description: 'Queratosis actínica, displasia de nevos. Pueden progresar a cáncer.' }
    ];

    const abcdeList = [
        { letter: 'A', text: 'Asimetría: Forma irregular' },
        { letter: 'B', text: 'Bordes: Bordes desiguales' },
        { letter: 'C', text: 'Color: Variación de color' },
        { letter: 'D', text: 'Diámetro: Mayor de 6mm' },
        { letter: 'E', text: 'Evolución: Cambios en el tiempo' }
    ];

    const newsItems = [
        { title: 'Avances en IA para dermatología', description: 'Nuevos estudios demuestran mejora en detección temprana de melanoma mediante inteligencia artificial (2024).' },
        { title: 'Tendencias en salud cutánea', description: 'Aumento de casos de melanoma en personas jóvenes según reportes de la OMS.' },
        { title: 'Recomendaciones actualizadas', description: 'La OMS enfatiza la importancia del diagnóstico temprano y protección solar.' }
    ];

    const processSteps = [
        {
            number: 1,
            icon: '📷',
            title: 'Sube una imagen',
            description: 'Captura una foto clara de la lesión cutánea con buena iluminación y enfoque.',
            tips: ['Buena iluminación natural', 'Enfoque nítido', 'Distancia apropiada (10-15 cm)', 'Fondo neutro']
        },
        {
            number: 2,
            icon: '🤖',
            title: 'La IA analiza tu lesión',
            description: 'Nuestro modelo entrenado con Teachable Machine procesa la imagen utilizando algoritmos avanzados.',
            tips: ['Modelo de clasificación de imágenes', 'Entrenado con miles de muestras', 'Procesamiento en tiempo real', 'Actualización continua']
        },
        {
            number: 3,
            icon: '📊',
            title: 'Recibe un resultado',
            description: 'Obtén un análisis detallado con probabilidades y nivel de confianza del diagnóstico.',
            tips: ['Probabilidad por categoría', 'Nivel de confianza', 'Gráficos comparativos', 'Historial de análisis']
        }
    ];

    return (
        <section className="view" id="home">
            <h1>Bienvenido a DermAlert IA</h1>
            <p className="lead">Plataforma avanzada para clasificación de lesiones cutáneas basada en inteligencia artificial.</p>

            <div className="warning-banner">
                <div className="warning-icon">⚠</div>
                <div className="warning-content">
                    <strong>Este sistema es una herramienta de apoyo y no sustituye la evaluación médica profesional.</strong>
                    <p>Si observas cambios extraños en tu piel, consulta a un dermatólogo.</p>
                </div>
            </div>

            <div className="process-section">
                <h2>¿Cómo funciona el sistema?</h2>
                <div className="process-steps">
                    {processSteps.map((step, index) => (
                        <div 
                            key={index} 
                            className="process-step"
                            onClick={() => errorCapture.logAction('Inicio', 'PROCESS_STEP_CLICK', `Paso ${step.number} clickeado`, {
                                step: step.number,
                                title: step.title
                            })}
                        >
                            <div className="step-number">{step.number}</div>
                            <div className="step-icon">{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                            <div className="step-tips">
                                <strong>{step.number === 1 ? 'Recomendaciones:' : step.number === 2 ? 'Tecnología:' : 'Resultados:'}</strong>
                                <ul>
                                    {step.tips.map((tip, i) => (
                                        <li key={i}>{tip}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="cards">
                <div className="card prevention-card">
                    <div className="card-header">
                        <div className="card-icon">🛡</div>
                        <h3>Prevención y cuidado de la piel</h3>
                    </div>
                    <div className="prevention-list">
                        {preventionItems.map((item, index) => (
                            <div 
                                key={index} 
                                className="prevention-item"
                                onClick={() => errorCapture.logAction('Inicio', 'PREVENTION_TIP_CLICK', `Tip de prevención: ${item.text}`, {
                                    tip: item.text
                                })}
                            >
                                <span className="check-icon">{item.icon}</span>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card education-card">
                    <div className="card-header">
                        <div className="card-icon">📘</div>
                        <h3>Información importante</h3>
                    </div>
                    <div className="education-content">
                        <h4>Tipos de cáncer de piel más comunes</h4>
                        <ul>
                            {cancerTypes.map((cancer, index) => (
                                <li 
                                    key={index}
                                    onClick={() => errorCapture.logAction('Inicio', 'CANCER_TYPE_CLICK', `Tipo de cáncer: ${cancer.name}`, {
                                        cancer_type: cancer.name
                                    })}
                                >
                                    <strong>{cancer.name}:</strong> {cancer.description}
                                </li>
                            ))}
                        </ul>

                        <h4>Señales de alarma (Regla ABCDE)</h4>
                        <ul className="abcde-list">
                            {abcdeList.map((item, index) => (
                                <li 
                                    key={index}
                                    onClick={() => errorCapture.logAction('Inicio', 'ABCDE_RULE_CLICK', `Regla ABCDE: ${item.letter}`, {
                                        letter: item.letter,
                                        description: item.text
                                    })}
                                >
                                    <strong>{item.letter}</strong>{item.text.substring(1)}
                                </li>
                            ))}
                        </ul>

                        <h4>Limitaciones de la aplicación</h4>
                        <ul>
                            <li>No reemplaza el diagnóstico médico profesional</li>
                            <li>Análisis basado en imágenes 2D</li>
                            <li>Precisión limitada por calidad de imagen</li>
                            <li>No considera historial médico personal</li>
                        </ul>
                    </div>
                </div>

                <div className="card news-card">
                    <div className="card-header">
                        <div className="card-icon">📰</div>
                        <h3>Novedades en dermatología</h3>
                    </div>
                    <div className="news-content">
                        {newsItems.map((item, index) => (
                            <div 
                                key={index} 
                                className="news-item"
                                onClick={() => errorCapture.logAction('Inicio', 'NEWS_CLICK', `Noticia: ${item.title}`, {
                                    title: item.title,
                                    description: item.description.substring(0, 100)
                                })}
                            >
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="professional-footer">
                <div className="footer-content">
                    <div className="footer-section"><strong>Versión del modelo:</strong> DermAlert IA v2.1</div>
                    <div className="footer-section"><strong>Última actualización:</strong> Mayo 2026</div>
                    <div className="footer-section"><strong>Soporte:</strong> edierjose01@gmail.com</div>
                    <div className="footer-section">
                        <a 
                            href="#" 
                            className="footer-link"
                            onClick={(e) => {
                                e.preventDefault();
                                errorCapture.logAction('Inicio', 'PRIVACY_POLICY_CLICK', 'Click en Política de privacidad');
                            }}
                        >
                            Política de privacidad
                        </a> |
                        <a 
                            href="#" 
                            className="footer-link"
                            onClick={(e) => {
                                e.preventDefault();
                                errorCapture.logAction('Inicio', 'TERMS_CLICK', 'Click en Términos de uso');
                            }}
                        >
                            Términos de uso
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Inicio;