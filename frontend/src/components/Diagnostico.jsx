import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';
import CameraModal from './CameraModal';

// Importar CSS
import '../css/diagnostico/manejo_archivos.css';
import '../css/diagnostico/nivel_riesgo.css';
import '../css/diagnostico/diagnostic_grafica.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function Diagnostico({ onDiagnosisComplete, hasDiagnostics }) {
    const [currentFile, setCurrentFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);
    let probChart = useRef(null);

    // Log de montaje/desmontaje
    useEffect(() => {
        errorCapture.logAction('Diagnostico', 'MOUNT', 'Componente Diagnostico montado');
        initializeEmptyChart();
        return () => {
            errorCapture.logAction('Diagnostico', 'UNMOUNT', 'Componente Diagnostico desmontado');
            if (probChart.current) {
                probChart.current.destroy();
            }
        };
    }, []);

    const initializeEmptyChart = () => {
        const ctx = document.getElementById('probChart')?.getContext('2d');
        if (!ctx) return;

        if (probChart.current) {
            probChart.current.destroy();
        }

        probChart.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Benigno', 'Maligno', 'Premaligno', 'Desconocido'],
                datasets: [{
                    label: 'Probabilidad (%)',
                    data: [0, 0, 0, 0],
                    backgroundColor: 'rgba(200, 200, 200, 0.2)',
                    borderColor: 'rgba(200, 200, 200, 0.5)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, max: 100 } },
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    };

    const resetChartToEmpty = () => {
        if (probChart.current) {
            probChart.current.destroy();
            initializeEmptyChart();
        }
    };

    // Agrupar probabilidades de 9 clases en 4 categorías
    const aggregateProbabilities = (probs) => {
        let benignoSum = 0;
        let malignoSum = 0;
        let premaligno = 0;
        let desconocido = 0;

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

    const getRecommendationForClass = (className, categoria) => {
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
        return recomendaciones[className] || `Resultado: ${className} (${categoria}). Consulta con un especialista.`;
    };

    const getInterpretationForClass = (className, categoria) => {
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

    const showPrediction = (data) => {
        errorCapture.logAction('Diagnostico', 'SHOW_PREDICTION', 'Mostrando resultados de predicción', {
            predicted_class: data.predicted_class,
            categoria: data.categoria,
            confidence: data.confidence
        });

        const aggregatedProbs = aggregateProbabilities(data.probabilities);
        const labels = ['Benigno', 'Maligno', 'Premaligno', 'Desconocido'];
        const probsValues = [
            aggregatedProbs['Benigno'],
            aggregatedProbs['Maligno'],
            aggregatedProbs['Premaligno'],
            aggregatedProbs['Desconocido']
        ];

        const recomendacion = getRecommendationForClass(data.predicted_class, data.categoria);
        const interpretacion = getInterpretationForClass(data.predicted_class, data.categoria);

        let icon = '';
        let categoryText = '';
        let categoryClass = '';

        switch (data.categoria) {
            case 'Maligno':
                icon = '🟥';
                categoryText = `Maligno - ${data.predicted_class}`;
                categoryClass = 'category-maligno';
                break;
            case 'Benigno':
                icon = '🟩';
                categoryText = `Benigno - ${data.predicted_class}`;
                categoryClass = 'category-benigno';
                break;
            case 'Premaligno':
                icon = '🟧';
                categoryText = `Premaligno`;
                categoryClass = 'category-premaligno';
                break;
            default:
                icon = '🟨';
                categoryText = `Desconocido`;
                categoryClass = 'category-desconocido';
        }

        // Actualizar elementos del DOM
        const riskIndicator = document.getElementById('riskIndicator');
        if (riskIndicator) riskIndicator.classList.remove('hidden');

        const categoryIcon = document.getElementById('categoryIcon');
        const categoryTextEl = document.getElementById('categoryText');
        const interpretationText = document.getElementById('interpretationText');
        const recommendationText = document.getElementById('recommendationText');
        const confidenceText = document.getElementById('confidenceText');
        const categoryDisplay = document.getElementById('categoryDisplay');
        const resultBox = document.getElementById('resultBox');

        if (categoryIcon) categoryIcon.textContent = icon;
        if (categoryTextEl) categoryTextEl.textContent = categoryText;
        if (interpretationText) interpretationText.textContent = interpretacion;
        if (recommendationText) {
            recommendationText.textContent = recomendacion;
            recommendationText.style.display = 'block';
        }

        let confidenceMessage = `Confianza del modelo: ${data.confidence}%`;
        if (data.confidence > 90) confidenceMessage += " - Alta confianza";
        else if (data.confidence > 70) confidenceMessage += " - Confianza moderada";
        else confidenceMessage += " - Confianza baja, se recomienda revisión profesional";
        if (confidenceText) confidenceText.textContent = confidenceMessage;

        if (categoryDisplay) categoryDisplay.className = `category-display ${categoryClass}`;
        if (resultBox) resultBox.classList.add('has-results');

        // Posición del marcador de riesgo
        const riskMarker = document.querySelector('.risk-marker');
        let markerPosition = 50;
        if (data.categoria === 'Benigno') markerPosition = 12.5;
        else if (data.categoria === 'Maligno') markerPosition = 37.5;
        else if (data.categoria === 'Premaligno') markerPosition = 62.5;
        else if (data.categoria === 'Desconocido') markerPosition = 87.5;
        if (riskMarker) riskMarker.style.left = `${markerPosition}%`;

        // Actualizar gráfica
        if (probChart.current) probChart.current.destroy();
        const ctx = document.getElementById('probChart')?.getContext('2d');
        if (ctx) {
            probChart.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Probabilidad (%)',
                        data: probsValues,
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(220, 53, 69, 0.8)',
                            'rgba(255, 140, 0, 0.8)',
                            'rgba(255, 193, 7, 0.8)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(220, 53, 69, 1)',
                            'rgba(255, 140, 0, 1)',
                            'rgba(255, 193, 7, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, max: 100, title: { display: true, text: 'Probabilidad (%)' } },
                        x: { title: { display: true, text: 'Categorías' } }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const category = context.label;
                                    const value = context.parsed.y;
                                    let detail = '';
                                    if (category === 'Benigno') {
                                        const benignas = ['Benigno General', 'Nevo Lunar', 'Dermatofibroma', 'Queratosis Seborreica'];
                                        const probsBenignas = data.probabilities.slice(0, 4);
                                        detail = benignas.map((c, i) => `${c}: ${(probsBenignas[i] * 100).toFixed(2)}%`).join(', ');
                                    } else if (category === 'Maligno') {
                                        const malignas = ['Melanoma', 'Carcinoma Basocelular', 'Carcinoma Escamocelular'];
                                        const probsMalignas = data.probabilities.slice(4, 7);
                                        detail = malignas.map((c, i) => `${c}: ${(probsMalignas[i] * 100).toFixed(2)}%`).join(', ');
                                    } else if (category === 'Premaligno') {
                                        const prem = data.probabilities[7];
                                        detail = `Premaligno: ${(prem * 100).toFixed(2)}%`;
                                    } else if (category === 'Desconocido') {
                                        const desc = data.probabilities[8];
                                        detail = `Desconocido: ${(desc * 100).toFixed(2)}%`;
                                    }
                                    return [`Probabilidad total: ${value.toFixed(2)}%`, `Desglose: ${detail}`];
                                }
                            }
                        },
                        legend: { display: false }
                    }
                }
            });
        }

        setResult(data);
    };

    const handleFiles = (files) => {
        const file = files[0];
        if (!file) return;

        errorCapture.logAction('Diagnostico', 'FILE_SELECTED', 'Usuario seleccionó un archivo', {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type
        });

        if (!file.type.startsWith('image/')) {
            errorCapture.logWarning('Diagnostico', 'INVALID_FILE_TYPE', 'Tipo de archivo no válido', {
                file_type: file.type
            });
            Swal.fire({
                icon: "error",
                title: "Tipo de archivo no válido",
                text: "Por favor, suba una imagen válida (JPG, PNG, etc.).",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#d9534f"
            });
            return;
        }

        setCurrentFile(file);
        setPreviewUrl(URL.createObjectURL(file));

        // Cambiar UI
        if (dropZoneRef.current) {
            dropZoneRef.current.classList.add('has-image');
            const textElement = dropZoneRef.current.querySelector('p');
            if (textElement) textElement.style.display = 'none';
        }

        const initialMessage = document.getElementById('initialMessage');
        const infoMessage = document.getElementById('infoMessage');
        const imageLoadedMessage = document.getElementById('imageLoadedMessage');

        if (initialMessage) initialMessage.classList.add('hidden');
        if (infoMessage) infoMessage.classList.add('hidden');
        if (imageLoadedMessage) imageLoadedMessage.classList.remove('hidden');
    };

    const handleDeleteImage = () => {
        errorCapture.logAction('Diagnostico', 'DELETE_IMAGE', 'Usuario eliminó la imagen seleccionada', {
            had_result: !!result,
            file_name: currentFile?.name
        });

        setCurrentFile(null);
        setPreviewUrl(null);
        setResult(null);

        if (dropZoneRef.current) {
            dropZoneRef.current.classList.remove('has-image');
            const textElement = dropZoneRef.current.querySelector('p');
            if (textElement) textElement.style.display = 'block';
        }

        const riskIndicator = document.getElementById('riskIndicator');
        const categoryIcon = document.getElementById('categoryIcon');
        const categoryText = document.getElementById('categoryText');
        const interpretationText = document.getElementById('interpretationText');
        const recommendationText = document.getElementById('recommendationText');
        const confidenceText = document.getElementById('confidenceText');
        const categoryDisplay = document.getElementById('categoryDisplay');
        const resultBox = document.getElementById('resultBox');
        const initialMessage = document.getElementById('initialMessage');
        const infoMessage = document.getElementById('infoMessage');
        const imageLoadedMessage = document.getElementById('imageLoadedMessage');

        if (riskIndicator) riskIndicator.classList.add('hidden');
        if (categoryIcon) categoryIcon.textContent = '';
        if (categoryText) categoryText.textContent = 'Esperando análisis...';
        if (interpretationText) interpretationText.textContent = 'Suba una imagen para comenzar el análisis.';
        if (recommendationText) {
            recommendationText.textContent = '';
            recommendationText.style.display = 'none';
        }
        if (confidenceText) confidenceText.textContent = '';
        if (categoryDisplay) categoryDisplay.className = 'category-display';
        if (resultBox) resultBox.classList.remove('has-results');
        if (initialMessage) initialMessage.classList.remove('hidden');
        if (infoMessage) infoMessage.classList.remove('hidden');
        if (imageLoadedMessage) imageLoadedMessage.classList.add('hidden');

        resetChartToEmpty();

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handlePredict = async () => {
        if (!currentFile) {
            errorCapture.logWarning('Diagnostico', 'PREDICT_NO_FILE', 'Intento de análisis sin imagen');
            return;
        }

        errorCapture.logAction('Diagnostico', 'PREDICT_START', 'Iniciando análisis de imagen', {
            file_name: currentFile.name,
            file_size: currentFile.size
        });

        setAnalyzing(true);
        const token = localStorage.getItem('token');
        const startTime = Date.now();

        const formData = new FormData();
        formData.append('image', currentFile);

        try {
            const response = await fetch('/api/predict/', {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });

            const duration = Date.now() - startTime;
            const data = await response.json();

            if (response.ok) {
                errorCapture.logAction('Diagnostico', 'PREDICT_SUCCESS', 'Análisis completado exitosamente', {
                    predicted_class: data.predicted_class,
                    categoria: data.categoria,
                    confidence: data.confidence,
                    duration_ms: duration
                });
                showPrediction(data);
                if (onDiagnosisComplete) onDiagnosisComplete();
            } else {
                errorCapture.logError('Diagnostico', 'PREDICT_FAILED', 'Error en análisis', {
                    error: data.error,
                    status: response.status,
                    duration_ms: duration
                });
                Swal.fire({
                    icon: "error",
                    title: "Error en el análisis",
                    text: "Ocurrió un error: " + (data.error || 'desconocido'),
                    confirmButtonText: "Entendido",
                    confirmButtonColor: "#d9534f"
                });
            }
        } catch (error) {
            errorCapture.logError('Diagnostico', 'PREDICT_ERROR', 'Error de conexión en análisis', {
                error_message: error.message,
                error_stack: error.stack
            });
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo conectar con el servidor: " + error.message,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#d9534f"
            });
        } finally {
            setAnalyzing(false);
        }
    };

    const handleTakePhoto = () => {
        errorCapture.logAction('Diagnostico', 'TAKE_PHOTO', 'Usuario abrió la cámara');
        setShowCamera(true);
    };

    const handleCameraCapture = (file) => {
        errorCapture.logAction('Diagnostico', 'CAMERA_CAPTURE', 'Foto capturada desde cámara', {
            file_name: file.name,
            file_size: file.size
        });
        handleFiles([file]);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        errorCapture.logAction('Diagnostico', 'DRAG_DROP', 'Usuario arrastró y soltó un archivo');
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            handleFiles(e.dataTransfer.files);
        }
    };

    return (
        <section className="view" id="diagnose">
            <h2>Hacer diagnóstico</h2>
            <div className="upload-panel">
                <div className="drop-zone-container">
                    <div
                        ref={dropZoneRef}
                        id="dropZone"
                        className={`drop-zone ${isDragging ? 'drag' : ''}`}
                        onClick={() => {
                            errorCapture.logAction('Diagnostico', 'CLICK_UPLOAD', 'Usuario hizo clic para subir imagen');
                            fileInputRef.current?.click();
                        }}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="upload-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p>Arrastra o haz clic para subir una imagen</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            id="imageInput"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                        />
                        {previewUrl && <img id="preview" src={previewUrl} alt="" className="preview" />}
                    </div>

                    <div className="buttons-container">
                        <button
                            id="btnTakePhoto"
                            className="primary take-photo-btn"
                            onClick={handleTakePhoto}
                        >
                            <ion-icon name="camera-outline"></ion-icon>
                            <span>Tomar Foto</span>
                        </button>
                        <button
                            id="btnPredict"
                            className="primary analyze-btn"
                            disabled={!currentFile || analyzing}
                            onClick={handlePredict}
                        >
                            <ion-icon name="analytics-outline"></ion-icon>
                            <span>{analyzing ? 'Analizando...' : 'Analizar imagen'}</span>
                        </button>
                        <button
                            id="btnDelete"
                            className="secondary delete-btn"
                            disabled={!currentFile}
                            onClick={handleDeleteImage}
                        >
                            <ion-icon name="trash-outline"></ion-icon>
                            <span>Eliminar imagen</span>
                        </button>
                    </div>

                    <div id="initialMessage" className="message-card motivation-card">
                        <h4>💡 Comienza tu diagnóstico</h4>
                        <p>Sube una imagen de tu lesión cutánea para obtener un análisis instantáneo utilizando inteligencia artificial.</p>
                    </div>

                    <div id="infoMessage" className="message-card info-card">
                        <h4>📋 Recomendaciones para la imagen</h4>
                        <p>Asegúrate de que la imagen sea clara, esté bien iluminada y muestre claramente la lesión cutánea.</p>
                    </div>

                    <div id="imageLoadedMessage" className="message-card success-card hidden">
                        <h4>✔ Imagen cargada correctamente</h4>
                        <p>Cuando estés listo, presiona <strong>Analizar imagen</strong> para obtener tu resultado.</p>
                    </div>
                </div>

                <div className="controls">
                    <div id="resultBox" className="result-box">
                        <h3>Resultado del análisis</h3>

                        <div id="riskIndicator" className="risk-indicator hidden">
                            <div className="risk-scale">
                                <div className="risk-segment benigno-risk">
                                    <span>🟩 Benigno</span>
                                </div>
                                <div className="risk-segment maligno-risk">
                                    <span>🟥 Maligno</span>
                                </div>
                                <div className="risk-segment premaligno-risk">
                                    <span>🟧 Premaligno</span>
                                </div>
                                <div className="risk-segment desconocido-risk">
                                    <span>🟨 Desconocido</span>
                                </div>
                            </div>
                            <div className="risk-marker"></div>
                        </div>

                        <div id="resultContent" className="result-content">
                            <div id="categoryDisplay" className="category-display">
                                <span id="categoryIcon" className="category-icon"></span>
                                <span id="categoryText" className="category-text">Esperando análisis...</span>
                            </div>
                            <p id="interpretationText" className="interpretation-text">Suba una imagen para comenzar el análisis.</p>
                            <p id="recommendationText" className="recommendation-text"></p>
                            <p id="confidenceText" className="confidence-text"></p>
                        </div>

                        <div style={{ width: '100%', marginTop: '15px' }}>
                            <canvas id="probChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <CameraModal
                isOpen={showCamera}
                onClose={() => {
                    errorCapture.logAction('Diagnostico', 'CAMERA_CLOSE', 'Modal de cámara cerrado');
                    setShowCamera(false);
                }}
                onCapture={handleCameraCapture}
            />
        </section>
    );
}

export default Diagnostico;