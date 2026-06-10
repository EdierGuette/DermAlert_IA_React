from django.urls import path
from . import views

urlpatterns = [
    # ============================================
    # API URLs - Landing Page
    # ============================================
    path('api/enviar-contacto/', views.enviar_contacto, name='enviar_contacto'),
    path('api/estadisticas/', views.api_estadisticas, name='api_estadisticas'),
]