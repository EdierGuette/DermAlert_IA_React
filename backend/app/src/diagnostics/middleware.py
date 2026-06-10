# middleware.py
import time
import sys
from pathlib import Path
from django.shortcuts import redirect
from django.conf import settings

# Importar backend_logger para logs HTTP
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from backend_logger import log, log_error


# ============================================
# MIDDLEWARE - PROTECCIÓN DE APIS CON REDIRECCIÓN A REACT
# ============================================

class AuthRequiredMiddleware:
    """
    Middleware para proteger las APIs.
    Si el usuario no está autenticado, redirige al frontend de React.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # APIs públicas (NO requieren autenticación)
        public_apis = [
            '/api/register/',
            '/api/login/',
            '/api/enviar-contacto/',
            '/api/estadisticas/',
            '/api/logs/frontend/',
            '/api/config/',
        ]
        
        # Verificar si es una API pública
        is_public_api = any(request.path.startswith(api) for api in public_apis)
        
        # Archivos estáticos siempre públicos
        if request.path.startswith('/static/'):
            return self.get_response(request)
        
        # Admin de Django (requiere su propia autenticación)
        if request.path.startswith('/admin/'):
            return self.get_response(request)
        
        # Health check (raíz) - público
        if request.path == '/':
            return self.get_response(request)
        
        # Si es una API y NO es pública
        if request.path.startswith('/api/') and not is_public_api:
            # Si el usuario no está autenticado
            if not request.user.is_authenticated:
                log('WARNING', 'AUTH', f'Acceso no autorizado a API: {request.path}, redirigiendo a login', {
                    'ip': request.META.get('REMOTE_ADDR', 'unknown')
                })
                # Redirigir al login de React
                return redirect('http://localhost:5173/login')
        
        response = self.get_response(request)
        return response


# ============================================
# MIDDLEWARE PARA LOGS DE PETICIONES HTTP
# ============================================

class HTTPLoggingMiddleware:
    """
    Middleware que registra TODAS las peticiones HTTP
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Registrar inicio de la petición
        start_time = time.time()
        
        # Obtener información del usuario
        user = 'Anonymous'
        try:
            if hasattr(request, 'user') and request.user.is_authenticated:
                if hasattr(request.user, 'identificacion'):
                    user = request.user.identificacion
                else:
                    user = request.user.username
        except:
            user = 'Unknown'
        
        # Log de inicio de request
        log('INFO', 'HTTP', '▶ REQUEST INICIO', {
            'method': request.method,
            'path': request.path,
            'user': user,
            'ip': request.META.get('REMOTE_ADDR', 'unknown')
        }, 'http_middleware')
        
        # Procesar la petición (llamar al siguiente middleware o vista)
        try:
            response = self.get_response(request)
            
            # Registrar fin de la petición (éxito)
            duration_ms = int((time.time() - start_time) * 1000)
            
            log('INFO', 'HTTP', '◀ REQUEST FIN', {
                'method': request.method,
                'path': request.path,
                'status': response.status_code,
                'duration_ms': duration_ms,
                'user': user
            }, 'http_middleware')
            
            return response
            
        except Exception as e:
            # Registrar error
            duration_ms = int((time.time() - start_time) * 1000)
            
            log('ERROR', 'HTTP', '❌ REQUEST ERROR', {
                'method': request.method,
                'path': request.path,
                'error': str(e),
                'duration_ms': duration_ms,
                'user': user
            }, 'http_middleware')
            
            # Re-lanzar la excepción para que Django la maneje
            raise