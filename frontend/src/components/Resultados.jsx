import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Importar CSS
import '../css/resultados/header.css';
import '../css/resultados/user_info.css';
import '../css/resultados/estadisticas.css';

function Resultados() {
    const [diagnosticos, setDiagnosticos] = useState([]);
    const [selectedDiagnostico, setSelectedDiagnostico] = useState(null);
    const [loading, setLoading] = useState(true);
    const [classDistChart, setClassDistChart] = useState(null);
    const [confidenceLineChart, setConfidenceLineChart] = useState(null);

    const classDistCanvasRef = useRef(null);
    const confidenceLineCanvasRef = useRef(null);
    const probChartCanvasRef = useRef(null);
    const specificClassesCanvasRef = useRef(null);

    // Función para obtener el texto de riesgo según categoría
    const getRiskText = (categoria) => {
        switch (categoria) {
            case 'Maligno': return '🔴 Alto';
            case 'Premaligno': return '🟠 Moderado';
            case 'Benigno': return '🟢 Bajo';
            default: return '⚪ No determinado';
        }
    };

    // Función para obtener código CIE-10
    const getCie10CodeFromDiagnostico = (diagnostico) => {
        const cie10Mapping = {
            'Benigno General': 'D23.9',
            'Nevo Lunar': 'D22.9',
            'Dermatofibroma': 'D23.9',
            'Queratosis Seborreica': 'L82',
            'Melanoma': 'C43.9',
            'Carcinoma Basocelular': 'C44.9',
            'Carcinoma Escamocelular': 'C44.9',
            'Premaligno': 'L57.0',
            'Desconocido': 'R22.9'
        };
        return diagnostico.codigo_cie10 || cie10Mapping[diagnostico.clase] || 'R22.9';
    };

    // Función para obtener interpretación según clase
    const getInterpretationText = (className, categoria) => {
        const interpretaciones = {
            'Benigno General': 'Características típicas de una lesión benigna general, sin rasgos de malignidad.',
            'Nevo Lunar': 'Lunar común (nevo melanocítico) de aspecto benigno.',
            'Dermatofibroma': 'Nódulo benigno frecuente en extremidades, de consistencia firme.',
            'Queratosis Seborreica': 'Crecimiento benigno de la capa superficial de la piel, muy común en adultos.',
            'Melanoma': 'Posible melanoma: células pigmentadas con atipia, bordes irregulares y coloración heterogénea.',
            'Carcinoma Basocelular': 'Posible carcinoma basocelular: proliferación de células basales con bordes perlados y telangiectasias.',
            'Carcinoma Escamocelular': 'Posible carcinoma escamocelular: queratinización anormal, células escamosas atípicas.',
            'Premaligno': 'Cambios celulares sugestivos de queratosis actínica o displasia leve/moderada.',
            'Desconocido': 'El modelo no pudo clasificar la imagen con suficiente certeza.'
        };
        return interpretaciones[className] || `Clasificación: ${className} (${categoria}). Revisión profesional recomendada.`;
    };

    // Función para obtener recomendación según clase
    const getRecommendationText = (className, categoria) => {
        const recomendaciones = {
            'Benigno General': '✅ Es una lesión benigna general. No requiere tratamiento, pero mantén vigilancia y realiza autoexámenes periódicos.',
            'Nevo Lunar': '✅ Lunar benigno. Control anual con dermatólogo si hay cambios en tamaño, color o forma. Evita exposición solar excesiva.',
            'Dermatofibroma': '✅ Lesión benigna común. No presenta riesgo maligno. Si te molesta estéticamente, consulta a un dermatólogo para su extirpación.',
            'Queratosis Seborreica': '✅ Lesión benigna muy frecuente en adultos mayores. Sin riesgo de cáncer. Puede ser retirada por razones estéticas.',
            'Melanoma': '⚠️ ALTA SOSPECHA DE MELANOMA. Debes acudir URGENTEMENTE a un dermatólogo para biopsia y tratamiento temprano.',
            'Carcinoma Basocelular': '⚠️ Sospecha de Carcinoma Basocelular. Es el cáncer de piel más frecuente y de crecimiento lento. Requiere evaluación dermatológica y probable extirpación.',
            'Carcinoma Escamocelular': '⚠️ Sospecha de Carcinoma Escamocelular. Puede ser agresivo localmente. Consulta con un dermatólogo cuanto antes.',
            'Premaligno': '🔶 Lesión premaligna (queratosis actínica o displasia). Se recomienda tratamiento tópico o crioterapia para prevenir progresión a cáncer.',
            'Desconocido': '❓ Resultado no concluyente. Repite el análisis con una imagen más clara o consulta a un dermatólogo para evaluación profesional.'
        };
        return recomendaciones[className] || `Resultado: ${className} (${categoria}). Consulta con un especialista para una evaluación más precisa.`;
    };

    // Agrupar probabilidades de 9 clases en 4 categorías
    const aggregateProbs = (probs) => {
        let benignoSum = 0, malignoSum = 0, premaligno = 0, desconocido = 0;
        for (let i = 0; i <= 3; i++) benignoSum += probs[i];
        for (let i = 4; i <= 6; i++) malignoSum += probs[i];
        premaligno = probs[7];
        desconocido = probs[8];
        return {
            'Benigno': Math.round(benignoSum * 10000) / 100,
            'Maligno': Math.round(malignoSum * 10000) / 100,
            'Premaligno': Math.round(premaligno * 10000) / 100,
            'Desconocido': Math.round(desconocido * 10000) / 100
        };
    };

    // Mostrar diagnóstico específico en el modal/card
    const showDiagnosticoInResults = (diagnostico) => {
        setSelectedDiagnostico(diagnostico);

        const displayId = diagnostico.displayId || diagnostico.id;
        const fecha = new Date(diagnostico.fecha).toLocaleString('es-CO', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
        const riesgoText = getRiskText(diagnostico.categoria);
        const cie10Code = getCie10CodeFromDiagnostico(diagnostico);
        const interpretacion = getInterpretationText(diagnostico.clase, diagnostico.categoria);
        const recomendacion = getRecommendationText(diagnostico.clase, diagnostico.categoria);

        // Actualizar elementos del DOM
        const resultDisplayId = document.getElementById('resultDisplayId');
        const patientName = document.getElementById('patientName');
        const patientId = document.getElementById('patientId');
        const resultFecha = document.getElementById('resultFecha');
        const resultCategoria = document.getElementById('resultCategoria');
        const resultTipoLesion = document.getElementById('resultTipoLesion');
        const resultRiesgo = document.getElementById('resultRiesgo');
        const resultCie10 = document.getElementById('resultCie10');
        const resultConfianza = document.getElementById('resultConfianza');
        const resultInterpretation = document.getElementById('resultInterpretation');
        const resultRecommendation = document.getElementById('resultRecommendation');
        const diagnosticoImagen = document.getElementById('diagnosticoImagen');
        const resultCard = document.getElementById('resultCard');

        if (resultDisplayId) resultDisplayId.textContent = displayId;
        if (patientName) patientName.textContent = diagnostico.paciente_nombre || 'N/A';
        if (patientId) patientId.textContent = diagnostico.paciente_identificacion || 'N/A';
        if (resultFecha) resultFecha.textContent = fecha;
        if (resultCategoria) resultCategoria.textContent = diagnostico.categoria;
        if (resultTipoLesion) resultTipoLesion.textContent = diagnostico.clase;
        if (resultRiesgo) resultRiesgo.textContent = riesgoText;
        if (resultCie10) resultCie10.textContent = cie10Code;
        if (resultConfianza) resultConfianza.textContent = `${diagnostico.confianza}%`;
        if (resultInterpretation) resultInterpretation.textContent = interpretacion;
        if (resultRecommendation) resultRecommendation.textContent = recomendacion;

        if (diagnosticoImagen && diagnostico.imagen) {
            let imagenSrc = diagnostico.imagen;
            if (!imagenSrc.startsWith('data:image')) {
                imagenSrc = `data:image/jpeg;base64,${imagenSrc}`;
            }
            diagnosticoImagen.src = imagenSrc;
            diagnosticoImagen.alt = `Imagen del diagnóstico ${displayId}`;
        }

        if (resultCard) resultCard.classList.remove('hidden');

        // Gráfica de categorías
        const aggregated = aggregateProbs(diagnostico.probabilidades);
        const categories = ['Benigno', 'Maligno', 'Premaligno', 'Desconocido'];
        const categoryValues = [aggregated.Benigno, aggregated.Maligno, aggregated.Premaligno, aggregated.Desconocido];

        if (probChartCanvasRef.current) {
            const existingChart = Chart.getChart(probChartCanvasRef.current);
            if (existingChart) existingChart.destroy();

            new Chart(probChartCanvasRef.current, {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [{
                        label: 'Probabilidad (%)',
                        data: categoryValues,
                        backgroundColor: ['rgba(40,167,69,0.7)', 'rgba(220,53,69,0.7)', 'rgba(255,140,0,0.7)', 'rgba(255,193,7,0.7)'],
                        borderColor: ['rgba(40,167,69,1)', 'rgba(220,53,69,1)', 'rgba(255,140,0,1)', 'rgba(255,193,7,1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probabilidad (%)' } } },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Gráfica de clases específicas
        const classNames = [
            'Benigno General', 'Nevo Lunar', 'Dermatofibroma', 'Queratosis Seborreica',
            'Melanoma', 'Carcinoma Basocelular', 'Carcinoma Escamocelular',
            'Premaligno', 'Desconocido'
        ];

        const specificProbs = diagnostico.probabilidades.map(p => Math.round(p * 10000) / 100);
        const specificColors = specificProbs.map((_, i) => {
            if (i <= 3) return 'rgba(40,167,69,0.7)';
            if (i <= 6) return 'rgba(220,53,69,0.7)';
            if (i === 7) return 'rgba(255,140,0,0.7)';
            return 'rgba(255,193,7,0.7)';
        });
        const specificBorderColors = specificColors.map(c => c.replace('0.7', '1'));

        if (specificClassesCanvasRef.current) {
            const existingChart = Chart.getChart(specificClassesCanvasRef.current);
            if (existingChart) existingChart.destroy();

            new Chart(specificClassesCanvasRef.current, {
                type: 'bar',
                data: {
                    labels: classNames,
                    datasets: [{
                        label: 'Probabilidad (%)',
                        data: specificProbs,
                        backgroundColor: specificColors,
                        borderColor: specificBorderColors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probabilidad (%)' } },
                        x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // Scroll al resultado
        if (resultCard) resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Dibujar gráficas agregadas
    const drawAggregatedCharts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('/api/diagnosticos/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (!response.ok) throw new Error('Error al cargar datos');

            const data = await response.json();
            setDiagnosticos(data);
            setLoading(false);

            if (data.length === 0) return;

            // Gráfica de distribución por categoría
            const counts = {};
            data.forEach(d => {
                const cat = d.categoria || 'Desconocido';
                counts[cat] = (counts[cat] || 0) + 1;
            });

            const labels = Object.keys(counts);
            const countsData = labels.map(l => counts[l]);

            const backgroundColors = labels.map(label => {
                if (label === 'Maligno') return 'rgba(220, 53, 69, 0.7)';
                if (label === 'Benigno') return 'rgba(40, 167, 69, 0.7)';
                if (label === 'Premaligno') return 'rgba(255, 140, 0, 0.7)';
                return 'rgba(255, 193, 7, 0.7)';
            });

            const borderColors = labels.map(label => {
                if (label === 'Maligno') return 'rgba(220, 53, 69, 1)';
                if (label === 'Benigno') return 'rgba(40, 167, 69, 1)';
                if (label === 'Premaligno') return 'rgba(255, 140, 0, 1)';
                return 'rgba(255, 193, 7, 1)';
            });

            if (classDistCanvasRef.current) {
                if (classDistChart) classDistChart.destroy();
                const newChart = new Chart(classDistCanvasRef.current, {
                    type: 'pie',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: countsData,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const label = context.label || '';
                                        const value = context.parsed;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
                setClassDistChart(newChart);
            }

            // Gráfica de línea de confianza
            const sorted = [...data].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            const timeline = sorted.map(d => {
                const date = new Date(d.fecha);
                return date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            });
            const confs = sorted.map(d => d.confianza);

            if (confidenceLineCanvasRef.current) {
                if (confidenceLineChart) confidenceLineChart.destroy();
                const newChart = new Chart(confidenceLineCanvasRef.current, {
                    type: 'line',
                    data: {
                        labels: timeline,
                        datasets: [{
                            label: 'Nivel de Confianza (%)',
                            data: confs,
                            fill: true,
                            tension: 0.4,
                            borderColor: 'rgba(47, 122, 122, 0.8)',
                            backgroundColor: 'rgba(47, 122, 122, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: 'rgba(47, 122, 122, 1)',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Confianza (%)' }, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
                            x: { ticks: { maxRotation: 45, minRotation: 45 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
                        },
                        plugins: {
                            tooltip: { callbacks: { label: (ctx) => `Confianza: ${ctx.parsed.y}%` } },
                            legend: { labels: { font: { size: 12 } } }
                        }
                    }
                });
                setConfidenceLineChart(newChart);
            }
        } catch (error) {
            console.error('Error al cargar gráficas agregadas:', error);
            setLoading(false);
        }
    };

    // Función global para mostrar diagnóstico (llamada desde Historial)
    window.showDiagnosticoInResults = showDiagnosticoInResults;

    useEffect(() => {
        drawAggregatedCharts();

        return () => {
            if (classDistChart) classDistChart.destroy();
            if (confidenceLineChart) confidenceLineChart.destroy();
        };
    }, []);

    if (loading) {
        return (
            <section className="view" id="results">
                <h2 className="results-title">Resultados Detallados</h2>
                <div style={{ textAlign: 'center', padding: '50px' }}>Cargando resultados...</div>
            </section>
        );
    }

    return (
        <section className="view" id="results">
            <h2 className="results-title">Resultados Detallados</h2>

            <div id="resultCard" className="result-card hidden">
                <div className="card-header">
                    <h3>Resultados del Examen</h3>
                </div>
                <div className="card-body">

                    <div className="diagnostico-info-table">
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td className="info-label">ID:</td>
                                    <td className="info-value" id="resultDisplayId">—</td>
                                    <td className="info-label">Nombre completo:</td>
                                    <td className="info-value" id="patientName">—</td>
                                </tr>
                                <tr>
                                    <td className="info-label">Identificación:</td>
                                    <td className="info-value" id="patientId">—</td>
                                    <td className="info-label">Fecha:</td>
                                    <td className="info-value" id="resultFecha">—</td>
                                </tr>
                                <tr>
                                    <td className="info-label">Categoría:</td>
                                    <td className="info-value" id="resultCategoria">—</td>
                                    <td className="info-label">Tipo de lesión:</td>
                                    <td className="info-value" id="resultTipoLesion">—</td>
                                </tr>
                                <tr>
                                    <td className="info-label">Riesgo:</td>
                                    <td className="info-value" id="resultRiesgo">—</td>
                                    <td className="info-label">Código CIE-10:</td>
                                    <td className="info-value" id="resultCie10">—</td>
                                </tr>
                                <tr>
                                    <td className="info-label">Confianza IA:</td>
                                    <td className="info-value" id="resultConfianza">—</td>
                                    <td className="info-label"></td>
                                    <td className="info-value"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="imagen-recomendaciones-row">
                        <div className="imagen-columna-result">
                            <div className="imagen-header">
                                <span className="imagen-icon">📷</span>
                                <span className="imagen-title">Imagen analizada</span>
                            </div>
                            <div className="imagen-container-result">
                                <img id="diagnosticoImagen" src="" alt="Imagen del diagnóstico" className="imagen-preview-result" />
                            </div>
                        </div>

                        <div className="recomendaciones-columna">
                            <div className="recomendaciones-header">
                                <span className="recomendaciones-icon">💡</span>
                                <span className="recomendaciones-title">Recomendaciones</span>
                            </div>
                            <div className="recomendaciones-container">
                                <div className="recomendacion-item">
                                    <strong>Interpretación:</strong>
                                    <p id="resultInterpretation">—</p>
                                </div>
                                <div className="recomendacion-item">
                                    <strong>Recomendación:</strong>
                                    <p id="resultRecommendation" className="recommendation-box-result">—</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="graphs-row">
                        <div className="graph-column">
                            <div className="graph-container">
                                <h4 className="graph-title">📊 Distribución por categorías</h4>
                                <div className="graph-wrapper">
                                    <canvas id="probChartId" ref={probChartCanvasRef} width="500" height="350" style={{ width: '100%', height: 'auto', maxWidth: '500px', margin: '0 auto', display: 'block' }}></canvas>
                                </div>
                            </div>
                        </div>
                        <div className="graph-column">
                            <div className="graph-container">
                                <h4 className="graph-title">🔬 Desglose por tipo de lesión</h4>
                                <div className="graph-wrapper">
                                    <canvas id="specificClassesChart" ref={specificClassesCanvasRef} width="500" height="350" style={{ width: '100%', height: 'auto', maxWidth: '500px', margin: '0 auto', display: 'block' }}></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="aggregated-title">Estadísticas Generales</h3>
            <p className="results-subtitle">Resumen de todos los diagnósticos realizados</p>

            <div className="charts-container">
                <div className="chart-wrapper">
                    <h4>Distribución de Clases</h4>
                    <div className="chart-canvas-container">
                        <canvas id="classDist" ref={classDistCanvasRef}></canvas>
                    </div>
                </div>
                <div className="chart-wrapper">
                    <h4>Evolución de Confianza</h4>
                    <div className="chart-canvas-container">
                        <canvas id="confidenceLine" ref={confidenceLineCanvasRef}></canvas>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Resultados;