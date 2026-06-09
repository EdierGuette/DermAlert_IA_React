# backend_logger.py - Sistema de logging unificado para TODO el backend
import os
import sys
import logging
import logging.handlers
from pathlib import Path
from datetime import datetime, timedelta
import json
import traceback
import inspect
import glob
import re

# ============================================
# CONFIGURACIÓN DE RUTAS
# ============================================

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
LOGS_DIR = PROJECT_ROOT / 'logs'

# Crear carpeta de logs
LOGS_DIR.mkdir(exist_ok=True)

# ============================================
# CONFIGURACIÓN DE ARCHIVOS POR FECHA
# ============================================

# Días a mantener logs (60 días = 2 meses)
DIAS_A_MANTENER = 60

def get_log_filename():
    """Genera el nombre del archivo de log basado en la fecha actual"""
    fecha_actual = datetime.now()
    nombre_mes = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    
    nombre = f"{fecha_actual.day}_{nombre_mes[fecha_actual.month]}_{fecha_actual.year}_logsfront_back.log"
    return LOGS_DIR / nombre

def limpiar_logs_antiguos():
    """Elimina archivos de log más antiguos de DIAS_A_MANTENER días"""
    fecha_limite = datetime.now() - timedelta(days=DIAS_A_MANTENER)
    
    patron = str(LOGS_DIR / "*_logsfront_back.log")
    archivos = glob.glob(patron)
    
    eliminados = 0
    for archivo in archivos:
        try:
            nombre = Path(archivo).stem
            partes = nombre.split('_')
            if len(partes) >= 3:
                dia = int(partes[0])
                mes_str = partes[1]
                año = int(partes[2])
                
                meses = {
                    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
                    'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
                    'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
                }
                mes = meses.get(mes_str, 1)
                fecha_archivo = datetime(año, mes, dia)
                
                if fecha_archivo < fecha_limite:
                    os.remove(archivo)
                    eliminados += 1
        except Exception as e:
            pass
    
    if eliminados > 0:
        print(f"🧹 Limpiados {eliminados} archivos de log antiguos (más de {DIAS_A_MANTENER} días)")

# ============================================
# DEFINIR ANCHOS DE COLUMNAS (AJUSTABLES)
# ============================================

# Anchos de columna (se pueden ajustar fácilmente)
ANCHO_FECHA = 20          # 2026-06-09 14:30:45
ANCHO_NIVEL = 8           # INFO, ERROR, etc.
ANCHO_MODULO = 25         # HTTP, AUTH, FRONTEND
ANCHO_FUNCION = 30        # nombre de función
ANCHO_IP = 16             # dirección IP
ANCHO_USUARIO = 20        # identificacion o Anonymous

# Calcular el ancho de las columnas fijas (sin incluir el mensaje)
ANCHO_COLUMNAS_FIJAS = ANCHO_FECHA + ANCHO_NIVEL + ANCHO_MODULO + ANCHO_FUNCION + ANCHO_IP + ANCHO_USUARIO + 7  # +7 por los separadores " | "

# Para el separador, usamos un ancho fijo grande (200 caracteres para el mensaje)
ANCHO_MENSAJE = 200
ANCHO_TOTAL = ANCHO_COLUMNAS_FIJAS + ANCHO_MENSAJE

# Línea separadora dinámica (ahora cubre toda la línea)
SEPARADOR = "=" * ANCHO_TOTAL

# Cabecera con columnas
COLUMNAS = (
    f"{'FECHA':<{ANCHO_FECHA}} | "
    f"{'NIVEL':<{ANCHO_NIVEL}} | "
    f"{'MODULO':<{ANCHO_MODULO}} | "
    f"{'FUNCION':<{ANCHO_FUNCION}} | "
    f"{'IP':<{ANCHO_IP}} | "
    f"{'USUARIO':<{ANCHO_USUARIO}} | "
    f"{'MENSAJE':<{ANCHO_MENSAJE}}"
)

# Formato del log sin truncamiento automático (el mensaje se alinea pero no se trunca)
FORMATO_LOG = (
    f"%(asctime)-{ANCHO_FECHA}s | "
    f"%(levelname)-{ANCHO_NIVEL}s | "
    f"%(name)-{ANCHO_MODULO}s | "
    f"%(funcName)-{ANCHO_FUNCION}s | "
    f"%(ip)-{ANCHO_IP}s | "
    f"%(usuario)-{ANCHO_USUARIO}s | "
    f"%(message)s"
)
FORMATO_FECHA = '%Y-%m-%d %H:%M:%S'

# ============================================
# CLASE PERSONALIZADA PARA AGREGAR CAMPOS
# ============================================

class CustomLogRecord(logging.LogRecord):
    """Clase personalizada para agregar información adicional"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.custom_func = getattr(self, 'custom_func', 'unknown')
        self.ip = getattr(self, 'ip', '-')
        self.usuario = getattr(self, 'usuario', '-')

class CustomFormatter(logging.Formatter):
    """Formatter personalizado que maneja campos adicionales y truncamiento"""
    
    def format(self, record):
        # Truncar nombre del módulo si es muy largo
        if hasattr(record, 'name') and record.name:
            # Acortar nombres de módulos de Django
            if record.name.startswith('django.'):
                record.name = record.name.replace('django.utils.autoreload', 'django.ar')
                record.name = record.name.replace('django.db.backends', 'django.db')
                record.name = record.name.replace('django.template', 'django.tpl')
                record.name = record.name.replace('django.core.management', 'django.mgmt')
                record.name = record.name.replace('django.request', 'django.req')
            
            # Truncar a 25 caracteres
            if len(record.name) > ANCHO_MODULO:
                record.name = record.name[:ANCHO_MODULO-3] + '...'
        
        # Truncar nombre de función
        if hasattr(record, 'funcName') and record.funcName and len(record.funcName) > ANCHO_FUNCION:
            record.funcName = record.funcName[:ANCHO_FUNCION-3] + '...'
        
        # Manejar función personalizada
        if hasattr(record, 'custom_func') and record.custom_func:
            original_func = record.funcName
            if len(record.custom_func) > ANCHO_FUNCION:
                record.funcName = record.custom_func[:ANCHO_FUNCION-3] + '...'
            else:
                record.funcName = record.custom_func
            result = super().format(record)
            record.funcName = original_func
            return result
        
        return super().format(record)

# ============================================
# HANDLER PERSONALIZADO PARA ARCHIVO POR FECHA
# ============================================

class DateRotatingFileHandler(logging.Handler):
    """Handler que cambia de archivo cada día automáticamente"""
    
    def __init__(self):
        super().__init__()
        self.current_date = None
        self.file_handler = None
        self._update_handler()
    
    def _update_handler(self):
        """Actualiza el handler si cambió la fecha"""
        hoy = datetime.now().date()
        
        if self.current_date != hoy:
            if self.file_handler:
                self.file_handler.close()
            
            log_file = get_log_filename()
            self.file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=50 * 1024 * 1024,
                backupCount=5,
                encoding='utf-8'
            )
            self.file_handler.setLevel(logging.DEBUG)
            self.file_handler.setFormatter(CustomFormatter(FORMATO_LOG, FORMATO_FECHA))
            
            self.current_date = hoy
            self._escribir_cabecera(log_file)
    
    def _escribir_cabecera(self, log_file):
        """Escribe la cabecera en un archivo nuevo"""
        if log_file.exists() and log_file.stat().st_size == 0:
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(SEPARADOR + '\n')
                f.write(COLUMNAS + '\n')
                f.write(SEPARADOR + '\n')
    
    def emit(self, record):
        """Envía el registro al handler actual"""
        self._update_handler()
        if self.file_handler:
            self.file_handler.emit(record)
    
    def close(self):
        if self.file_handler:
            self.file_handler.close()
        super().close()

# ============================================
# CONFIGURACIÓN DEL LOGGER PRINCIPAL
# ============================================

def configurar_logger():
    """Configura el logger principal con rotación por día"""
    
    logging.setLogRecordFactory(CustomLogRecord)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.handlers.clear()
    
    date_handler = DateRotatingFileHandler()
    date_handler.setLevel(logging.DEBUG)
    root_logger.addHandler(date_handler)
    
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.CRITICAL)
    console_handler.setFormatter(logging.Formatter(''))
    root_logger.addHandler(console_handler)
    
    return root_logger, date_handler

# ============================================
# FUNCIÓN PRINCIPAL PARA ESCRIBIR LOGS
# ============================================

def log(level, modulo, mensaje, datos=None, funcion=None, ip=None, usuario=None):
    """
    Función principal para escribir logs
    """
    logger = logging.getLogger(modulo)
    
    if funcion is None:
        try:
            frame = inspect.currentframe().f_back
            funcion = frame.f_code.co_name if frame else 'unknown'
        except:
            funcion = 'unknown'
    
    texto_completo = mensaje
    if datos:
        try:
            datos_str = json.dumps(datos, ensure_ascii=False, default=str)
            # Aumentar límite a 2000 caracteres para no perder información
            if len(datos_str) > 2000:
                datos_str = datos_str[:2000] + '... [TRUNCADO]'
            texto_completo += f" | Datos: {datos_str}"
        except Exception:
            texto_completo += f" | Datos: {str(datos)[:2000]}"
    
    extra = {
        'custom_func': funcion,
        'ip': ip or '-',
        'usuario': usuario or '-'
    }
    
    level = level.upper()
    try:
        if level == 'DEBUG':
            logger.debug(texto_completo, extra=extra)
        elif level == 'INFO':
            logger.info(texto_completo, extra=extra)
        elif level == 'WARNING':
            logger.warning(texto_completo, extra=extra)
        elif level == 'ERROR':
            logger.error(texto_completo, extra=extra)
        else:
            logger.info(texto_completo, extra=extra)
    except Exception:
        if level == 'DEBUG':
            logger.debug(texto_completo)
        elif level == 'INFO':
            logger.info(texto_completo)
        elif level == 'WARNING':
            logger.warning(texto_completo)
        elif level == 'ERROR':
            logger.error(texto_completo)
        else:
            logger.info(texto_completo)

# ============================================
# FUNCIÓN PARA REGISTRAR ERRORES
# ============================================

def log_error(modulo, mensaje, error=None, datos=None, funcion=None, ip=None, usuario=None):
    """Registra un error con stack trace"""
    
    datos_error = datos or {}
    if error:
        datos_error['error'] = str(error)
        datos_error['tipo'] = type(error).__name__
        datos_error['traceback'] = traceback.format_exc()[:2000]  # Aumentado a 2000
    
    log('ERROR', modulo, mensaje, datos_error, funcion, ip, usuario)

# ============================================
# FUNCIÓN PARA REGISTRAR PETICIONES HTTP
# ============================================

def log_request(request, status_code, duration_ms=None):
    """Registra una petición HTTP"""
    
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '-'))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()
    
    usuario = 'Anonymous'
    if hasattr(request, 'user') and request.user.is_authenticated:
        if hasattr(request.user, 'identificacion'):
            usuario = request.user.identificacion
        elif hasattr(request.user, 'username'):
            usuario = request.user.username
    
    method = request.method
    path = request.path
    
    datos = {
        'method': method,
        'path': path,
        'status': status_code
    }
    if duration_ms:
        datos['duration_ms'] = duration_ms
    
    log('INFO', 'HTTP', f"{method} {path} - Status: {status_code}", datos, 'http_request', ip, usuario)

# ============================================
# FUNCIÓN PARA REGISTRAR LOGS DEL FRONTEND
# ============================================

def log_frontend_error(componente, mensaje, error_data=None, ip=None, usuario=None):
    """Registra errores de JavaScript provenientes del frontend"""
    
    datos = {
        'tipo': error_data.get('type', 'unknown') if error_data else 'unknown',
        'url': error_data.get('url', '-') if error_data else '-',
        'filename': error_data.get('filename', '-') if error_data else '-',
        'lineno': error_data.get('lineno', '-') if error_data else '-'
    }
    
    if error_data and error_data.get('stack'):
        datos['stack'] = error_data['stack'][:2000]  # Aumentado a 2000
    
    log('ERROR', 'FRONTEND', f"[{componente}] {mensaje}", datos, 'log_frontend_error', ip, usuario)


def log_frontend_action(componente, accion, mensaje, datos=None, ip=None, usuario=None):
    """Registra acciones del frontend (navegación, clicks importantes)"""
    
    log('INFO', 'FRONTEND', f"[{componente}] {accion}: {mensaje}", datos, 'log_frontend_action', ip, usuario)


def log_frontend(level, componente, accion, mensaje, datos=None, usuario=None, funcion=None):
    """Registra logs provenientes del frontend - Versión compatible con views.py"""
    
    texto = f"[{componente}] {accion}: {mensaje}"
    
    info_usuario = {}
    if usuario:
        info_usuario['usuario'] = usuario
    
    if datos:
        info_usuario.update(datos)
    
    log(level, 'FRONTEND', texto, info_usuario if info_usuario else None, funcion or 'frontend_log')


# ============================================
# INICIALIZACIÓN AUTOMÁTICA
# ============================================

# Configurar logger
logger, date_handler = configurar_logger()

# Limpiar logs antiguos al iniciar
limpiar_logs_antiguos()

# Registrar inicio del sistema
log('INFO', 'SISTEMA', '🚀 SISTEMA DE LOGS INICIADO', None, 'init', '-', 'SYSTEM')
log('INFO', 'SISTEMA', f'📁 Carpeta de logs: {LOGS_DIR}', None, 'init', '-', 'SYSTEM')
log('INFO', 'SISTEMA', f'📅 Archivos por día - Retención: {DIAS_A_MANTENER} días', None, 'init', '-', 'SYSTEM')
log('INFO', 'SISTEMA', SEPARADOR, None, 'init', '-', 'SYSTEM')

print(f"\n✅ Sistema de logs configurado correctamente")
print(f"   📁 Carpeta: {LOGS_DIR}")
print(f"   📅 Archivos por día (ej: 9_Junio_2026_logsfront_back.log)")
print(f"   🗑️  Retención: {DIAS_A_MANTENER} días")
print(f"   💾 Tamaño máximo por archivo: 50 MB")
print(f"   📊 Ancho total de columnas: {ANCHO_TOTAL} caracteres\n")