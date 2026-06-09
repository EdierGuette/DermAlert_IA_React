# middleware.py
from django.shortcuts import redirect

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
            'estadisticas' in request.path
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