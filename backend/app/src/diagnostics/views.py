import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

import time
import json
import traceback
from io import BytesIO
import base64

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from PIL import Image, ImageOps
import numpy as np
from keras.models import load_model

# Importar modelos y serializadores
from .models import Usuario, Diagnostico, Auditoria
from .serializers import UsuarioSerializer, LoginSerializer, DiagnosticoSerializer

# Importar sistema de logs
import sys
from pathlib import Path

# Agregar backend a la ruta para importar backend_logger
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from backend_logger import log, log_error

# ============================================
# CONSTANTES Y CONFIGURACIÓN
# ============================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODEL_PATH = os.path.join(BASE_DIR, 'keras_model.h5')
LABELS_PATH = os.path.join(BASE_DIR, 'labels.txt')

# --- CARGA DIFERIDA (LAZY LOADING) DEL MODELO ---
_model = None
_class_names = []

def get_model():
    """Carga el modelo bajo demanda, la primera vez que se necesita."""
    global _model
    if _model is None:
        try:
            log('INFO', 'MODELO', 'Cargando modelo de IA...')
            _model = load_model(MODEL_PATH, compile=False)
            log('INFO', 'MODELO', 'Modelo cargado exitosamente')
        except Exception as e:
            log_error('MODELO', 'Error cargando modelo', e)
    return _model

def get_class_names():
    """Carga las etiquetas bajo demanda."""
    global _class_names
    if not _class_names:
        try:
            with open(LABELS_PATH, 'r', encoding='utf-8') as f:
                _class_names = [line.strip().split(' ', 1)[1] for line in f.readlines() if line.strip()]
            log('INFO', 'MODELO', f'Etiquetas cargadas: {len(_class_names)} clases')
        except Exception as e:
            log_error('MODELO', 'Error cargando labels', e)
            _class_names = ['Desconocido'] * 9
    return _class_names

# --- Mapeo de clases a códigos CIE-10 ---
CIE10_MAPPING = {
    'Benigno General': 'D23.9',
    'Nevo Lunar': 'D22.9',
    'Dermatofibroma': 'D23.9',
    'Queratosis Seborreica': 'L82',
    'Melanoma': 'C43.9',
    'Carcinoma Basocelular': 'C44.9',
    'Carcinoma Escamocelular': 'C44.9',
    'Premaligno': 'L57.0',
    'Desconocido': 'R22.9'
}

def get_cie10_code(class_name):
    return CIE10_MAPPING.get(class_name, 'R22.9')

def map_clase_to_categoria(clase_nombre):
    benignas = ['Benigno General', 'Nevo Lunar', 'Dermatofibroma', 'Queratosis Seborreica']
    malignas = ['Melanoma', 'Carcinoma Basocelular', 'Carcinoma Escamocelular']
    if clase_nombre == 'Premaligno':
        return 'Premaligno'
    if clase_nombre == 'Desconocido':
        return 'Desconocido'
    if clase_nombre in benignas:
        return 'Benigno'
    if clase_nombre in malignas:
        return 'Maligno'
    return 'Desconocido'


# ============================================
# API VIEWS - AUTH
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    start_time = time.time()
    identificacion = request.data.get('identificacion', 'unknown')
    
    log('INFO', 'AUTH', f'Intento de registro - Identificación: {identificacion}')
    
    serializer = UsuarioSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        log('INFO', 'AUTH', f'Registro exitoso', {
            'usuario_id': user.id,
            'identificacion': user.identificacion,
            'nombre': f"{user.first_name} {user.last_name}",
            'duration_ms': duration_ms
        })
        
        Auditoria.objects.create(
            usuario=user,
            accion='Registro de usuario',
            detalles={'tipo': 'registro', 'usuario_id': user.id}
        )
        
        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'identificacion': user.identificacion,
                'email': user.email,
                'rol': user.rol,
                'departamento': user.departamento,
                'ciudad': user.ciudad
            }
        })
    
    duration_ms = int((time.time() - start_time) * 1000)
    log('WARNING', 'AUTH', f'Registro fallido', {
        'identificacion': identificacion,
        'errors': serializer.errors,
        'duration_ms': duration_ms
    })
    
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    start_time = time.time()
    identificacion = request.data.get('identificacion', 'unknown')
    
    log('INFO', 'AUTH', f'Intento de login - Identificación: {identificacion}')
    
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        login(request, user)
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        log('INFO', 'AUTH', f'Login exitoso', {
            'usuario_id': user.id,
            'identificacion': user.identificacion,
            'nombre': f"{user.first_name} {user.last_name}",
            'rol': user.rol,
            'duration_ms': duration_ms
        })
        
        Auditoria.objects.create(
            usuario=user,
            accion='Inicio de sesión',
            detalles={'tipo': 'login'}
        )
        
        request.session.cycle_key()
        
        project_name = settings.PROJECT_NAME
        app_version = settings.APP_VERSION
        
        response = Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'identificacion': user.identificacion,
                'email': user.email,
                'rol': user.rol
            },
            'project_name': project_name,
            'app_version': app_version
        })
        
        return response
    
    duration_ms = int((time.time() - start_time) * 1000)
    log('WARNING', 'AUTH', f'Login fallido', {
        'identificacion': identificacion,
        'errors': serializer.errors,
        'duration_ms': duration_ms
    })
    
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    user_identificacion = request.user.identificacion
    
    log('INFO', 'AUTH', f'Cierre de sesión - Usuario: {user_identificacion}')
    
    try:
        request.user.auth_token.delete()
    except:
        pass
    
    logout(request)
    request.session.flush()
    
    return Response({'message': 'Sesión cerrada correctamente'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_verify_password(request):
    start_time = time.time()
    user = request.user
    password = request.data.get('password', '')
    
    log('INFO', 'AUTH', f'Verificación de contraseña - Usuario: {user.identificacion}')
    
    if not password:
        log('WARNING', 'AUTH', 'Verificación fallida - Sin contraseña')
        return Response({'valid': False, 'error': 'Debe proporcionar una contraseña'}, status=400)
    
    if user.check_password(password):
        duration_ms = int((time.time() - start_time) * 1000)
        log('INFO', 'AUTH', f'Verificación exitosa', {'duration_ms': duration_ms})
        return Response({'valid': True})
    else:
        duration_ms = int((time.time() - start_time) * 1000)
        log('WARNING', 'AUTH', f'Verificación fallida - Contraseña incorrecta', {'duration_ms': duration_ms})
        return Response({'valid': False, 'error': 'Contraseña incorrecta'}, status=401)


# ============================================
# API VIEWS - PREDICCIÓN
# ============================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_predict(request):
    start_time = time.time()
    user = request.user
    
    log('INFO', 'PREDICT', f'Inicio de predicción - Usuario: {user.identificacion}')
    
    model = get_model()
    class_names = get_class_names()
    
    if model is None:
        log_error('PREDICT', 'Modelo no disponible', None)
        return Response({'error': 'El modelo de IA no está disponible'}, status=503)
    
    image_file = request.FILES.get('image')
    if image_file is None:
        log('WARNING', 'PREDICT', 'No se proporcionó imagen')
        return Response({'error': 'No file provided'}, status=400)
    
    try:
        # Procesar imagen
        image = Image.open(image_file).convert('RGB')
        size = (224, 224)
        image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
        image_array = np.asarray(image)
        normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        data[0] = normalized_image_array
        
        # Predecir
        prediction = model.predict(data)
        probs = prediction[0].tolist()
        index = int(np.argmax(prediction[0]))
        predicted_class = class_names[index] if index < len(class_names) else "Desconocido"
        confidence = float(prediction[0][index]) * 100.0
        confidence = round(confidence, 2)
        
        categoria = map_clase_to_categoria(predicted_class)
        codigo_cie10 = get_cie10_code(predicted_class)
        
        # Guardar imagen en base64
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        # Guardar diagnóstico
        diagnostico = Diagnostico.objects.create(
            paciente=user,
            clase=predicted_class,
            categoria=categoria,
            confianza=confidence,
            probabilidades=probs,
            imagen=img_str,
            codigo_cie10=codigo_cie10
        )
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        log('INFO', 'PREDICT', f'Predicción completada', {
            'usuario': user.identificacion,
            'diagnostico_id': diagnostico.id,
            'clase': predicted_class,
            'categoria': categoria,
            'confianza': confidence,
            'codigo_cie10': codigo_cie10,
            'duration_ms': duration_ms
        })
        
        Auditoria.objects.create(
            usuario=user,
            accion='Análisis de imagen',
            detalles={'diagnostico_id': diagnostico.id, 'clase': predicted_class, 'categoria': categoria}
        )
        
        return Response({
            'id': diagnostico.id,
            'probabilities': probs,
            'predicted_index': index,
            'predicted_class': predicted_class,
            'categoria': categoria,
            'confidence': confidence,
            'class_names': class_names,
            'codigo_cie10': codigo_cie10
        })
        
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        log_error('PREDICT', f'Error en predicción', e, {
            'usuario': user.identificacion,
            'duration_ms': duration_ms
        })
        return Response({'error': str(e)}, status=500)


# ============================================
# API VIEWS - DIAGNÓSTICOS
# ============================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_diagnosticos(request):
    user = request.user
    
    log('INFO', 'DIAGNOSTICO', f'Listando diagnósticos - Usuario: {user.identificacion}, Rol: {user.rol}')
    
    if user.rol in ['medico', 'administrador']:
        diagnosticos = Diagnostico.objects.all().order_by('-fecha')
        log('INFO', 'DIAGNOSTICO', f'Listados {diagnosticos.count()} diagnósticos (todos)')
    else:
        diagnosticos = Diagnostico.objects.filter(paciente=user).order_by('-fecha')
        log('INFO', 'DIAGNOSTICO', f'Listados {diagnosticos.count()} diagnósticos (propios)')
    
    serializer = DiagnosticoSerializer(diagnosticos, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_diagnostico_by_id(request, id):
    user = request.user
    
    log('INFO', 'DIAGNOSTICO', f'Buscando diagnóstico ID:{id} - Usuario: {user.identificacion}')
    
    try:
        if user.rol in ['medico', 'administrador']:
            diagnostico = Diagnostico.objects.get(id=id)
        else:
            diagnostico = Diagnostico.objects.get(id=id, paciente=user)
        
        log('INFO', 'DIAGNOSTICO', f'Diagnóstico encontrado ID:{id}')
        serializer = DiagnosticoSerializer(diagnostico)
        return Response(serializer.data)
    except Diagnostico.DoesNotExist:
        log('WARNING', 'DIAGNOSTICO', f'Diagnóstico no encontrado ID:{id}')
        return Response({'error': 'Diagnóstico no encontrado'}, status=404)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_diagnostico(request, id):
    user = request.user
    
    log('INFO', 'DIAGNOSTICO', f'Intento de eliminación - Diagnóstico ID:{id}, Usuario: {user.identificacion}')
    
    try:
        if user.rol in ['medico', 'administrador']:
            diagnostico = Diagnostico.objects.get(id=id)
        else:
            diagnostico = Diagnostico.objects.get(id=id, paciente=user)
        
        diagnostico.delete()
        
        log('INFO', 'DIAGNOSTICO', f'Eliminación exitosa - Diagnóstico ID:{id}')
        
        Auditoria.objects.create(
            usuario=user,
            accion='Eliminación de diagnóstico',
            detalles={'diagnostico_id': id}
        )
        
        return Response({'message': 'Diagnóstico eliminado correctamente'})
    except Diagnostico.DoesNotExist:
        log('WARNING', 'DIAGNOSTICO', f'Eliminación fallida - Diagnóstico no encontrado ID:{id}')
        return Response({'error': 'Diagnóstico no encontrado'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_search_diagnosticos(request):
    search_type = request.GET.get('type', 'id')
    value = request.GET.get('value', '')
    user = request.user
    
    log('INFO', 'DIAGNOSTICO', f'Búsqueda - Tipo: {search_type}, Valor: {value}, Usuario: {user.identificacion}')
    
    if search_type == 'id':
        try:
            if user.rol in ['medico', 'administrador']:
                diagnostico = Diagnostico.objects.get(id=value)
            else:
                diagnostico = Diagnostico.objects.get(id=value, paciente=user)
            serializer = DiagnosticoSerializer(diagnostico)
            log('INFO', 'DIAGNOSTICO', f'Diagnóstico encontrado por ID: {value}')
            return Response(serializer.data)
        except Diagnostico.DoesNotExist:
            log('WARNING', 'DIAGNOSTICO', f'Diagnóstico no encontrado por ID: {value}')
            return Response({'error': 'Diagnóstico no encontrado'}, status=404)
    
    elif search_type == 'cedula' and user.rol in ['medico', 'administrador']:
        diagnosticos = Diagnostico.objects.filter(
            paciente__identificacion=value
        ).order_by('-fecha')
        serializer = DiagnosticoSerializer(diagnosticos, many=True)
        log('INFO', 'DIAGNOSTICO', f'Encontrados {diagnosticos.count()} diagnósticos por cédula: {value}')
        return Response(serializer.data)
    
    log('WARNING', 'DIAGNOSTICO', f'Búsqueda inválida - Tipo: {search_type}')
    return Response({'error': 'Búsqueda no válida'}, status=400)


# ============================================
# API VIEWS - LOGS DEL FRONTEND
# ============================================

@api_view(['POST'])
@permission_classes([AllowAny])
def api_frontend_log(request):
    """Recibe logs desde el frontend y los guarda en el sistema unificado"""
    try:
        data = request.data
        
        # Si vienen múltiples logs en un batch
        if 'logs' in data:
            logs_recibidos = data.get('logs', [])
            log('INFO', 'FRONTEND', f'Recibiendo batch de {len(logs_recibidos)} logs')
            
            for log_entry in logs_recibidos:
                level = log_entry.get('level', 'INFO')
                componente = log_entry.get('component', 'Unknown')
                accion = log_entry.get('action', '')
                mensaje = log_entry.get('message', '')
                datos_log = log_entry.get('data', {})
                usuario = log_entry.get('user', None)
                
                texto = f"[{componente}] {accion}: {mensaje}"
                
                from backend_logger import log_frontend
                log_frontend(level, componente, accion, mensaje, datos_log, usuario)
            
            return Response({'status': 'ok', 'count': len(logs_recibidos)})
        else:
            # Log individual
            level = data.get('level', 'INFO')
            componente = data.get('component', 'Unknown')
            accion = data.get('action', '')
            mensaje = data.get('message', '')
            datos_log = data.get('data', {})
            usuario = data.get('user', None)
            
            from backend_logger import log_frontend
            log_frontend(level, componente, accion, mensaje, datos_log, usuario)
            
            return Response({'status': 'ok'})
            
    except Exception as e:
        print(f"Error al recibir log del frontend: {e}")
        return Response({'status': 'error', 'error': str(e)}, status=500)


# ============================================
# API VIEWS - CONFIGURACIÓN GLOBAL
# ============================================

@api_view(['GET'])
@permission_classes([AllowAny])
def api_config(request):
    """
    API pública que devuelve la configuración global de la aplicación
    para que el frontend React pueda leerla dinámicamente.
    """
    log('INFO', 'CONFIG', 'Solicitud de configuración global')
    
    return Response({
        'PROJECT_NAME': settings.PROJECT_NAME,
        'LOGO_ICON': settings.LOGO_ICON,
        'APP_VERSION': settings.APP_VERSION,
        'status': 'ok'
    })