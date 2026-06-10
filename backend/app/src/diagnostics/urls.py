# diagnostics/urls.py
from django.urls import path
from app.src.diagnostics import views

urlpatterns = [
    # ============================================
    # API URLs - AUTH
    # ============================================
    path('api/register/', views.api_register, name='api_register'),
    path('api/login/', views.api_login, name='api_login'),
    path('api/logout/', views.api_logout, name='api_logout'),
    
    # ============================================
    # API URLs - PREDICCIÓN
    # ============================================
    path('api/predict/', views.api_predict, name='api_predict'),
    
    # ============================================
    # API URLs - DIAGNÓSTICOS
    # ============================================
    path('api/diagnosticos/', views.api_diagnosticos, name='api_diagnosticos'),
    path('api/diagnosticos/<int:id>/', views.api_diagnostico_by_id, name='api_diagnostico_by_id'),
    path('api/diagnosticos/<int:id>/delete/', views.api_delete_diagnostico, name='api_delete_diagnostico'),
    path('api/search-diagnosticos/', views.api_search_diagnosticos, name='api_search_diagnosticos'),
    
    # ============================================
    # API URLs - SEGURIDAD
    # ============================================
    path('api/verify-password/', views.api_verify_password, name='api_verify_password'),
    
    # ============================================
    # API URLs - LOGS
    # ============================================
    path('api/logs/frontend/', views.api_frontend_log, name='api_frontend_log'),
    
    # ============================================
    # API URLs - CONFIGURACIÓN GLOBAL
    # ============================================
    path('api/config/', views.api_config, name='api_config'),
]