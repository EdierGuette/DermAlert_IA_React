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
  const scrollTimeoutRef = useRef(null);
  const chartInstancesRef = useRef({ probChart: null, specificChart: null });

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

  // Destruir gráficas existentes
  const destroyDiagnosticoCharts = () => {
    if (chartInstancesRef.current.probChart) {
      chartInstancesRef.current.probChart.destroy();
      chartInstancesRef.current.probChart = null;
    }
    if (chartInstancesRef.current.specificChart) {
      chartInstancesRef.current.specificChart.destroy();
      chartInstancesRef.current.specificChart = null;
    }
  };

  // Dibujar gráficas del diagnóstico seleccionado
  const drawDiagnosticoCharts = (diagnostico) => {
    if (!diagnostico) return;
    
    destroyDiagnosticoCharts();
    
    const aggregated = aggregateProbs(diagnostico.probabilidades);
    const categories = ['Benigno', 'Maligno', 'Premaligno', 'Desconocido'];
    const categoryValues = [aggregated.Benigno, aggregated.Maligno, aggregated.Premaligno, aggregated.Desconocido];

    // Gráfica de categorías
    if (probChartCanvasRef.current) {
      chartInstancesRef.current.probChart = new Chart(probChartCanvasRef.current, {
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
      chartInstancesRef.current.specificChart = new Chart(specificClassesCanvasRef.current, {
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
  };

  // Mostrar diagnóstico específico
  const showDiagnosticoInResults = (diagnostico) => {
    console.log('showDiagnosticoInResults llamado con:', diagnostico);
    setSelectedDiagnostico(diagnostico);
    
    // Esperar a que React actualice el DOM y luego dibujar gráficas
    setTimeout(() => {
      drawDiagnosticoCharts(diagnostico);
      // Scroll al resultado
      const resultCard = document.getElementById('resultCard');
      if (resultCard) {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Dibujar gráficas agregadas (estadísticas generales)
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

      // Destruir gráficas existentes
      if (classDistChart) {
        classDistChart.destroy();
      }
      if (confidenceLineChart) {
        confidenceLineChart.destroy();
      }

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

  // Exponer función global
  useEffect(() => {
    window.showDiagnosticoInResults = showDiagnosticoInResults;
    drawAggregatedCharts();
    
    return () => {
      if (classDistChart) classDistChart.destroy();
      if (confidenceLineChart) confidenceLineChart.destroy();
      destroyDiagnosticoCharts();
      delete window.showDiagnosticoInResults;
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

      {/* Tarjeta de resultados (visible solo cuando hay un diagnóstico seleccionado) */}
      <div id="resultCard" className={`result-card ${selectedDiagnostico ? '' : 'hidden'}`}>
        <div className="card-header">
          <h3>Resultados del Examen</h3>
        </div>
        <div className="card-body">
          <div className="diagnostico-info-table">
            <table className="info-table">
              <tbody>
                <tr>
                  <td className="info-label">ID:</td>
                  <td className="info-value">{selectedDiagnostico ? (selectedDiagnostico.displayId || selectedDiagnostico.id) : '—'}</td>
                  <td className="info-label">Nombre completo:</td>
                  <td className="info-value">{selectedDiagnostico ? selectedDiagnostico.paciente_nombre || 'N/A' : '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Identificación:</td>
                  <td className="info-value">{selectedDiagnostico ? selectedDiagnostico.paciente_identificacion || 'N/A' : '—'}</td>
                  <td className="info-label">Fecha:</td>
                  <td className="info-value">{selectedDiagnostico ? new Date(selectedDiagnostico.fecha).toLocaleString('es-CO') : '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Categoría:</td>
                  <td className="info-value">{selectedDiagnostico ? selectedDiagnostico.categoria : '—'}</td>
                  <td className="info-label">Tipo de lesión:</td>
                  <td className="info-value">{selectedDiagnostico ? selectedDiagnostico.clase : '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Riesgo:</td>
                  <td className="info-value">{selectedDiagnostico ? getRiskText(selectedDiagnostico.categoria) : '—'}</td>
                  <td className="info-label">Código CIE-10:</td>
                  <td className="info-value">{selectedDiagnostico ? getCie10CodeFromDiagnostico(selectedDiagnostico) : '—'}</td>
                </tr>
                <tr>
                  <td className="info-label">Confianza IA:</td>
                  <td className="info-value">{selectedDiagnostico ? `${selectedDiagnostico.confianza}%` : '—'}</td>
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
                {selectedDiagnostico && selectedDiagnostico.imagen ? (
                  <img 
                    src={selectedDiagnostico.imagen.startsWith('data:image') ? 
                      selectedDiagnostico.imagen : 
                      `data:image/jpeg;base64,${selectedDiagnostico.imagen}`} 
                    alt="Imagen del diagnóstico" 
                    className="imagen-preview-result" 
                  />
                ) : (
                  <div className="no-image">No hay imagen disponible</div>
                )}
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
                  <p>{selectedDiagnostico ? getInterpretationText(selectedDiagnostico.clase, selectedDiagnostico.categoria) : '—'}</p>
                </div>
                <div className="recomendacion-item">
                  <strong>Recomendación:</strong>
                  <p className="recommendation-box-result">
                    {selectedDiagnostico ? getRecommendationText(selectedDiagnostico.clase, selectedDiagnostico.categoria) : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="graphs-row">
            <div className="graph-column">
              <div className="graph-container">
                <h4 className="graph-title">📊 Distribución por categorías</h4>
                <div className="graph-wrapper">
                  <canvas id="probChartId" ref={probChartCanvasRef}></canvas>
                </div>
              </div>
            </div>
            <div className="graph-column">
              <div className="graph-container">
                <h4 className="graph-title">🔬 Desglose por tipo de lesión</h4>
                <div className="graph-wrapper">
                  <canvas id="specificClassesChart" ref={specificClassesCanvasRef}></canvas>
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