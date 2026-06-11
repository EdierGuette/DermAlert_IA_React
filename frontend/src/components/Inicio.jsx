import React, { useEffect, useState } from 'react';

// Importar CSS
import '../css/inicio/body.css';
import '../css/inicio/footer.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

// Importar configuración
import { getProjectNameSync, getAppVersionSync } from '../services/config';

function Inicio() {
    const [hoveredLetter, setHoveredLetter] = useState(null);
    
    // Obtener configuración
    const projectName = getProjectNameSync();
    const appVersion = getAppVersionSync();

    useEffect(() => {
        errorCapture.logAction('Inicio', 'MOUNT', 'Componente Inicio montado', {
            project_name: projectName,
            app_version: appVersion
        });
        
        return () => {
            errorCapture.logAction('Inicio', 'UNMOUNT', 'Componente Inicio desmontado');
        };
    }, [projectName, appVersion]);

    // Tipos de lesiones REALES del prototipo
    // Colores iguales a los de la gráfica de diagnóstico
    const lesionTypes = [
        { 
            name: 'Benigno General', 
            description: 'Características típicas de una lesión benigna general, sin rasgos de malignidad.', 
            recommendation: 'No requiere tratamiento, pero mantén vigilancia y realiza autoexámenes periódicos.',
            category: 'Benigno',
            categoryColor: '#28a745',
            icon: '🟩'
        },
        { 
            name: 'Nevo Lunar', 
            description: 'Lunar común (nevo melanocítico) de aspecto benigno.', 
            recommendation: 'Control anual con dermatólogo si hay cambios. Evita exposición solar excesiva.',
            category: 'Benigno',
            categoryColor: '#28a745',
            icon: '🟩'
        },
        { 
            name: 'Dermatofibroma', 
            description: 'Nódulo benigno frecuente en extremidades, de consistencia firme.', 
            recommendation: 'No presenta riesgo maligno. Si te molesta estéticamente, consulta para extirpación.',
            category: 'Benigno',
            categoryColor: '#28a745',
            icon: '🟩'
        },
        { 
            name: 'Queratosis Seborreica', 
            description: 'Crecimiento benigno de la capa superficial de la piel, muy común en adultos.', 
            recommendation: 'Sin riesgo de cáncer. Puede ser retirada por razones estéticas.',
            category: 'Benigno',
            categoryColor: '#28a745',
            icon: '🟩'
        },
        { 
            name: 'Melanoma', 
            description: 'Posible melanoma: células pigmentadas con atipia, bordes irregulares y coloración heterogénea.', 
            recommendation: 'ALERTA: Acude URGENTEMENTE a un dermatólogo para biopsia y tratamiento.',
            category: 'Maligno',
            categoryColor: '#dc3545',
            icon: '🟥'
        },
        { 
            name: 'Carcinoma Basocelular', 
            description: 'Posible carcinoma basocelular: proliferación de células basales con bordes perlados y telangiectasias.', 
            recommendation: 'Requiere evaluación dermatológica y probable extirpación.',
            category: 'Maligno',
            categoryColor: '#dc3545',
            icon: '🟥'
        },
        { 
            name: 'Carcinoma Escamocelular', 
            description: 'Posible carcinoma escamocelular: queratinización anormal, células escamosas atípicas.', 
            recommendation: 'Riesgo moderado de metástasis. Consulta con un dermatólogo cuanto antes.',
            category: 'Maligno',
            categoryColor: '#dc3545',
            icon: '🟥'
        },
        { 
            name: 'Premaligno', 
            description: 'Cambios celulares sugestivos de queratosis actínica o displasia leve/moderada.', 
            recommendation: 'Se recomienda tratamiento tópico o crioterapia para prevenir progresión.',
            category: 'Premaligno',
            categoryColor: '#fd7e14',
            icon: '🟧'
        },
        { 
            name: 'Desconocido', 
            description: 'El modelo no pudo clasificar la imagen con suficiente certeza.', 
            recommendation: 'Repite el análisis con una imagen más clara o consulta a un dermatólogo para evaluación profesional.',
            category: 'Desconocido',
            categoryColor: '#ffc107',
            icon: '🟨'
        }
    ];

    const abcdeList = [
        { letter: 'A', text: 'Asimetría', description: 'Forma irregular del lunar', color: '#dc3545', icon: '🔄' },
        { letter: 'B', text: 'Bordes', description: 'Bordes desiguales o irregulares', color: '#fd7e14', icon: '〰️' },
        { letter: 'C', text: 'Color', description: 'Variación de color dentro del lunar', color: '#ffc107', icon: '🎨' },
        { letter: 'D', text: 'Diámetro', description: 'Mayor de 6mm (tamaño de una goma de lápiz)', color: '#28a745', icon: '📏' },
        { letter: 'E', text: 'Evolución', description: 'Cambios en tamaño, forma o color', color: '#17a2b8', icon: '📈' }
    ];

    const preventionTips = [
        { text: 'Usa protector solar SPF 60+ todos los días', icon: '🧴', detail: 'Reaplica cada 2 horas si estás al aire libre' },
        { text: 'Evita exposición prolongada al sol (10am - 4pm)', icon: '☀️', detail: 'Busca sombra cuando el sol esté más fuerte' },
        { text: 'Realiza autoexamen de lunares mensualmente', icon: '🪞', detail: 'Usa el método ABCDE para evaluar cambios' },
        { text: 'Consulta a un dermatólogo anualmente', icon: '👨‍⚕️', detail: 'Especialmente si tienes piel clara o antecedentes familiares' },
        { text: 'Usa ropa protectora y sombreros', icon: '👒', detail: 'Protege tu piel incluso en días nublados' },
        { text: 'Evita camas solares y bronceado artificial', icon: '🚫', detail: 'Aumentan significativamente el riesgo de melanoma' }
    ];

    const limitations = [
        { icon: '🚫', text: 'No reemplaza el diagnóstico médico profesional', color: '#dc3545' },
        { icon: '📷', text: 'Análisis basado exclusivamente en imágenes 2D', color: '#fd7e14' },
        { icon: '🔍', text: 'Precisión limitada por calidad y ángulo de la imagen', color: '#ffc107' },
        { icon: '📋', text: 'No considera historial médico ni factores genéticos', color: '#20c997' },
        { icon: '⚡', text: 'Resultado preliminar, requiere confirmación clínica', color: '#17a2b8' },
        { icon: '📊', text: 'Entrenado con dataset específico, puede no generalizar', color: '#6c757d' }
    ];

    const processSteps = [
        {
            number: 1,
            icon: '📷',
            title: 'Captura o sube una imagen',
            description: 'Toma una foto clara de la lesión cutánea con buena iluminación y enfoque nítido.',
            color: '#2f7a7a'
        },
        {
            number: 2,
            icon: '🤖',
            title: 'Análisis por IA',
            description: 'Nuestro modelo entrenado clasifica la lesión en tiempo real.',
            color: '#5ba0a0'
        },
        {
            number: 3,
            icon: '📊',
            title: 'Resultado detallado',
            description: 'Obtén probabilidades por categoría, nivel de confianza y recomendaciones.',
            color: '#7fb5a8'
        }
    ];

    const newsItems = [
        {
            title: '🧠 Nueva clasificación de melanoma con IA',
            description: 'Estudio publicado en JAMA Dermatology (2024) muestra que algoritmos de deep learning superan a dermatólogos en detección temprana de melanoma, con sensibilidad del 91%.',
            source: 'JAMA Dermatology',
            year: '2024'
        },
        {
            title: '📊 Reconocimiento de tipos de lesiones',
            description: 'El modelo clasifica lesiones como: Benigno General, Nevo Lunar, Dermatofibroma, Queratosis Seborreica, Melanoma, Carcinoma Basocelular, Carcinoma Escamocelular, Premaligno y Desconocido.',
            source: 'Dataset ISIC',
            year: '2024'
        },
        {
            title: '🩺 Precisión diagnóstica',
            description: 'El modelo alcanza alta precisión para lesiones benignas y malignas, según validación cruzada con miles de imágenes.',
            source: 'Validación interna',
            year: '2024'
        }
    ];

    const handleLetterHover = (letter) => {
        setHoveredLetter(letter);
    };

    const handleLetterLeave = () => {
        setHoveredLetter(null);
    };

    return (
        <section className="view" id="home">
            {/* Hero Banner con logo cuadrado como landing */}
            <div className="hero-banner">
                <div className="hero-banner-content">
                    <div className="hero-banner-icon-square">
                        <ion-icon name="medical-outline"></ion-icon>
                    </div>
                    <div>
                        <h1 className="hero-title-modern">Bienvenido a {projectName}</h1>
                        <p className="hero-description-modern">
                            Plataforma de apoyo para clasificación de lesiones cutáneas basada en inteligencia artificial.
                            Obtén un análisis preliminar de lesiones con nivel de confianza y recomendaciones.
                        </p>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="warning-card">
                <div className="warning-icon-large">⚠️</div>
                <div className="warning-content">
                    <div className="warning-title">Herramienta de apoyo médico - No es un diagnóstico clínico</div>
                    <p>Este sistema es una herramienta de apoyo y NO sustituye la evaluación médica profesional. Los resultados son preliminares y deben ser verificados por un dermatólogo certificado.</p>
                </div>
            </div>

            {/* Proceso en 3 pasos */}
            <div className="process-section-modern">
                <h2 className="section-title">
                    <span className="section-title-icon">🚀</span>
                    ¿Cómo funciona el análisis?
                </h2>
                <div className="process-steps-modern">
                    {processSteps.map((step, index) => (
                        <div key={index} className="process-step-modern" style={{ borderTopColor: step.color }}>
                            <div className="step-number-modern" style={{ background: step.color }}>
                                {step.number}
                            </div>
                            <div className="step-icon-modern">{step.icon}</div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid de Cards Principales */}
            <div className="cards-grid-modern">
                {/* Prevención Card */}
                <div className="card-modern prevention-card">
                    <div className="card-header-modern">
                        <div className="card-icon-large">🛡️</div>
                        <h3>Prevención y cuidado</h3>
                    </div>
                    <div className="prevention-list-modern">
                        {preventionTips.map((item, index) => (
                            <div key={index} className="prevention-item-modern">
                                <div className="prevention-icon">{item.icon}</div>
                                <div className="prevention-content">
                                    <span className="prevention-text">{item.text}</span>
                                    <span className="prevention-detail">{item.detail}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card-footer-modern">
                        <span>📅 Autoexamen mensual recomendado | 👨‍⚕️ Visita anual al dermatólogo</span>
                    </div>
                </div>

                {/* Tipos de lesiones Card - Sin números, con colores iguales a la gráfica */}
                <div className="card-modern info-card">
                    <div className="card-header-modern">
                        <div className="card-icon-large">📋</div>
                        <h3>Tipos de lesiones detectables</h3>
                    </div>
                    <div className="lesion-types-modern">
                        {lesionTypes.map((lesion, index) => (
                            <div key={index} className="lesion-item-modern" style={{ borderLeftColor: lesion.categoryColor }}>
                                <div className="lesion-icon">{lesion.icon}</div>
                                <div className="lesion-content">
                                    <div className="lesion-header">
                                        <span className="lesion-name">{lesion.name}</span>
                                        <span className="lesion-category" style={{ background: lesion.categoryColor === '#28a745' ? '#d4edda' : lesion.categoryColor === '#dc3545' ? '#f8d7da' : lesion.categoryColor === '#fd7e14' ? '#fff3e0' : '#fff3cd', color: lesion.categoryColor === '#28a745' ? '#155724' : lesion.categoryColor === '#dc3545' ? '#721c24' : lesion.categoryColor === '#fd7e14' ? '#cc7a00' : '#856404' }}>
                                            {lesion.category}
                                        </span>
                                    </div>
                                    <div className="lesion-description">{lesion.description}</div>
                                    <div className="lesion-recommendation">{lesion.recommendation}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ABCDE Card con animaciones */}
                <div className="card-modern abcde-card">
                    <div className="card-header-modern">
                        <div className="card-icon-large">🔍</div>
                        <h3>Regla ABCDE - Autoexamen</h3>
                    </div>
                    <div className="abcde-list-modern">
                        {abcdeList.map((item, index) => (
                            <div 
                                key={index} 
                                className={`abcde-item ${hoveredLetter === item.letter ? 'hovered' : ''}`}
                                onMouseEnter={() => handleLetterHover(item.letter)}
                                onMouseLeave={handleLetterLeave}
                                style={{ transform: hoveredLetter === item.letter ? `rotate(2deg) scale(1.02)` : 'rotate(0deg) scale(1)' }}
                            >
                                <div className="abcde-letter" style={{ background: item.color }}>
                                    {item.letter}
                                    <span className="abcde-icon">{item.icon}</span>
                                </div>
                                <div className="abcde-content">
                                    <div className="abcde-title">{item.text}</div>
                                    <div className="abcde-description">{item.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card-footer-modern">
                        <span>📝 Realiza este autoexamen mensualmente | 🔍 Ante cualquier duda, consulta a un especialista</span>
                    </div>
                </div>
            </div>

            {/* Limitaciones Mejoradas */}
            <div className="limitations-card-modern">
                <div className="limitations-header">
                    <div className="limitations-icon">⚠️</div>
                    <div>
                        <h3>Limitaciones de la aplicación</h3>
                        <p>Información importante sobre el alcance de esta herramienta</p>
                    </div>
                </div>
                <div className="limitations-grid">
                    {limitations.map((item, index) => (
                        <div key={index} className="limitation-item-modern" style={{ borderLeftColor: item.color }}>
                            <div className="limitation-icon-modern">{item.icon}</div>
                            <div className="limitation-text-modern">{item.text}</div>
                        </div>
                    ))}
                </div>
                <div className="limitations-footer">
                    <span>🔬 Esta herramienta es para fines educativos y de apoyo, no sustituye el criterio médico</span>
                </div>
            </div>

            {/* Novedades Card */}
            <div className="news-card-modern">
                <div className="news-header">
                    <div className="news-icon">📰</div>
                    <div>
                        <h3>Información respaldada por estudios</h3>
                        <p>Datos y referencias científicas actualizadas</p>
                    </div>
                </div>
                <div className="news-grid">
                    {newsItems.map((item, index) => (
                        <div key={index} className="news-item-modern">
                            <div className="news-title-modern">{item.title}</div>
                            <div className="news-description-modern">{item.description}</div>
                            <div className="news-footer-modern">
                                <span className="news-source">{item.source}</span>
                                <span className="news-year">{item.year}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="news-footer-main">
                    <span>📚 Basado en dataset ISIC y estudios de la Academia Americana de Dermatología</span>
                </div>
            </div>

            {/* Footer */}
            <div className="professional-footer-modern">
                <div className="footer-content-modern">
                    <div className="footer-section">
                        <strong>Modelo:</strong> CNN entrenado con miles de imágenes
                    </div>
                    <div className="footer-section">
                        <strong>Soporte:</strong> edierjose01@gmail.com
                    </div>
                    <div className="footer-section">
                        <a href="#" className="footer-link-modern">Política de privacidad</a> | 
                        <a href="#" className="footer-link-modern">Términos de uso</a>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Inicio;