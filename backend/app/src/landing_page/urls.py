from django.urls import path
from . import views

urlpatterns = [
    path('', views.landing_view, name='landing'),
    path('qr-diagnostico/', views.qr_redirect_view, name='qr_diagnostico'),
    path('api/enviar-contacto/', views.enviar_contacto, name='enviar_contacto'),
    path('api/estadisticas/', views.api_estadisticas, name='api_estadisticas'),
]