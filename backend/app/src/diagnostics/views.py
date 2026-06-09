import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
import warnings
warnings.filterwarnings('ignore')

from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from PIL import Image, ImageOps
import numpy as np
from keras.models import load_model
import json
from .models import Usuario, Diagnostico, Auditoria
from .serializers import UsuarioSerializer, LoginSerializer, DiagnosticoSerializer

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
            print("Cargando modelo por primera vez...")
            _model = load_model(MODEL_PATH, compile=False)
            print("Modelo cargado exitosamente.")
        except Exception as e:
            print(f"Error CRÍTICO cargando modelo: {e}")
            pass
    return _model

def get_class_names():
    """Carga las etiquetas bajo demanda."""
    global _class_names
    if not _class_names:
        try:
            with open(LABELS_PATH, 'r', encoding='utf-8') as f:
                _class_names = [line.strip().split(' ', 1)[1] for line in f.readlines() if line.strip()]
            print("Etiquetas cargadas exitosamente.")
        except Exception as e:
            print(f"Error CRÍTICO cargando labels: {e}")
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
    """Devuelve el código CIE-10 según el nombre de la clase"""
    return CIE10_MAPPING.get(class_name, 'R22.9')

# --- Función auxiliar para mapear clase a categoría ---
def map_clase_to_categoria(clase_nombre):
    """Devuelve la categoría según el nombre de la clase específica"""
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

# --- FIN CARGA DIFERIDA ---

# ========== VISTAS PÚBLICAS (SIN CACHÉ) ==========
@never_cache
def login_view(request):
    """Vista de login - SOLO renderiza el template (para desarrollo, React tomará el control)"""
    print("=== LOGIN_VIEW ===")
    
    if request.user.is_authenticated:
        print("REDIRECT: User already authenticated -> /")
        return redirect('/')
    
    response = render(request, 'diagnostics/login.html', {
        'PROJECT_NAME': settings.PROJECT_NAME,
        'LOGO_ICON': settings.LOGO_ICON
    })
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

@never_cache
def register_view(request):
    """Vista de registro - SOLO renderiza el template"""
    print("=== REGISTER_VIEW ===")
    
    if request.user.is_authenticated:
        print("REDIRECT: User already authenticated -> /")
        return redirect('/')
    
    response = render(request, 'diagnostics/register.html', {
        'PROJECT_NAME': settings.PROJECT_NAME,
        'LOGO_ICON': settings.LOGO_ICON
    })
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

# ========== VISTA PROTEGIDA (REQUIERE LOGIN) ==========
@never_cache
@login_required(login_url='/login/')
def dashboard_view(request):
    """Vista del dashboard - SOLO para usuarios autenticados (React tomará el control)"""
    print("=== DASHBOARD_VIEW ===")
    print(f"User: {request.user}")
    
    if not request.user.is_authenticated:
        print("REDIRECT: User not authenticated -> /login/")
        return redirect('/login/')
    
    response = render(request, 'diagnostics/index.html', {
        'PROJECT_NAME': settings.PROJECT_NAME,
        'LOGO_ICON': settings.LOGO_ICON
    })
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    return response

# ========== API VIEWS ==========
@api_view(['POST'])
@permission_classes([AllowAny])
def api_register(request):
    print("=== API_REGISTER ===")
    serializer = UsuarioSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)

        Auditoria.objects.create(
            usuario=user,
            accion='Registro de usuario',
            detalles={'tipo': 'registro', 'usuario_id': user.id}
        )

        print(f"SUCCESS: User created - {user.identificacion}")
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
    print(f"ERROR: Validation errors - {serializer.errors}")
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    print("=== API_LOGIN ===")
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        login(request, user)
        
        Auditoria.objects.create(
            usuario=user,
            accion='Inicio de sesión',
            detalles={'tipo': 'login'}
        )
        
        print(f"SUCCESS: Login successful - {user.identificacion}")
        
        request.session.cycle_key()
        
        # Obtener el nombre del proyecto desde settings
        from django.conf import settings
        project_name = settings.PROJECT_NAME
        
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
            'project_name': project_name  # Enviar también el nombre del proyecto
        })
        
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
    print(f"ERROR: Validation errors - {serializer.errors}")
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    print("=== API_LOGOUT ===")
    
    try:
        request.user.auth_token.delete()
    except:
        pass
    
    logout(request)
    request.session.flush()
    
    print("SUCCESS: Logout successful")
    
    response = Response({'message': 'Sesión cerrada correctamente'})
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate, private'
    response['Pragma'] = 'no-cache'
    response['Expires'] = '0'
    
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_predict(request):
    """
    Endpoint: POST /api/predict/
    Form data: file field named 'image'
    """
    print("=== API_PREDICT ===")
    
    model = get_model()
    class_names = get_class_names()
    
    if model is None:
        return Response({'error': 'El modelo de IA no está disponible en este momento. Contacte al administrador.'}, status=503)
    if not class_names:
        return Response({'error': 'Las etiquetas del modelo no están disponibles.'}, status=500)

    image_file = request.FILES.get('image')
    if image_file is None:
        return Response({'error': 'No file provided'}, status=400)

    try:
        image = Image.open(image_file).convert('RGB')
        size = (224, 224)
        image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
        image_array = np.asarray(image)
        normalized_image_array = (image_array.astype(np.float32) / 127.5) - 1
        data = np.ndarray(shape=(1, 224, 224, 3), dtype=np.float32)
        data[0] = normalized_image_array

        prediction = model.predict(data)
        probs = prediction[0].tolist()
        index = int(np.argmax(prediction[0]))
        predicted_class = class_names[index] if index < len(class_names) else "Desconocido"
        
        confidence = float(prediction[0][index]) * 100.0
        confidence = round(confidence, 2)

        categoria = map_clase_to_categoria(predicted_class)
        codigo_cie10 = get_cie10_code(predicted_class)

        from io import BytesIO
        import base64
        buffered = BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        diagnostico = Diagnostico.objects.create(
            paciente=request.user,
            clase=predicted_class,
            categoria=categoria,
            confianza=confidence,
            probabilidades=probs,
            imagen=img_str,
            codigo_cie10=codigo_cie10
        )

        Auditoria.objects.create(
            usuario=request.user,
            accion='Análisis de imagen',
            detalles={'diagnostico_id': diagnostico.id, 'clase': predicted_class, 'categoria': categoria, 'codigo_cie10': codigo_cie10}
        )

        print(f"SUCCESS: Prediction completed - {predicted_class} ({categoria}) - CIE-10: {codigo_cie10}, Confidence: {confidence}%")
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
        print(f"ERROR: Prediction failed - {e}")
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_diagnosticos(request):
    """Obtener diagnósticos del usuario"""
    print("=== API_DIAGNOSTICOS ===")
    user = request.user
    if user.rol in ['medico', 'administrador']:
        diagnosticos = Diagnostico.objects.all().order_by('-fecha')
        print(f"SUCCESS: All diagnostics loaded - {diagnosticos.count()} records")
    else:
        diagnosticos = Diagnostico.objects.filter(paciente=user).order_by('-fecha')
        print(f"SUCCESS: User diagnostics loaded - {diagnosticos.count()} records")
    
    serializer = DiagnosticoSerializer(diagnosticos, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_diagnostico_by_id(request, id):
    """Obtener diagnóstico específico por ID"""
    print(f"=== API_DIAGNOSTICO_BY_ID ===")
    print(f"Diagnóstico ID: {id}")
    try:
        user = request.user
        if user.rol in ['medico', 'administrador']:
            diagnostico = Diagnostico.objects.get(id=id)
        else:
            diagnostico = Diagnostico.objects.get(id=id, paciente=user)
        
        print(f"SUCCESS: Diagnosis found - {diagnostico.id}")
        serializer = DiagnosticoSerializer(diagnostico)
        return Response(serializer.data)
    except Diagnostico.DoesNotExist:
        print(f"ERROR: Diagnosis not found - {id}")
        return Response({'error': 'Diagnóstico no encontrado'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_delete_diagnostico(request, id):
    """Eliminar diagnóstico"""
    print(f"=== API_DELETE_DIAGNOSTICO ===")
    print(f"Diagnóstico ID: {id}")
    try:
        user = request.user
        if user.rol in ['medico', 'administrador']:
            diagnostico = Diagnostico.objects.get(id=id)
        else:
            diagnostico = Diagnostico.objects.get(id=id, paciente=user)
        
        diagnostico.delete()
        
        Auditoria.objects.create(
            usuario=user,
            accion='Eliminación de diagnóstico',
            detalles={'diagnostico_id': id}
        )
        
        print(f"SUCCESS: Diagnosis deleted - {id}")
        return Response({'message': 'Diagnóstico eliminado correctamente'})
    except Diagnostico.DoesNotExist:
        print(f"ERROR: Diagnosis not found - {id}")
        return Response({'error': 'Diagnóstico no encontrado'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_search_diagnosticos(request):
    """Buscar diagnósticos por ID o cédula"""
    print("=== API_SEARCH_DIAGNOSTICOS ===")
    search_type = request.GET.get('type', 'id')
    value = request.GET.get('value', '')
    user = request.user
    
    print(f"Search - Type: {search_type}, Value: {value}")
    
    if search_type == 'id':
        try:
            if user.rol in ['medico', 'administrador']:
                diagnostico = Diagnostico.objects.get(id=value)
            else:
                diagnostico = Diagnostico.objects.get(id=value, paciente=user)
            serializer = DiagnosticoSerializer(diagnostico)
            print(f"SUCCESS: Diagnosis found by ID - {value}")
            return Response(serializer.data)
        except Diagnostico.DoesNotExist:
            print(f"ERROR: Diagnosis not found by ID - {value}")
            return Response({'error': 'Diagnóstico no encontrado'}, status=404)
    
    elif search_type == 'cedula' and user.rol in ['medico', 'administrador']:
        diagnosticos = Diagnostico.objects.filter(
            paciente__identificacion=value
        ).order_by('-fecha')
        serializer = DiagnosticoSerializer(diagnosticos, many=True)
        print(f"SUCCESS: Diagnoses found by cedula - {value}, Count: {diagnosticos.count()}")
        return Response(serializer.data)
    
    print(f"ERROR: Invalid search - Type: {search_type}")
    return Response({'error': 'Búsqueda no válida'}, status=400)


# ========== NUEVO ENDPOINT PARA VERIFICAR CONTRASEÑA ==========
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_verify_password(request):
    """
    Endpoint para verificar la contraseña del usuario autenticado
    """
    print("=== API_VERIFY_PASSWORD ===")
    
    password = request.data.get('password', '')
    user = request.user
    
    if not password:
        return Response({'valid': False, 'error': 'Debe proporcionar una contraseña'}, status=400)
    
    if user.check_password(password):
        print(f"SUCCESS: Password verified for user {user.identificacion}")
        return Response({'valid': True})
    else:
        print(f"ERROR: Invalid password for user {user.identificacion}")
        return Response({'valid': False, 'error': 'Contraseña incorrecta'}, status=401)