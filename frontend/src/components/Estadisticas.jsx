import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Importar CSS
import '../css/landing_page/estadisticas.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Estadisticas() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        usuarios_hoy: 0,
        usuarios_mes: 0,
        consultas_hoy: 0,
        consultas_totales: 0,
        usuarios_por_dia: [],
        top_departamentos: [],
        top_ciudades: [],
        distribucion_clases: {}
    });

    const usuariosLineChartRef = useRef(null);
    const distribucionPieChartRef = useRef(null);
    let usuariosLineChart = null;
    let distribucionPieChart = null;

    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Estadisticas', 'MOUNT', 'Componente Estadisticas montado');
        return () => {
            errorCapture.logAction('Estadisticas', 'UNMOUNT', 'Componente Estadisticas desmontado');
            if (usuariosLineChart) {
                usuariosLineChart.destroy();
                errorCapture.logAction('Estadisticas', 'CHART_DESTROY', 'Gráfica de líneas destruida');
            }
            if (distribucionPieChart) {
                distribucionPieChart.destroy();
                errorCapture.logAction('Estadisticas', 'CHART_DESTROY', 'Gráfica de pastel destruida');
            }
        };
    }, []);

    // Función para animar contadores
    const animateCounter = (element, target, metricName) => {
        if (!element) return;
        
        errorCapture.logAction('Estadisticas', 'COUNTER_START', `Iniciando animación de contador: ${metricName}`, {
            target_value: target
        });
        
        let current = 0;
        const duration = 1500;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString('es-CO');
                clearInterval(timer);
                errorCapture.logAction('Estadisticas', 'COUNTER_END', `Contador finalizado: ${metricName}`, {
                    final_value: target
                });
            } else {
                element.textContent = Math.floor(current).toLocaleString('es-CO');
            }
        }, stepTime);
    };

    // Renderizar top listas con barras animadas
    const renderTopList = (containerId, data, labelKey, valueKey, listName) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        errorCapture.logAction('Estadisticas', 'RENDER_TOP_LIST', `Renderizando lista: ${listName}`, {
            items_count: data?.length || 0
        });

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="no-data">📭 Aún no hay datos suficientes para mostrar.</p>';
            errorCapture.logWarning('Estadisticas', 'NO_DATA', `No hay datos para: ${listName}`);
            return;
        }

        const maxCount = data[0][valueKey];
        let html = '';
        data.forEach((item, index) => {
            const nombre = escapeHtml(item[labelKey]);
            const count = item[valueKey];
            const percent = (count / maxCount) * 100;
            const animationDelay = index * 0.1;
            html += `
        <div class="top-item" style="animation-delay: ${animationDelay}s;">
          <div class="nombre">${nombre}</div>
          <div class="barra">
            <div class="barra-fill" data-target-width="${percent}" data-count="${count}">${count}</div>
          </div>
        </div>
      `;
        });
        container.innerHTML = html;

        setTimeout(() => {
            container.querySelectorAll('.barra-fill').forEach(bar => {
                const targetWidth = bar.dataset.targetWidth;
                if (targetWidth) {
                    bar.style.width = targetWidth + '%';
                }
            });
        }, 100);
    };

    const escapeHtml = (str) => {
        if (!str) return '';
        return str.replace(/[&<>]/g, function (m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };

    // Dibujar gráfica de líneas (usuarios por día)
    const drawLineChart = (ctx, labels, data) => {
        if (usuariosLineChart) {
            usuariosLineChart.destroy();
            errorCapture.logAction('Estadisticas', 'CHART_DESTROY', 'Gráfica de líneas anterior destruida');
        }

        errorCapture.logAction('Estadisticas', 'DRAW_LINE_CHART', 'Dibujando gráfica de líneas', {
            data_points: labels.length
        });

        usuariosLineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Usuarios registrados',
                    data: data,
                    borderColor: '#2f7a7a',
                    backgroundColor: 'rgba(47,122,122,0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#2f7a7a',
                    pointBorderColor: '#fff',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBorderWidth: 2,
                    tension: 0.3,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#2f7a7a',
                        titleColor: '#fff',
                        bodyColor: '#e8f4f3',
                        callbacks: {
                            label: function (context) {
                                return `📊 Usuarios: ${context.parsed.y}`;
                            }
                        }
                    },
                    legend: {
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            color: '#2f7a7a'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'N° de usuarios', font: { weight: 'bold' } },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        title: { display: true, text: 'Día de la semana', font: { weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
        
        errorCapture.logAction('Estadisticas', 'LINE_CHART_DRAWN', 'Gráfica de líneas dibujada correctamente');
    };

    // Dibujar gráfica de pastel (distribución de CATEGORÍAS)
    const drawPieChart = (ctx, data) => {
        if (distribucionPieChart) {
            distribucionPieChart.destroy();
            errorCapture.logAction('Estadisticas', 'CHART_DESTROY', 'Gráfica de pastel anterior destruida');
        }

        const labels = Object.keys(data);
        const values = Object.values(data);
        
        errorCapture.logAction('Estadisticas', 'DRAW_PIE_CHART', 'Dibujando gráfica de pastel', {
            categories: labels,
            values: values
        });

        const colors = {
            'Maligno': 'rgba(220, 53, 69, 0.8)',
            'Benigno': 'rgba(40, 167, 69, 0.8)',
            'Premaligno': 'rgba(255, 140, 0, 0.8)',
            'Desconocido': 'rgba(255, 193, 7, 0.8)'
        };
        const backgroundColors = labels.map(label => colors[label] || 'rgba(200,200,200,0.8)');

        distribucionPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: '#fff',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                animation: {
                    duration: 1500,
                    easing: 'easeOutBounce'
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#2f7a7a',
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12 },
                            usePointStyle: true,
                            padding: 15
                        }
                    }
                }
            }
        });
        
        errorCapture.logAction('Estadisticas', 'PIE_CHART_DRAWN', 'Gráfica de pastel dibujada correctamente');
    };

    // Cargar datos desde la API
    const cargarEstadisticas = async () => {
        errorCapture.logAction('Estadisticas', 'LOAD_STATS_START', 'Iniciando carga de estadísticas');
        setLoading(true);
        const startTime = Date.now();
        
        try {
            const response = await fetch('/api/estadisticas/');
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            errorCapture.logAction('Estadisticas', 'LOAD_STATS_SUCCESS', 'Estadísticas cargadas exitosamente', {
                duration_ms: duration,
                usuarios_hoy: data.usuarios_hoy,
                usuarios_mes: data.usuarios_mes,
                consultas_hoy: data.consultas_hoy,
                consultas_totales: data.consultas_totales,
                top_departamentos: data.top_departamentos?.length || 0,
                top_ciudades: data.top_ciudades?.length || 0,
                distribucion_clases: Object.keys(data.distribucion_clases || {})
            });

            setStats(data);

            // Animar círculos
            animateCounter(document.getElementById('usuariosHoyCircle'), data.usuarios_hoy, 'usuarios_hoy');
            animateCounter(document.getElementById('usuariosMesCircle'), data.usuarios_mes, 'usuarios_mes');
            animateCounter(document.getElementById('consultasHoyCircle'), data.consultas_hoy, 'consultas_hoy');
            animateCounter(document.getElementById('consultasTotalesCircle'), data.consultas_totales, 'consultas_totales');

            // Gráfica de línea
            const lineCtx = document.getElementById('usuariosLineChart')?.getContext('2d');
            if (lineCtx && data.usuarios_por_dia && data.usuarios_por_dia.length > 0) {
                const labels = data.usuarios_por_dia.map(d => d.fecha);
                const values = data.usuarios_por_dia.map(d => d.count);
                drawLineChart(lineCtx, labels, values);
            } else {
                errorCapture.logWarning('Estadisticas', 'NO_LINE_DATA', 'No hay datos para gráfica de líneas');
            }

            // Gráfica de pastel
            const pieCtx = document.getElementById('distribucionPieChart')?.getContext('2d');
            if (pieCtx && data.distribucion_clases && Object.keys(data.distribucion_clases).length > 0) {
                drawPieChart(pieCtx, data.distribucion_clases);
            } else if (pieCtx) {
                errorCapture.logWarning('Estadisticas', 'NO_PIE_DATA', 'No hay datos para gráfica de pastel');
                const container = document.getElementById('distribucionPieChart')?.parentElement;
                if (container) {
                    const noDataMsg = document.createElement('p');
                    noDataMsg.className = 'no-data';
                    noDataMsg.textContent = '📭 Aún no hay diagnósticos suficientes para mostrar distribución.';
                    container.appendChild(noDataMsg);
                }
            }

            // Renderizar top listas
            renderTopList('departamentos-list', data.top_departamentos, 'departamento', 'count', 'departamentos');
            renderTopList('ciudades-list', data.top_ciudades, 'ciudad', 'count', 'ciudades');

        } catch (error) {
            const duration = Date.now() - startTime;
            errorCapture.logError('Estadisticas', 'LOAD_STATS_ERROR', 'Error cargando estadísticas', {
                error_message: error.message,
                duration_ms: duration
            });
            
            const errorMsg = '<p class="no-data">⚠️ Error al cargar los datos. Intenta más tarde.</p>';
            document.querySelectorAll('.top-list').forEach(el => {
                el.innerHTML = errorMsg;
            });
        } finally {
            setLoading(false);
            errorCapture.logAction('Estadisticas', 'LOAD_STATS_END', 'Carga de estadísticas finalizada', {
                loading_state: false
            });
        }
    };

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    return (
        <section className="estadisticas" id="estadisticas">
            <div className="estadisticas-container">
                {/* Título con icono vectorial */}
                <h2 className="estadisticas-title">
                    <ion-icon name="bar-chart-outline" style={{ fontSize: '48px', marginRight: '15px', verticalAlign: 'middle', color: '#2f7a7a' }}></ion-icon>
                    Estadísticas en tiempo real
                </h2>
                <p className="estadisticas-subtitle">
                    <ion-icon name="people-outline" style={{ fontSize: '18px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                    Datos actualizados de nuestra comunidad y el uso de la IA
                </p>

                {/* Tarjetas con círculos animados */}
                <div className="stats-cards">
                    <div className="stat-card">
                        <div className="circle-container">
                            <div className="circle" id="usuariosHoyCircle">0</div>
                        </div>
                        <h3>
                            <ion-icon name="person-add-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Usuarios hoy
                        </h3>
                        <p>Nuevos registros en las últimas 24h</p>
                    </div>
                    <div className="stat-card">
                        <div className="circle-container">
                            <div className="circle" id="usuariosMesCircle">0</div>
                        </div>
                        <h3>
                            <ion-icon name="calendar-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Usuarios este mes
                        </h3>
                        <p>Registros durante el mes actual</p>
                    </div>
                    <div className="stat-card">
                        <div className="circle-container">
                            <div className="circle" id="consultasHoyCircle">0</div>
                        </div>
                        <h3>
                            <ion-icon name="analytics-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Consultas a la IA hoy
                        </h3>
                        <p>Diagnósticos realizados en el día</p>
                    </div>
                    <div className="stat-card">
                        <div className="circle-container">
                            <div className="circle" id="consultasTotalesCircle">0</div>
                        </div>
                        <h3>
                            <ion-icon name="folder-open-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Consultas totales
                        </h3>
                        <p>Histórico de diagnósticos realizados</p>
                    </div>
                </div>

                {/* Gráficas principales */}
                <div className="charts-row">
                    <div className="chart-wrapper">
                        <h3>
                            <ion-icon name="trending-up-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Usuarios por día (última semana)
                        </h3>
                        <canvas id="usuariosLineChart" width="400" height="250"></canvas>
                    </div>
                    <div className="chart-wrapper">
                        <h3>
                            <ion-icon name="pie-chart-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Distribución de diagnósticos (último mes)
                        </h3>
                        <canvas id="distribucionPieChart" width="400" height="250"></canvas>
                    </div>
                </div>

                {/* Top ubicaciones */}
                <div className="top-locations">
                    <div className="top-departamentos">
                        <h3>
                            <ion-icon name="business-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Departamentos con más registros
                        </h3>
                        <div id="departamentos-list" className="top-list">
                            <p className="loading-msg">Cargando datos...</p>
                        </div>
                    </div>
                    <div className="top-ciudades">
                        <h3>
                            <ion-icon name="location-outline" style={{ fontSize: '22px', marginRight: '8px', verticalAlign: 'middle' }}></ion-icon>
                            Ciudades con más registros
                        </h3>
                        <div id="ciudades-list" className="top-list">
                            <p className="loading-msg">Cargando datos...</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Estadisticas;