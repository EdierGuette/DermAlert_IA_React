import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/diagnostico/camara.css';

// Importar ErrorCapture para logs
import errorCapture from '../services/errorCapture';

function CameraModal({ isOpen, onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Log cuando se abre/cierra el modal
    useEffect(() => {
        if (isOpen) {
            errorCapture.logAction('CameraModal', 'MODAL_OPEN', 'Modal de cámara abierto');
            iniciarCamara();
        } else {
            detenerCamara();
        }

        return () => {
            detenerCamara();
        };
    }, [isOpen]);

    const iniciarCamara = async () => {
        errorCapture.logAction('CameraModal', 'CAMERA_START', 'Intentando iniciar cámara');
        const startTime = Date.now();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                await videoRef.current.play();
                setIsCameraReady(true);
                
                const duration = Date.now() - startTime;
                errorCapture.logAction('CameraModal', 'CAMERA_SUCCESS', 'Cámara iniciada correctamente', {
                    duration_ms: duration,
                    videoWidth: videoRef.current.videoWidth,
                    videoHeight: videoRef.current.videoHeight
                });
            }
        } catch (error) {
            const duration = Date.now() - startTime;
            errorCapture.logError('CameraModal', 'CAMERA_ERROR', 'Error al acceder a la cámara', {
                error_message: error.message,
                error_name: error.name,
                duration_ms: duration
            });
            
            Swal.fire({
                icon: "error",
                title: "Error de cámara",
                text: "No se pudo acceder a la cámara. Asegúrate de permitir el acceso.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#d9534f"
            });
            onClose();
        }
    };

    const detenerCamara = () => {
        if (streamRef.current) {
            errorCapture.logAction('CameraModal', 'CAMERA_STOP', 'Deteniendo cámara');
            
            streamRef.current.getTracks().forEach(track => {
                errorCapture.logAction('CameraModal', 'CAMERA_TRACK_STOP', `Deteniendo track: ${track.kind}`, {
                    track_id: track.id,
                    enabled: track.enabled
                });
                track.stop();
            });
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
    };

    const capturarFoto = () => {
        if (videoRef.current && canvasRef.current && isCameraReady) {
            errorCapture.logAction('CameraModal', 'PHOTO_CAPTURE', 'Capturando foto');
            
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    errorCapture.logAction('CameraModal', 'PHOTO_SUCCESS', 'Foto capturada correctamente', {
                        blob_size: blob.size,
                        blob_type: blob.type,
                        width: canvasRef.current.width,
                        height: canvasRef.current.height
                    });
                    
                    const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                    onCapture(file);
                    
                    Swal.fire({
                        icon: "success",
                        title: "✅ Foto tomada exitosamente",
                        text: "La foto se ha capturado correctamente.",
                        confirmButtonText: "Entendido",
                        confirmButtonColor: "#2f7a7a",
                        timer: 2000
                    }).then(() => {
                        errorCapture.logAction('CameraModal', 'PHOTO_CLOSE', 'Cerrando modal después de capturar foto');
                        onClose();
                    });
                } else {
                    errorCapture.logError('CameraModal', 'PHOTO_ERROR', 'Error al capturar foto: blob es null');
                }
            }, 'image/jpeg', 0.8);
        } else {
            errorCapture.logWarning('CameraModal', 'PHOTO_ERROR', 'No se pudo capturar foto - cámara no lista', {
                isCameraReady: isCameraReady,
                hasVideo: !!videoRef.current,
                hasCanvas: !!canvasRef.current
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-modal">
            <div className="camera-modal-content">
                <div className="camera-header">
                    <h3>Tomar Foto</h3>
                    <button className="close-camera-btn" onClick={() => {
                        errorCapture.logAction('CameraModal', 'MODAL_CLOSE', 'Modal de cámara cerrado por usuario');
                        onClose();
                    }}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div className="camera-preview">
                    <video ref={videoRef} id="cameraVideo" autoPlay playsInline></video>
                    <canvas ref={canvasRef} id="cameraCanvas" className="hidden"></canvas>
                </div>
                <div className="camera-controls">
                    <button 
                        className="capture-btn" 
                        onClick={capturarFoto} 
                        disabled={!isCameraReady}
                        onMouseDown={() => errorCapture.logAction('CameraModal', 'BUTTON_CLICK', 'Botón Capturar presionado')}
                    >
                        <ion-icon name="camera-outline"></ion-icon>
                        <span>Capturar Foto</span>
                    </button>
                    <button 
                        className="close-camera-controls-btn" 
                        onClick={() => {
                            errorCapture.logAction('CameraModal', 'MODAL_CLOSE', 'Modal de cámara cerrado desde botón inferior');
                            onClose();
                        }}
                    >
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cerrar Cámara</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CameraModal;