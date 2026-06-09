import os
import django

# 🔥 CAMBIO IMPORTANTE: Actualizar el settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.src.skin_cancer_dashboard.settings')
django.setup()

from app.src.diagnostics.models import Usuario  # 🔥 Ruta actualizada

def create_admin_user():
    try:
        if not Usuario.objects.filter(identificacion='1003124316').exists():
            admin_user = Usuario.objects.create_user(
                username='EdierGuette',
                first_name='Edier',
                last_name='Guette',
                identificacion='1003124316',
                email='edierjose01@gmail.com',
                telefono='3229282626',
                sexo='masculino',
                rol='administrador',
                password='Edier123'
            )
            print("✅ Usuario administrador creado exitosamente")
            print(f"   Identificación: 1003124316")
            print(f"   Contraseña: Edier123")
            print(f"   Rol: Administrador")
        else:
            print("ℹ️  El usuario administrador ya existe")
            
    except Exception as e:
        print(f"❌ Error al crear usuario administrador: {e}")

if __name__ == '__main__':
    create_admin_user()