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

# CONFIGURACIÓN
SHOW_WARNINGS = False

# Configurar codificación para Windows
if platform.system() == 'Windows':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

# Códigos de color ANSI
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    END = '\033[0m'

def clear_screen():
    """Limpia la pantalla"""
    os.system('cls' if platform.system() == 'Windows' else 'clear')

def safe_print(text, color=None):
    """Imprime texto de manera segura"""
    try:
        if color and platform.system() != 'Windows':
            print(f"{color}{text}{Colors.END}")
        else:
            print(text)
    except UnicodeEncodeError:
        safe_text = text.encode('ascii', 'ignore').decode('ascii')
        print(safe_text)

def print_dev_success():
    """Mensaje de desarrollo exitoso"""
    clear_screen()
    safe_print("╔══════════════════════════════════════════════════════════════════════════════════════════════╗")
    safe_print("║                                                                                              ║")
    safe_print("║                         🚀 MODO DESARROLLO EXITOSO - DERMALERT IA 🚀                         ║", Colors.GREEN)
    safe_print("║                                                                                              ║")
    safe_print("╠══════════════════════════════════════════════════════════════════════════════════════════════╣")
    safe_print("║                                                                                              ║")
    safe_print("║                         🐍 BACKEND (Django) - Puerto 8000                                    ║")
    safe_print("║                         ⚛️  FRONTEND (React) - Puerto 5173                                    ║")
    safe_print("║                                                                                              ║")
    safe_print("║                         📍 python dev_manager.py runserver                                   ║")
    safe_print("║                                                                                              ║")
    safe_print("║             🌐 Backend API:  http://127.0.0.1:8000                                           ║", Colors.GREEN)
    safe_print("║             🎨 Frontend App:  http://127.0.0.1:5173                                          ║", Colors.GREEN)
    safe_print("║                                                                                              ║")
    safe_print("╚══════════════════════════════════════════════════════════════════════════════════════════════╝")
    safe_print("\n🛑 Presiona Ctrl+C para detener ambos servidores")

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
            safe_print(f"  🗑️  Intentando eliminar entorno virtual (intento {attempt + 1}/{max_retries})...")
            shutil.rmtree(venv_path)
            safe_print("  ✅ Entorno virtual eliminado")
            return True
        except PermissionError as e:
            safe_print(f"  ⚠️  Acceso denegado: {e}")
            if attempt < max_retries - 1:
                safe_print(f"  ⏳ Esperando {wait_time} segundos antes de reintentar...")
                time.sleep(wait_time)
                if platform.system() == 'Windows':
                    os.system('taskkill /f /im python.exe >nul 2>&1')
                else:
                    os.system('pkill -f python >/dev/null 2>&1')
            else:
                safe_print("  ❌ No se pudo eliminar el entorno virtual")
                safe_print("  💡 Cierra todos los programas que usen Python (IDE, terminal, etc.)")
                return False
        except Exception as e:
            safe_print(f"  ❌ Error inesperado: {e}")
            return False
    return False

def wait_for_venv_creation():
    """Espera y verifica que el entorno virtual se cree correctamente"""
    safe_print("  ⏳ Verificando creación del entorno virtual...")
    
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
            safe_print(f"  ✅ Entorno virtual verificado (intento {attempt + 1}/{max_attempts})")
            return True
        else:
            safe_print(f"  ⏳ Esperando... ({attempt + 1}/{max_attempts})")
            if attempt < max_attempts - 1:
                time.sleep(wait_time)
            else:
                safe_print("  ❌ El entorno virtual no se creó correctamente")
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
        safe_print("  🔄 Actualizando pip...")
        subprocess.run([python_cmd, '-m', 'pip', 'install', '--upgrade', 'pip'], 
                       check=True, capture_output=True, text=True)
        safe_print("  ✅ Pip actualizado")
        return True
    except:
        safe_print("  ⚠️  Continuando sin actualizar pip")
        return True

def install_dependencies_with_progress():
    python_cmd = get_python_command()
    try:
        safe_print("  📦 Instalando dependencias...", Colors.BLUE)
        
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
                    safe_print(f"  ✅ {line}", Colors.GREEN)
                elif 'ERROR' in line:
                    safe_print(f"  ❌ {line}", Colors.RED)
                elif 'WARNING' in line:
                    safe_print(f"  ⚠️  {line}", Colors.YELLOW)
                else:
                    safe_print(f"     {line}")
        
        process.wait()
        if process.returncode == 0:
            safe_print("  ✅ Dependencias instaladas correctamente", Colors.GREEN)
            return True
        else:
            safe_print("  ❌ Error en la instalación", Colors.RED)
            return False
    except Exception as e:
        safe_print(f"  ❌ Error: {e}", Colors.RED)
        return False

def check_requirements_file():
    if not os.path.exists('requirements.txt'):
        safe_print("  ❌ ERROR: No se encuentra requirements.txt", Colors.RED)
        return False
    return True

def create_venv_with_verification():
    safe_print("  🆕 Creando nuevo entorno virtual...", Colors.BLUE)
    try:
        subprocess.run([sys.executable, '-m', 'venv', 'venv'], 
                       check=True, capture_output=True, text=True)
        if wait_for_venv_creation():
            return True
        else:
            return False
    except Exception as e:
        safe_print(f"  ❌ Error: {e}", Colors.RED)
        return False

def regenerate_venv():
    safe_print("🔄 Regenerando entorno virtual...", Colors.BLUE)
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
        safe_print(f"  ✅ {result.stdout.strip()}", Colors.GREEN)
        return True
    except:
        safe_print("  ❌ Django no instalado", Colors.RED)
        return False

def run_servers():
    """Ejecuta backend Django y frontend React simultáneamente"""
    clean_pycache()
    
    if not verify_django_installation():
        safe_print("❌ Django no está instalado. Ejecuta la opción 2 primero.", Colors.RED)
        input("\nPresiona Enter para continuar...")
        return
    
    print_dev_success()
    
    try:
        python_cmd = get_python_command()
        
        if not os.path.exists(python_cmd):
            safe_print("❌ Error: No se encontró el entorno virtual 'venv'", Colors.RED)
            input("\nPresiona Enter para continuar...")
            return
        
        # Iniciar backend Django
        safe_print("🚀 Iniciando BACKEND Django en http://127.0.0.1:8000...", Colors.BLUE)
        backend_process = subprocess.Popen(
            [python_cmd, "manage.py", "runserver", "8000"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Iniciar frontend React
        safe_print("⚛️  Iniciando FRONTEND React en http://127.0.0.1:5173...", Colors.BLUE)
        
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
        
        safe_print("\n✅ AMBOS SERVIDORES EJECUTÁNDOSE", Colors.GREEN)
        safe_print("═" * 60)
        
        def read_output(process, name, color):
            for line in process.stdout:
                if line:
                    line = line.strip()
                    if 'ERROR' in line or 'error' in line.lower():
                        safe_print(f"[{name}] ❌ {line}", Colors.RED)
                    elif 'WARNING' in line or 'warning' in line.lower():
                        safe_print(f"[{name}] ⚠️  {line}", Colors.YELLOW)
                    elif 'Starting development server' in line or 'VITE' in line:
                        safe_print(f"[{name}] ✅ {line}", Colors.GREEN)
                    else:
                        safe_print(f"[{name}] {line}", color)
        
        backend_thread = threading.Thread(target=read_output, args=(backend_process, "BACKEND", Colors.BLUE))
        frontend_thread = threading.Thread(target=read_output, args=(frontend_process, "FRONTEND", Colors.GREEN))
        
        backend_thread.daemon = True
        frontend_thread.daemon = True
        
        backend_thread.start()
        frontend_thread.start()
        
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        safe_print("\n\n🛑 Deteniendo servidores...", Colors.YELLOW)
        if 'backend_process' in locals():
            backend_process.terminate()
        if 'frontend_process' in locals():
            frontend_process.terminate()
        safe_print("✅ Servidores detenidos", Colors.GREEN)
    except Exception as e:
        safe_print(f"❌ Error: {e}", Colors.RED)
        input("\nPresiona Enter para continuar...")

def show_menu():
    clear_screen()
    safe_print("═══════════════════════════════════════════════════════════════", Colors.BLUE)
    safe_print("        🩺 GESTOR DERMALERT IA - DESARROLLO 🩺", Colors.BOLD)
    safe_print("═══════════════════════════════════════════════════════════════", Colors.BLUE)
    safe_print("")
    safe_print("  1. 🚀 Inicializar Servidores (Backend + Frontend)", Colors.GREEN)
    safe_print("  2. 🔧 Regenerar entorno virtual (venv)", Colors.YELLOW)
    safe_print("  3. 🐍 Crear usuario administrador", Colors.CYAN if hasattr(Colors, 'CYAN') else Colors.BLUE)
    safe_print("  4. 🗄️  Limpiar migraciones", Colors.CYAN if hasattr(Colors, 'CYAN') else Colors.BLUE)
    safe_print("  5. ❌ Salir", Colors.RED)
    safe_print("")
    safe_print("═══════════════════════════════════════════════════════════════", Colors.BLUE)

def create_admin():
    """Crear usuario administrador"""
    safe_print("\n🐍 Creando usuario administrador...", Colors.BLUE)
    python_cmd = get_python_command()
    if not os.path.exists(python_cmd):
        safe_print("❌ Entorno virtual no encontrado. Ejecuta opción 2 primero.", Colors.RED)
        input("\nPresiona Enter...")
        return
    try:
        subprocess.run([python_cmd, "create_admin.py"], check=True)
    except Exception as e:
        safe_print(f"❌ Error: {e}", Colors.RED)
    input("\nPresiona Enter para continuar...")

def clean_migrations():
    """Limpiar migraciones"""
    safe_print("\n🗄️  Limpiando migraciones...", Colors.BLUE)
    migrations_path = os.path.join("app", "src", "diagnostics", "migrations")
    if os.path.exists(migrations_path):
        for file in os.listdir(migrations_path):
            if file.endswith(".py") and file != "__init__.py":
                os.remove(os.path.join(migrations_path, file))
                safe_print(f"  ✅ Eliminado: {file}")
        pycache_path = os.path.join(migrations_path, "__pycache__")
        if os.path.exists(pycache_path):
            shutil.rmtree(pycache_path)
            safe_print("  ✅ Eliminado: __pycache__/")
    safe_print("\n✅ Migraciones limpiadas. Ahora ejecuta 'python manage.py makemigrations'", Colors.GREEN)
    input("\nPresiona Enter para continuar...")

def main():
    while True:
        show_menu()
        try:
            option = input("\n📌 Selecciona una opción (1-5): ").strip()
            
            if option == '1':
                run_servers()
            elif option == '2':
                safe_print("\n⚠️  ADVERTENCIA: Esto eliminará la carpeta 'venv'", Colors.YELLOW)
                confirm = input("¿Continuar? (s/N): ").strip().lower()
                if confirm == 's':
                    if regenerate_venv():
                        safe_print("\n✅ Entorno virtual regenerado exitosamente", Colors.GREEN)
                        verify_django_installation()
                    else:
                        safe_print("\n❌ Error en la regeneración", Colors.RED)
                else:
                    safe_print("\n❌ Operación cancelada", Colors.RED)
                input("\nPresiona Enter para continuar...")
            elif option == '3':
                create_admin()
            elif option == '4':
                clean_migrations()
            elif option == '5':
                safe_print("\n¡Hasta luego! 🩺", Colors.GREEN)
                break
            else:
                safe_print("\n❌ Opción no válida", Colors.RED)
                input("\nPresiona Enter para continuar...")
        except KeyboardInterrupt:
            safe_print("\n\n¡Hasta luego! 🩺", Colors.GREEN)
            break
        except Exception as e:
            safe_print(f"\n❌ Error: {e}", Colors.RED)
            input("Presiona Enter para continuar...")

if __name__ == '__main__':
    main()