from django.apps import AppConfig

class DiagnosticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'app.src.diagnostics'
    verbose_name = 'Módulo de Diagnósticos'  # Opcional: solo para que se vea bonito en admin