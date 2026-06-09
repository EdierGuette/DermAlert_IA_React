# app/src/skin_cancer_dashboard/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('app.src.landing_page.urls')),      # Landing page URLs (incluye /api/enviar-contacto/, /api/estadisticas/)
    path('', include('app.src.diagnostics.urls')),       # Diagnostics URLs (incluye /api/login/, /api/register/, /api/predict/, etc.)
]