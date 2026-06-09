import React, { useState, useRef, useEffect } from 'react';
import Swal from 'sweetalert2';

// Importar CSS
import '../css/diagnostico/camara.css';

function CameraModal({ isOpen, onClose, onCapture }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        if (isOpen) {
            iniciarCamara();
        } else {
            detenerCamara();
        }

        return () => {
            detenerCamara();
        };
    }, [isOpen]);

    const iniciarCamara = async () => {
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
            }
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
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
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraReady(false);
    };

    const capturarFoto = () => {
        if (videoRef.current && canvasRef.current && isCameraReady) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

            canvasRef.current.toBlob((blob) => {
                if (blob) {
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
                        onClose();
                    });
                }
            }, 'image/jpeg', 0.8);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-modal">
            <div className="camera-modal-content">
                <div className="camera-header">
                    <h3>Tomar Foto</h3>
                    <button className="close-camera-btn" onClick={onClose}>
                        <ion-icon name="close-outline"></ion-icon>
                    </button>
                </div>
                <div className="camera-preview">
                    <video ref={videoRef} id="cameraVideo" autoPlay playsInline></video>
                    <canvas ref={canvasRef} id="cameraCanvas" className="hidden"></canvas>
                </div>
                <div className="camera-controls">
                    <button className="capture-btn" onClick={capturarFoto} disabled={!isCameraReady}>
                        <ion-icon name="camera-outline"></ion-icon>
                        <span>Capturar Foto</span>
                    </button>
                    <button className="close-camera-controls-btn" onClick={onClose}>
                        <ion-icon name="close-circle-outline"></ion-icon>
                        <span>Cerrar Cámara</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CameraModal;