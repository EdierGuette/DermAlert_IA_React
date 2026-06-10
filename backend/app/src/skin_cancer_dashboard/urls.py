# app/src/skin_cancer_dashboard/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Vista simple para health check
def health_check(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'API funcionando correctamente'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', health_check, name='health_check'),
    path('', include('app.src.landing_page.urls')),      # APIs: /api/enviar-contacto/, /api/estadisticas/
    path('', include('app.src.diagnostics.urls')),       # APIs: /api/login/, /api/register/, /api/predict/, etc.
]