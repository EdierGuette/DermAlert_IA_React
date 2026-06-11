#!/usr/bin/env python
"""
Script único de gestión para DermAlert IA - Desarrollo
Ahora con backend Django + frontend React
"""

import os
import shutil
import subprocess
import sys
import platform
import time
import threading
import re
from pathlib import Path
from dotenv import load_dotenv

# ============================================
# CARGAR VARIABLES DE ENTORNO
# ============================================

# Buscar el archivo .env en el directorio actual
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(env_path)
    PROJECT_NAME = os.getenv('PROJECT_NAME', 'DermAlert IA')
    LOGO_ICON = os.getenv('LOGO_ICON', 'medical-outline')
    APP_VERSION = os.getenv('APP_VERSION', '1.0.0')
else:
    PROJECT_NAME = 'DermAlert IA'
    LOGO_ICON = 'medical-outline'
    APP_VERSION = '1.0.0'

# CONFIGURACIÓN
SHOW_WARNINGS = False

# Configurar codificación para Windows - UTF-8
if platform.system() == 'Windows':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass
    # Cambiar la página de códigos a UTF-8
    os.system('chcp 65001 > nul 2>&1')

def limpiar_ansi(texto):
    """Elimina todos los códigos de color ANSI y caracteres especiales"""
    # Eliminar códigos ANSI (colores, negrita, etc.)
    texto = re.sub(r'\x1b\[[0-9;]*[a-zA-Z]', '', texto)
    # Eliminar códigos como [32m, [1m, [22m, [39m, [36m, etc.
    texto = re.sub(r'\[[0-9;]*m', '', texto)
    # Eliminar caracteres especiales como ž, â, œ, etc.
    texto = texto.replace('ž', '')
    texto = texto.replace('â', '')
    texto = texto.replace('œ', '')
    texto = texto.replace('➜', '')
    texto = texto.replace('→', '')
    texto = texto.replace('←', '')
    # Eliminar múltiples espacios
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

# Códigos de color ANSI (solo para Linux/Mac, en Windows se omiten)
USE_COLORS = platform.system() != 'Windows'

class Colors:
    GREEN = '\033[92m' if USE_COLORS else ''
    BLUE = '\033[94m' if USE_COLORS else ''
    YELLOW = '\033[93m' if USE_COLORS else ''
    RED = '\033[91m' if USE_COLORS else ''
    BOLD = '\033[1m' if USE_COLORS else ''
    CYAN = '\033[96m' if USE_COLORS else ''
    MAGENTA = '\033[95m' if USE_COLORS else ''
    END = '\033[0m' if USE_COLORS else ''

def clear_screen():
    """Limpia la pantalla"""
    os.system('cls' if platform.system() == 'Windows' else 'clear')

def safe_print(text, color=None):
    """Imprime texto de manera segura"""
    # Limpiar caracteres especiales antes de imprimir
    text = limpiar_ansi(text)
    try:
        if color and USE_COLORS:
            print(f"{color}{text}{Colors.END}")
        else:
            print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('ascii', 'ignore').decode('ascii')
        print(safe_text)

def print_dev_success():
    """Mensaje de desarrollo exitoso"""
    clear_screen()
    
    # Calcular longitud del nombre para centrar
    name_len = len(PROJECT_NAME)
    version_len = len(APP_VERSION)
    total_len = name_len + version_len + 3
    padding = (70 - total_len) // 2
    
    print("╔══════════════════════════════════════════════════════════════════════════════════════════════╗")
    print("║                                                                                              ║")
    print(f"║{ ' ' * padding }🚀 MODO DESARROLLO EXITOSO - {PROJECT_NAME} v{APP_VERSION} 🚀{ ' ' * padding }║")
    print("║                                                                                              ║")
    print("╠══════════════════════════════════════════════════════════════════════════════════════════════╣")
    print("║                                                                                              ║")
    print("║                         🐍 BACKEND (Django) - Puerto 8000                                    ║")
    print("║                         ⚛️  FRONTEND (React) - Puerto 5173                                    ║")
    print("║                                                                                              ║")
    print("║                         📍 python dev_manager.py runserver                                   ║")
    print("║                                                                                              ║")
    print("║             🌐 Backend API:  http://127.0.0.1:8000                                           ║")
    print("║             🎨 Frontend App:  http://127.0.0.1:5173                                          ║")
    print("║                                                                                              ║")
    print("╚══════════════════════════════════════════════════════════════════════════════════════════════╝")
    print(f"\n🛑 Presiona Ctrl+C para detener ambos servidores ({PROJECT_NAME} v{APP_VERSION})")

def clean_pycache():
    """Limpia todas las carpetas __pycache__ silenciosamente"""
    pycache_count = 0
    for root, dirs, files in os.walk('.'):
        if any(folder in root for folder in ['.git', 'venv', '__pycache__']):
            continue
        if '__pycache__' in dirs:
            try:
                shutil.rmtree(os.path.join(root, '__pycache__'))
                pycache_count += 1
            except:
                pass
    return pycache_count

def force_delete_venv():
    """Fuerza la eliminación del entorno virtual con reintentos"""
    venv_path = 'venv'
    max_retries = 3
    wait_time = 2
    
    if not os.path.exists(venv_path):
        return True
        
    for attempt in range(max_retries):
        try:
            print(f"  🗑️  Intentando eliminar entorno virtual (intento {attempt + 1}/{max_retries})...")
            shutil.rmtree(venv_path)
            print("  ✅ Entorno virtual eliminado")
            return True
        except PermissionError as e:
            print(f"  ⚠️  Acceso denegado: {e}")
            if attempt < max_retries - 1:
                print(f"  ⏳ Esperando {wait_time} segundos antes de reintentar...")
                time.sleep(wait_time)
                if platform.system() == 'Windows':
                    os.system('taskkill /f /im python.exe >nul 2>&1')
                else:
                    os.system('pkill -f python >/dev/null 2>&1')
            else:
                print("  ❌ No se pudo eliminar el entorno virtual")
                print("  💡 Cierra todos los programas que usen Python (IDE, terminal, etc.)")
                return False
        except Exception as e:
            print(f"  ❌ Error inesperado: {e}")
            return False
    return False

def wait_for_venv_creation():
    """Espera y verifica que el entorno virtual se cree correctamente"""
    print("  ⏳ Verificando creación del entorno virtual...")
    
    max_attempts = 10
    wait_time = 2
    
    for attempt in range(max_attempts):
        if platform.system() == 'Windows':
            pip_path = os.path.join('venv', 'Scripts', 'pip.exe')
            python_path = os.path.join('venv', 'Scripts', 'python.exe')
        else:
            pip_path = os.path.join('venv', 'bin', 'pip')
            python_path = os.path.join('venv', 'bin', 'python')
        
        pip_exists = os.path.exists(pip_path)
        python_exists = os.path.exists(python_path)
        venv_dir_exists = os.path.exists('venv')
        
        if pip_exists and python_exists and venv_dir_exists:
            print(f"  ✅ Entorno virtual verificado (intento {attempt + 1}/{max_attempts})")
            return True
        else:
            print(f"  ⏳ Esperando... ({attempt + 1}/{max_attempts})")
            if attempt < max_attempts - 1:
                time.sleep(wait_time)
            else:
                print("  ❌ El entorno virtual no se creó correctamente")
                return False
    return False

def get_pip_command():
    if platform.system() == 'Windows':
        return os.path.join('venv', 'Scripts', 'pip.exe')
    else:
        return os.path.join('venv', 'bin', 'pip')

def get_python_command():
    if platform.system() == 'Windows':
        return os.path.join('venv', 'Scripts', 'python.exe')
    else:
        return os.path.join('venv', 'bin', 'python')

def upgrade_pip_safely():
    python_cmd = get_python_command()
    try:
        print("  🔄 Actualizando pip...")
        subprocess.run([python_cmd, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                       check=True, capture_output=True, text=True)
        print("  ✅ Pip actualizado")
        return True
    except:
        print("  ⚠️  Continuando sin actualizar pip")
        return True

def install_dependencies_with_progress():
    python_cmd = get_python_command()
    try:
        print("  📦 Instalando dependencias...")
        
        process = subprocess.Popen(
            [python_cmd, '-m', 'pip', 'install', '-r', 'requirements.txt'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        for line in process.stdout:
            line = line.strip()
            if line:
                if 'Successfully installed' in line:
                    print(f"  ✅ {line}")
                elif 'ERROR' in line:
                    print(f"  ❌ {line}")
                elif 'WARNING' in line:
                    print(f"  ⚠️  {line}")
                else:
                    print(f"     {line}")
        
        process.wait()
        if process.returncode == 0:
            print("  ✅ Dependencias instaladas correctamente")
            return True
        else:
            print("  ❌ Error en la instalación")
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def check_requirements_file():
    if not os.path.exists('requirements.txt'):
        print("  ❌ ERROR: No se encuentra requirements.txt")
        return False
    return True

def create_venv_with_verification():
    print("  🆕 Creando nuevo entorno virtual...")
    try:
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], 
                       check=True, capture_output=True, text=True)
        if wait_for_venv_creation():
            return True
        else:
            return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def regenerate_venv():
    print("🔄 Regenerando entorno virtual...")
    if not check_requirements_file():
        return False
    if not force_delete_venv():
        return False
    if not create_venv_with_verification():
        return False
    upgrade_pip_safely()
    return install_dependencies_with_progress()

def verify_django_installation():
    python_cmd = get_python_command()
    try:
        result = subprocess.run([python_cmd, '-c', 'import django; print(f"Django {django.__version__}")'],
                               capture_output=True, text=True)
        print(f"  ✅ {result.stdout.strip()}")
        return True
    except:
        print("  ❌ Django no instalado")
        return False

def run_servers():
    """Ejecuta backend Django y frontend React simultáneamente"""
    clean_pycache()
    
    if not verify_django_installation():
        print("❌ Django no está instalado. Ejecuta la opción 2 primero.")
        input("\nPresiona Enter para continuar...")
        return
    
    print_dev_success()
    
    try:
        python_cmd = get_python_command()
        
        if not os.path.exists(python_cmd):
            print("❌ Error: No se encontró el entorno virtual 'venv'")
            input("\nPresiona Enter para continuar...")
            return
        
        # ============================================
        # INICIAR BACKEND DJANGO
        # ============================================
        print(f"🚀 Iniciando BACKEND Django ({PROJECT_NAME} v{APP_VERSION}) en http://127.0.0.1:8000...")
        backend_process = subprocess.Popen(
            [python_cmd, "manage.py", "runserver", "8000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # ============================================
        # ESPERAR A QUE EL BACKEND ESTÉ LISTO
        # ============================================
        print("⏳ Esperando a que el backend termine de cargar...")
        print("   (El modelo de IA puede tomar varios segundos)")
        
        # Esperar 20 segundos para que el modelo de IA se cargue
        wait_time = 20
        for i in range(wait_time):
            print(f"   ⏳ Cargando... {i+1}/{wait_time} segundos")
            time.sleep(1)
        
        print("✅ Backend debería estar listo")
        
        # ============================================
        # INICIAR FRONTEND REACT
        # ============================================
        print(f"⚛️  Iniciando FRONTEND React ({PROJECT_NAME} v{APP_VERSION}) en http://127.0.0.1:5173...")
        
        # Navegar a frontend y ejecutar npm run dev
        frontend_process = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=os.path.join(os.getcwd(), "..", "frontend"),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            shell=platform.system() == 'Windows'
        )
        
        print(f"\n✅ AMBOS SERVIDORES DE {PROJECT_NAME} v{APP_VERSION} EJECUTÁNDOSE")
        print("═" * 60)
        
        # ============================================
        # LEER Y MOSTRAR LA SALIDA DE AMBOS SERVIDORES
        # ============================================
        def read_output(process, name):
            for line in process.stdout:
                if line:
                    # Limpiar completamente la línea de códigos ANSI
                    clean_line = limpiar_ansi(line)
                    clean_line = clean_line.strip()
                    
                    if clean_line:
                        if 'ERROR' in clean_line or 'error' in clean_line.lower():
                            print(f"[{name}] ❌ {clean_line}")
                        elif 'WARNING' in clean_line or 'warning' in clean_line.lower():
                            print(f"[{name}] ⚠️  {clean_line}")
                        elif 'Starting development server' in clean_line:
                            print(f"[{name}] ✅ {clean_line}")
                        elif 'VITE' in clean_line and 'ready' in clean_line:
                            # Limpiar más a fondo la línea de VITE
                            clean_line = clean_line.replace('VITE', '')
                            clean_line = clean_line.replace('ready in', 'listo en')
                            clean_line = re.sub(r'v\d+\.\d+\.\d+', '', clean_line)
                            clean_line = re.sub(r'\d+ms', '', clean_line)
                            print(f"[{name}] ✅ VITE listo")
                        elif 'Application startup complete' in clean_line:
                            print(f"[{name}] ✅ Backend completamente listo")
                        elif 'Local:' in clean_line or 'Network:' in clean_line or 'press h + enter' in clean_line.lower():
                            # Omitir estas líneas (ya mostramos la info al inicio)
                            pass
                        else:
                            print(f"[{name}] {clean_line}")
        
        backend_thread = threading.Thread(target=read_output, args=(backend_process, "BACKEND"))
        frontend_thread = threading.Thread(target=read_output, args=(frontend_process, "FRONTEND"))
        
        backend_thread.daemon = True
        frontend_thread.daemon = True
        
        backend_thread.start()
        frontend_thread.start()
        
        # ============================================
        # MANTENER EL SCRIPT CORRIENDO
        # ============================================
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print(f"\n\n🛑 Deteniendo servidores de {PROJECT_NAME}...")
        if 'backend_process' in locals():
            backend_process.terminate()
        if 'frontend_process' in locals():
            frontend_process.terminate()
        print("✅ Servidores detenidos")
        print(f"\n👋 ¡Hasta luego! {PROJECT_NAME} v{APP_VERSION}")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error: {e}")
        input("\nPresiona Enter para continuar...")

def show_menu():
    clear_screen()
    print("═" * 60)
    print(f"        🩺 GESTOR {PROJECT_NAME} v{APP_VERSION} - DESARROLLO 🩺")
    print("═" * 60)
    print("")
    print("  1. 🚀 Inicializar Servidores (Backend + Frontend)")
    print("  2. 🔧 Regenerar entorno virtual (venv)")
    print("  3. 🐍 Crear usuario administrador")
    print("  4. 🗄️  Limpiar migraciones")
    print("  5. ❌ Salir")
    print("")
    print("═" * 60)
    print(f"📁 Proyecto: {PROJECT_NAME}")
    print(f"🔖 Versión:  v{APP_VERSION}")
    print(f"🎨 Icono:    {LOGO_ICON}")
    print("═" * 60)

def create_admin():
    """Crear usuario administrador"""
    print(f"\n🐍 Creando usuario administrador para {PROJECT_NAME} v{APP_VERSION}...")
    python_cmd = get_python_command()
    if not os.path.exists(python_cmd):
        print("❌ Entorno virtual no encontrado. Ejecuta opción 2 primero.")
        input("\nPresiona Enter...")
        return
    try:
        subprocess.run([python_cmd, "create_admin.py"], check=True)
    except Exception as e:
        print(f"❌ Error: {e}")
    input("\nPresiona Enter para continuar...")

def clean_migrations():
    """Limpiar migraciones"""
    print("\n🗄️  Limpiando migraciones...")
    migrations_path = os.path.join("app", "src", "diagnostics", "migrations")
    if os.path.exists(migrations_path):
        for file in os.listdir(migrations_path):
            if file.endswith(".py") and file != "__init__.py":
                os.remove(os.path.join(migrations_path, file))
                print(f"  ✅ Eliminado: {file}")
        pycache_path = os.path.join(migrations_path, "__pycache__")
        if os.path.exists(pycache_path):
            shutil.rmtree(pycache_path)
            print("  ✅ Eliminado: __pycache__/")
    print(f"\n✅ Migraciones de {PROJECT_NAME} limpiadas. Ahora ejecuta 'python manage.py makemigrations'")
    input("\nPresiona Enter para continuar...")

def main():
    while True:
        show_menu()
        try:
            option = input("\n📌 Selecciona una opción (1-5): ").strip()
            
            if option == '1':
                run_servers()
            elif option == '2':
                print("\n⚠️  ADVERTENCIA: Esto eliminará la carpeta 'venv'")
                confirm = input("¿Continuar? (s/N): ").strip().lower()
                if confirm == 's':
                    if regenerate_venv():
                        print(f"\n✅ Entorno virtual de {PROJECT_NAME} regenerado exitosamente")
                        verify_django_installation()
                    else:
                        print("\n❌ Error en la regeneración")
                else:
                    print("\n❌ Operación cancelada")
                input("\nPresiona Enter para continuar...")
            elif option == '3':
                create_admin()
            elif option == '4':
                clean_migrations()
            elif option == '5':
                print(f"\n👋 ¡Hasta luego! {PROJECT_NAME} v{APP_VERSION}")
                break
            else:
                print("\n❌ Opción no válida")
                input("\nPresiona Enter para continuar...")
        except KeyboardInterrupt:
            print(f"\n\n👋 ¡Hasta luego! {PROJECT_NAME} v{APP_VERSION}")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            input("Presiona Enter para continuar...")

if __name__ == '__main__':
    main()