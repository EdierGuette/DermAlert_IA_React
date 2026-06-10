# landing_page/views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta, datetime
import json

# Importar sistema de logs
import sys
from pathlib import Path

# Agregar backend a la ruta para importar backend_logger
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))
from backend_logger import log, log_error

# Importar modelos
from app.src.diagnostics.models import Usuario, Diagnostico


# ============================================
# API - ENVÍO DE CONTACTO
# ============================================

@csrf_exempt
def enviar_contacto(request):
    """API para enviar mensajes de contacto por correo"""
    
    if request.method == 'POST':
        start_time = datetime.now()
        
        log('INFO', 'CONTACTO', 'Nuevo mensaje de contacto recibido')
        
        try:
            data = json.loads(request.body)
            
            nombre = data.get('nombre', '').strip()
            email = data.get('email', '').strip()
            telefono = data.get('telefono', '').strip()
            mensaje = data.get('mensaje', '').strip()
            
            # Validaciones
            if not nombre or not email or not mensaje:
                log('WARNING', 'CONTACTO', 'Campos obligatorios faltantes', {
                    'nombre': bool(nombre),
                    'email': bool(email),
                    'mensaje': bool(mensaje)
                })
                return JsonResponse({
                    'success': False,
                    'error': 'Por favor completa los campos obligatorios'
                }, status=400)
            
            if '@' not in email or '.' not in email:
                log('WARNING', 'CONTACTO', f'Email inválido: {email}')
                return JsonResponse({
                    'success': False,
                    'error': 'Por favor ingresa un correo electrónico válido'
                }, status=400)
            
            # Usar el nombre del proyecto desde settings
            project_name = settings.PROJECT_NAME
            app_version = settings.APP_VERSION
            asunto = f'Nuevo mensaje de {nombre} - {project_name}'
            
            # HTML del correo
            cuerpo = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Nuevo mensaje de contacto</title>
                <style>
                    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                        background: #e8f3f0;
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 15px;
                    }}
                    .container {{ max-width: 480px; width: 100%; margin: 0 auto; }}
                    .card {{
                        background: #ffffff;
                        border-radius: 20px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(47,122,122,0.25);
                    }}
                    .wave-top {{
                        height: 35px;
                        background: linear-gradient(135deg, #2f7a7a, #1e5f5f);
                        position: relative;
                    }}
                    .wave-top svg {{
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        height: 25px;
                        fill: #ffffff;
                    }}
                    .header {{
                        background: linear-gradient(135deg, #2f7a7a, #1e5f5f);
                        padding: 25px 25px 15px 25px;
                        text-align: center;
                    }}
                    .logo {{
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        margin-bottom: 8px;
                    }}
                    .logo-icon {{
                        width: 40px;
                        height: 40px;
                        background: rgba(255,255,255,0.2);
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 22px;
                        font-weight: 700;
                        color: white;
                        border: 2px solid rgba(255,255,255,0.4);
                        transform: rotate(-3deg);
                    }}
                    .logo-text {{
                        font-size: 24px;
                        font-weight: 700;
                        color: white;
                        letter-spacing: 0.5px;
                    }}
                    .logo-text span {{
                        font-weight: 300;
                        opacity: 0.9;
                        color: #d4f0f0;
                    }}
                    .header h2 {{
                        color: white;
                        font-size: 18px;
                        font-weight: 500;
                        opacity: 0.95;
                        margin-top: 5px;
                    }}
                    .version-badge {{
                        display: inline-block;
                        background: rgba(255,255,255,0.2);
                        border-radius: 20px;
                        padding: 2px 10px;
                        font-size: 11px;
                        margin-top: 8px;
                        color: white;
                    }}
                    .body {{
                        padding: 25px 25px 20px 25px;
                        background: #f5fafa;
                    }}
                    .info-box {{
                        background: #ffffff;
                        border-radius: 14px;
                        padding: 18px;
                        margin-bottom: 18px;
                        border: 1px solid #cde5e5;
                    }}
                    .row {{
                        display: flex;
                        margin-bottom: 12px;
                        font-size: 14px;
                        border-bottom: 1px dashed #d0e6e6;
                        padding-bottom: 8px;
                    }}
                    .row:last-child {{
                        margin-bottom: 0;
                        border-bottom: none;
                        padding-bottom: 0;
                    }}
                    .label {{
                        min-width: 75px;
                        color: #2f7a7a;
                        font-weight: 600;
                        font-size: 14px;
                        background: #e8f4f0;
                        padding: 4px 8px;
                        border-radius: 6px;
                        text-align: center;
                    }}
                    .value {{
                        color: #1a3a3a;
                        font-weight: 500;
                        padding: 4px 0 4px 12px;
                        flex: 1;
                        font-size: 14px;
                    }}
                    .message-box {{
                        background: #ffffff;
                        border-radius: 14px;
                        padding: 18px;
                        border: 1px solid #cde5e5;
                    }}
                    .message-title {{
                        color: #2f7a7a;
                        font-weight: 600;
                        font-size: 15px;
                        margin-bottom: 12px;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        background: #e8f4f0;
                        padding: 6px 12px;
                        border-radius: 20px;
                        display: inline-flex;
                    }}
                    .message-content {{
                        background: #f8fefe;
                        padding: 15px;
                        border-radius: 12px;
                        color: #1a3a3a;
                        font-size: 14px;
                        line-height: 1.6;
                        border-left: 4px solid #2f7a7a;
                    }}
                    .wave-bottom {{
                        height: 25px;
                        background: #f5fafa;
                        position: relative;
                    }}
                    .wave-bottom svg {{
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 25px;
                        transform: rotate(180deg);
                        fill: #2f7a7a;
                        opacity: 0.15;
                    }}
                    .footer {{
                        padding: 14px;
                        text-align: center;
                        background: #2f7a7a;
                        font-size: 12px;
                        color: white;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="card">
                        <div class="wave-top">
                            <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
                                <path d="M0,20 L48,22 C96,24,192,28,288,30 C384,32,480,32,576,30 C672,28,768,24,864,22 C960,20,1056,20,1152,22 C1248,24,1344,28,1392,30 L1440,32 L1440,40 L1392,40 C1344,40,1248,40,1152,40 C1056,40,960,40,864,40 C768,40,672,40,576,40 C480,40,384,40,288,40 C192,40,96,40,48,40 L0,40 Z"/>
                            </svg>
                        </div>
                        <div class="header">
                            <div class="logo">
                                <div class="logo-icon">SA</div>
                                <div class="logo-text">{project_name}</div>
                            </div>
                            <h2>Nuevo mensaje de contacto</h2>
                            <div class="version-badge">v{app_version}</div>
                        </div>
                        <div class="body">
                            <div class="info-box">
                                <div class="row">
                                    <div class="label">Nombre</div>
                                    <div class="value">{nombre}</div>
                                </div>
                                <div class="row">
                                    <div class="label">Email</div>
                                    <div class="value">{email}</div>
                                </div>
                                <div class="row">
                                    <div class="label">Teléfono</div>
                                    <div class="value">{telefono or 'No proporcionado'}</div>
                                </div>
                            </div>
                            <div class="message-box">
                                <div class="message-title">
                                    Mensaje
                                </div>
                                <div class="message-content">
                                    {mensaje.replace(chr(10), '<br>')}
                                </div>
                            </div>
                        </div>
                        <div class="wave-bottom">
                            <svg viewBox="0 0 1440 40" preserveAspectRatio="none">
                                <path d="M0,20 L48,22 C96,24,192,28,288,30 C384,32,480,32,576,30 C672,28,768,24,864,22 C960,20,1056,20,1152,22 C1248,24,1344,28,1392,30 L1440,32 L1440,40 L1392,40 C1344,40,1248,40,1152,40 C1056,40,960,40,864,40 C768,40,672,40,576,40 C480,40,384,40,288,40 C192,40,96,40,48,40 L0,40 Z"/>
                            </svg>
                        </div>
                        <div class="footer">
                            {project_name} v{app_version} - Detección temprana de cáncer de piel
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            send_mail(
                asunto,
                '',
                settings.DEFAULT_FROM_EMAIL,
                ['edierjose01@gmail.com'],
                html_message=cuerpo,
                fail_silently=False,
            )
            
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            
            log('INFO', 'CONTACTO', f'Mensaje enviado exitosamente', {
                'nombre': nombre,
                'email': email,
                'telefono': telefono or 'No',
                'duration_ms': duration_ms
            })
            
            return JsonResponse({
                'success': True,
                'message': '¡Mensaje enviado correctamente! Te contactaremos pronto.'
            })
            
        except json.JSONDecodeError as e:
            log_error('CONTACTO', 'Error decodificando JSON', e)
            return JsonResponse({
                'success': False,
                'error': 'Error en el formato de los datos enviados'
            }, status=400)
            
        except Exception as e:
            duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
            log_error('CONTACTO', f'Error enviando correo', e, {
                'duration_ms': duration_ms
            })
            return JsonResponse({
                'success': False,
                'error': 'Hubo un error al enviar el mensaje. Por favor intenta más tarde.'
            }, status=500)
    
    log('WARNING', 'CONTACTO', f'Método no permitido: {request.method}')
    return JsonResponse({'error': 'Método no permitido'}, status=405)


# ============================================
# API - ESTADÍSTICAS PÚBLICAS
# ============================================

def api_estadisticas(request):
    """API pública que retorna estadísticas para la landing page"""
    
    start_time = datetime.now()
    
    log('INFO', 'ESTADISTICAS', 'Solicitud de estadísticas públicas')
    
    try:
        # Obtener fecha y hora actual en la zona horaria de Bogotá
        ahora = timezone.localtime(timezone.now())
        hoy = ahora.date()
        inicio_mes = hoy.replace(day=1)
        
        # Usuarios hoy (desde las 00:00:00 hasta las 23:59:59 en hora local)
        tz = timezone.get_current_timezone()
        inicio_hoy = timezone.make_aware(datetime.combine(hoy, datetime.min.time()), tz)
        fin_hoy = timezone.make_aware(datetime.combine(hoy, datetime.max.time()), tz)
        usuarios_hoy = Usuario.objects.filter(fecha_creacion__range=(inicio_hoy, fin_hoy)).count()
        
        # Usuarios este mes
        usuarios_mes = Usuario.objects.filter(fecha_creacion__date__gte=inicio_mes).count()
        
        # Consultas a la IA hoy (diagnósticos)
        consultas_hoy = Diagnostico.objects.filter(fecha__range=(inicio_hoy, fin_hoy)).count()
        
        # Consultas totales (histórico de todos los diagnósticos)
        consultas_totales = Diagnostico.objects.all().count()
        
        # Usuarios por día (últimos 7 días)
        usuarios_por_dia = []
        dias_semana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        for i in range(6, -1, -1):
            dia = hoy - timedelta(days=i)
            inicio_dia = timezone.make_aware(datetime.combine(dia, datetime.min.time()), tz)
            fin_dia = timezone.make_aware(datetime.combine(dia, datetime.max.time()), tz)
            count = Usuario.objects.filter(fecha_creacion__range=(inicio_dia, fin_dia)).count()
            usuarios_por_dia.append({
                'fecha': dias_semana[dia.weekday()],
                'count': count
            })
        
        # Top departamentos
        top_departamentos = list(Usuario.objects.filter(
            departamento__isnull=False,
            departamento__gt=''
        ).values('departamento').annotate(
            count=Count('departamento')
        ).order_by('-count')[:5])
        
        # Top ciudades
        top_ciudades = list(Usuario.objects.filter(
            ciudad__isnull=False,
            ciudad__gt=''
        ).values('ciudad').annotate(
            count=Count('ciudad')
        ).order_by('-count')[:5])
        
        # Distribución de clases en diagnósticos (últimos 30 días)
        hace_30_dias = ahora - timedelta(days=30)
        diagnosticos_recientes_30 = Diagnostico.objects.filter(fecha__gte=hace_30_dias)
        distribucion_clases = {}
        for d in diagnosticos_recientes_30:
            cat = d.categoria
            distribucion_clases[cat] = distribucion_clases.get(cat, 0) + 1
        
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        log('INFO', 'ESTADISTICAS', f'Estadísticas generadas exitosamente', {
            'usuarios_hoy': usuarios_hoy,
            'usuarios_mes': usuarios_mes,
            'consultas_hoy': consultas_hoy,
            'consultas_totales': consultas_totales,
            'duration_ms': duration_ms
        })
        
        return JsonResponse({
            'usuarios_hoy': usuarios_hoy,
            'usuarios_mes': usuarios_mes,
            'consultas_hoy': consultas_hoy,
            'consultas_totales': consultas_totales,
            'usuarios_por_dia': usuarios_por_dia,
            'top_departamentos': top_departamentos,
            'top_ciudades': top_ciudades,
            'distribucion_clases': distribucion_clases,
        })
        
    except Exception as e:
        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        log_error('ESTADISTICAS', f'Error generando estadísticas', e, {
            'duration_ms': duration_ms
        })
        return JsonResponse({'error': 'Error interno del servidor'}, status=500)