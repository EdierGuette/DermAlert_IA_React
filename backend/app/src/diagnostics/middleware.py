# middleware.py
import time
import sys
from pathlib import Path
from django.shortcuts import redirect

# Importar backend_logger para logs HTTP
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from backend_logger import log, log_error


# ============================================
# MIDDLEWARE EXISTENTE (PROTECCIÓN DE RUTAS)
# ============================================

class AuthRequiredMiddleware:
    """
    Middleware para proteger todas las rutas excepto las públicas.
    Ahora el frontend es React, pero seguimos protegiendo las rutas del backend
    para que no se acceda directamente a vistas que ya no se usan (login, register, dashboard)
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Rutas públicas que NO requieren autenticación
        public_paths = [
            '/',
            '/login/',
            '/register/',
            '/qr-diagnostico/',
            '/landing/api/enviar-contacto/',
        ]
        
        # APIs públicas (NO requieren autenticación)
        if request.path.startswith('/api/') and (
            'login' in request.path or 
            'register' in request.path or
            'enviar-contacto' in request.path or
            'estadisticas' in request.path or
            'logs/frontend' in request.path
        ):
            return self.get_response(request)
        
        # Archivos estáticos siempre públicos
        if request.path.startswith('/static/'):
            return self.get_response(request)
        
        # Si la ruta actual NO es pública
        if request.path not in public_paths and not request.path.startswith('/api/'):
            # Si el usuario no está autenticado
            if not request.user.is_authenticated:
                return redirect('/login/')
        
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