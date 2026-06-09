# 🩺 DERMALERT IA - SISTEMA DE DETECCIÓN DE CÁNCER DE PIEL

[![Django](https://img.shields.io/badge/Django-4.2.7-green)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-2.15-orange)](https://tensorflow.org/)

---

## 📋 **DESCRIPCIÓN DEL PROYECTO**

**DermAlert IA** es una plataforma avanzada que utiliza **Inteligencia Artificial** para clasificar lesiones cutáneas y ayudar en la detección temprana de cáncer de piel.

### 🏗️ **ARQUITECTURA DEL PROYECTO**
DERMALERT IA
├── 🐍 BACKEND (Django REST API) → Puerto 8000
└── ⚛️ FRONTEND (React + Vite) → Puerto 5173

text

---

## 📦 **INSTALACIÓN Y CONFIGURACIÓN DEL PROYECTO**

### 🔹 **1. CREAR CARPETA DEL PROYECTO**

```bash
mkdir DermAlert_IA_React
cd DermAlert_IA_React
🔹 2. CLONAR O CREAR ESTRUCTURA DE CARPETAS
bash
# Crear carpetas principales
mkdir backend frontend
🐍 CONFIGURACIÓN DEL BACKEND (DJANGO)
📌 CREAR ENTORNO VIRTUAL (venv)
bash
cd backend
python -m venv venv
Para Python 3.11.9 específicamente:

bash
py -3.11 -m venv venv
📌 ACTIVAR ENTORNO VIRTUAL
⚠️ IMPORTANTE: Usa SOLO una de las siguientes opciones, según tu consola.

Sistema Operativo	Comando
Windows (PowerShell)	.\venv\Scripts\activate
Windows (CMD)	venv\Scripts\activate
Git Bash / Linux / Mac	source venv/Scripts/activate
💡 Cuando esté activo verás algo así:

text
(venv) C:\ruta\del\proyecto\backend>
▶️ Para desactivar el entorno virtual:

bash
deactivate
📌 INSTALAR DEPENDENCIAS
bash
pip install -r requirements.txt
📌 CONFIGURAR VARIABLES DE ENTORNO
bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos (usar cualquier editor)
# Windows:
notepad .env
# Linux/Mac:
nano .env
Variables importantes en .env:

env
DB_NAME=ia_melanoma_react   # ← NUEVA BASE DE DATOS
DB_USER=postgres
DB_PASSWORD=12345678
DB_HOST=localhost
DB_PORT=5432
🗄️ CONFIGURAR BASE DE DATOS POSTGRESQL
📌 CREAR BASE DE DATOS
✅ Windows (PowerShell como administrador)
powershell
# Acceder a PostgreSQL
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE ia_melanoma_react;
CREATE USER dermalert_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE ia_melanoma_react TO dermalert_user;
\q
✅ Linux/Mac (Terminal)
bash
sudo -u postgres psql
CREATE DATABASE ia_melanoma_react;
CREATE USER dermalert_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE ia_melanoma_react TO dermalert_user;
\q
📌 ESTRUCTURA DE TABLAS (Referencia)
sql
-- Tabla de usuarios
CREATE TABLE diagnostics_usuario (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    is_superuser BOOLEAN NOT NULL,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    is_staff BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL,
    identificacion VARCHAR(20) NOT NULL UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    sexo VARCHAR(10) NOT NULL,
    rol VARCHAR(15) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabla de diagnósticos
CREATE TABLE diagnostics_diagnostico (
    id SERIAL PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    clase VARCHAR(15) NOT NULL,
    confianza DOUBLE PRECISION NOT NULL,
    probabilidades JSONB NOT NULL,
    imagen TEXT NOT NULL,
    paciente_id INTEGER REFERENCES diagnostics_usuario(id) ON DELETE CASCADE
);

-- Tabla de auditoría
CREATE TABLE diagnostics_auditoria (
    id SERIAL PRIMARY KEY,
    accion VARCHAR(255) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    detalles JSONB,
    usuario_id INTEGER REFERENCES diagnostics_usuario(id) ON DELETE SET NULL
);
🛠️ MIGRACIONES DE DJANGO
📌 CREAR Y APLICAR MIGRACIONES
bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones a la base de datos
python manage.py migrate
📌 LIMPIAR MIGRACIONES (si es necesario)
⚠️ IMPORTANTE: Aquí NO debe estar apuntando a (venv) para el primer comando

✅ Linux/Mac / Git Bash
bash
rm -rf app/src/diagnostics/migrations
mkdir app/src/diagnostics/migrations
touch app/src/diagnostics/migrations/__init__.py
✅ Windows (PowerShell)
powershell
# Navegar a la carpeta de migraciones
cd app\src\diagnostics\migrations

# Eliminar todos los archivos .py excepto __init__.py
Get-ChildItem -File | Where-Object { $_.Name -ne '__init__.py' } | Remove-Item -Force

# Eliminar también la carpeta __pycache__ si existe
if (Test-Path "__pycache__") { Remove-Item -Recurse -Force "__pycache__" }

# Volver a la raíz del proyecto
cd ..\..\..\..
✅ Verificar que la carpeta de migraciones está vacía
bash
ls -la app/src/diagnostics/migrations/
# Solo debe mostrar __init__.py
📌 LIMPIAR BASE DE DATOS POSTGRESQL
bash
psql -U postgres -d ia_melanoma_react -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"
📌 VERIFICAR QUE LA BASE DE DATOS ESTÁ LIMPIA
bash
psql -U postgres -d ia_melanoma_react -c "\dt"
# No debe mostrar tablas (o muy pocas tablas del sistema)
📌 CREAR USUARIO ADMINISTRADOR
bash
python create_admin.py
🖥️ CONFIGURAR EL INTÉRPRETE EN VS CODE
1️⃣ Presiona: Ctrl + Shift + P
2️⃣ Escribe: Python: Select Interpreter
3️⃣ Selecciona el que termina en: ./venv/Scripts/python.exe

🚀 LEVANTAR EL SERVIDOR DJANGO
bash
python manage.py runserver
⚠️ IMPORTANTE: Debes estar apuntando a (venv)

🌐 Puerto donde se ejecuta Django:

text
Django version 4.2, using settings 'skin_cancer_dashboard.settings'
Starting development server at:
👉 http://127.0.0.1:8000/
⚛️ CONFIGURACIÓN DEL FRONTEND (REACT)
📌 INSTALAR NODE.JS Y DEPENDENCIAS
bash
# Entrar a la carpeta frontend
cd ../frontend

# Instalar dependencias base
npm install

# Instalar dependencias adicionales
npm install axios react-router-dom chart.js react-chartjs-2 sweetalert2 react-dropzone
📌 EJECUTAR FRONTEND EN DESARROLLO
bash
npm run dev
🌐 Puerto donde se ejecuta React:

text
VITE v5.0.0  ready in 500 ms
➜  Local:   http://localhost:5173/
🧪 LEVANTAR SERVIDOR MODO DEV (GESTOR INTEGRADO)
bash
python dev_manager.py runserver
⚠️ IMPORTANTE: Debes estar apuntando a (venv)

📌 USO DEL MENÚ MOD DEV
Cuando ejecutes python dev_manager.py, aparecerá un menú:

Opción	Comando	Requiere (venv)	¿Qué hace?
1	Seleccionar opción 1	✅ Sí (venv)	Inicia BACKEND (puerto 8000) y FRONTEND (puerto 5173) juntos
2	Seleccionar opción 2	❌ No (sin venv)	Regenera entorno virtual desde cero
3	Seleccionar opción 3	✅ Sí (venv)	Crea usuario administrador
4	Seleccionar opción 4	✅ Sí (venv)	Limpia migraciones
5	Seleccionar opción 5	❌ No	Salir del programa
💡 Nota: Para usar la opción 1, debes tener activo el entorno virtual → (venv)
💡 Para usar la opción 2, NO debes estar dentro del entorno virtual → sin (venv)

🔧 SOLUCIÓN DE PROBLEMAS COMUNES
❌ Error: npm no se reconoce
✅ Solución: Instalar Node.js desde nodejs.org

❌ Error: psql no se reconoce
✅ Solución: Agregar PostgreSQL al PATH o usar pgAdmin

❌ Error: ModuleNotFoundError: No module named 'rest_framework'
✅ Solución: Activar entorno virtual e instalar dependencias

bash
venv\Scripts\activate
pip install -r requirements.txt
❌ Error: could not connect to server: Connection refused (PostgreSQL)
✅ Solución: Iniciar servicio de PostgreSQL

powershell
# Windows PowerShell (como administrador)
net start postgresql-x64-16

# Linux
sudo systemctl start postgresql
❌ Error: CORS policy en React
✅ Solución: Verificar que en settings.py esté:

python
CORS_ALLOW_ALL_ORIGINS = True
❌ Error: python no se reconoce
✅ Solución: Instalar Python y agregarlo al PATH

❌ Error: ModuleNotFoundError: No module named 'app'
✅ Solución: Asegurar que estás en la carpeta backend/ y el venv está activado

📁 ESTRUCTURA COMPLETA DEL PROYECTO
text
DermAlert_IA_React/
├── .gitignore
│
├── backend/                                    # 🐍 BACKEND DJANGO
│   ├── app/
│   │   └── src/
│   │       ├── diagnostics/                   # Módulo de diagnósticos
│   │       │   ├── migrations/
│   │       │   ├── __init__.py
│   │       │   ├── admin.py
│   │       │   ├── apps.py
│   │       │   ├── middleware.py
│   │       │   ├── models.py
│   │       │   ├── serializers.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       ├── landing_page/                  # Landing page API
│   │       │   ├── __init__.py
│   │       │   ├── apps.py
│   │       │   ├── urls.py
│   │       │   └── views.py
│   │       └── skin_cancer_dashboard/         # Configuración Django
│   │           ├── __init__.py
│   │           ├── asgi.py
│   │           ├── settings.py
│   │           ├── urls.py
│   │           └── wsgi.py
│   ├── venv/                                   # Entorno virtual
│   ├── .env
│   ├── .env.example
│   ├── create_admin.py
│   ├── dev_manager.py
│   ├── keras_model.h5
│   ├── labels.txt
│   ├── manage.py
│   ├── modelo.py
│   ├── README.md
│   └── requirements.txt
│
└── frontend/                                   # ⚛️ FRONTEND REACT
    ├── node_modules/                           # Dependencias
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── css/                                # Estilos
    │   │   ├── auth.css
    │   │   ├── auth_modal.css
    │   │   ├── diagnostico/
    │   │   │   ├── camara.css
    │   │   │   ├── diagnostic_grafica.css
    │   │   │   ├── manejo_archivos.css
    │   │   │   └── nivel_riesgo.css
    │   │   ├── historial/
    │   │   │   ├── filtro_busqueda_id_cedula.css
    │   │   │   ├── filtro_mostrar.css
    │   │   │   ├── tabla.css
    │   │   │   └── total_diagnostics.css
    │   │   ├── inicio/
    │   │   │   ├── body.css
    │   │   │   └── footer.css
    │   │   ├── resultados/
    │   │   │   ├── estadisticas.css
    │   │   │   ├── header.css
    │   │   │   └── user_info.css
    │   │   ├── styles/
    │   │   │   ├── dashboard.css
    │   │   │   ├── global.css
    │   │   │   └── logout.css
    │   │   └── landing_page/
    │   │       ├── landing.css
    │   │       ├── landing-responsive.css
    │   │       ├── contacto.css
    │   │       └── estadisticas.css
    │   ├── data/
    │   │   └── colombia.json
    │   ├── img/
    │   │   └── favicon.ico
    │   ├── components/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Inicio.jsx
    │   │   ├── Diagnostico.jsx
    │   │   ├── Resultados.jsx
    │   │   ├── Historial.jsx
    │   │   ├── AuthModal.jsx
    │   │   ├── CameraModal.jsx
    │   │   ├── Landing.jsx
    │   │   ├── QRLanding.jsx
    │   │   └── ContactModal.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    ├── README.md
    └── vite.config.js
🌐 ENDPOINTS DE LA API
Método	Endpoint	Descripción	Autenticación
POST	/api/register/	Registro de usuario	❌ No
POST	/api/login/	Inicio de sesión	❌ No
POST	/api/logout/	Cierre de sesión	✅ Sí (Token)
POST	/api/predict/	Análisis de imagen con IA	✅ Sí (Token)
GET	/api/diagnosticos/	Listar diagnósticos	✅ Sí (Token)
DELETE	/api/diagnosticos/<id>/delete/	Eliminar diagnóstico	✅ Sí (Token)
POST	/api/verify-password/	Verificar contraseña	✅ Sí (Token)
POST	/api/enviar-contacto/	Enviar mensaje contacto	❌ No
GET	/api/estadisticas/	Estadísticas públicas	❌ No
📊 COMANDOS RÁPIDOS (REFERENCIA)
Backend (Django)
bash
cd backend
.\venv\Scripts\activate                 # Activar venv (Windows)
python manage.py runserver              # Ejecutar servidor
python manage.py makemigrations         # Crear migraciones
python manage.py migrate                # Aplicar migraciones
python create_admin.py                  # Crear admin
python dev_manager.py                   # Gestor integrado
deactivate                              # Desactivar venv
Frontend (React)
bash
cd frontend
npm install                             # Instalar dependencias
npm run dev                             # Ejecutar desarrollo
npm run build                           # Construir para producción
Base de Datos (PostgreSQL)
bash
psql -U postgres -d ia_melanoma_react   # Conectar a BD
\dt                                     # Listar tablas
\q                                      # Salir
👤 AUTOR
Edier Guette
📧 edierjose01@gmail.com
📞 322 928 2626

📄 LICENCIA
Todos los derechos reservados © 2025

text

---

## ✅ **CÓMO GUARDAR EL ARCHIVO**

1. **Copia TODO el contenido de arriba** (desde `# 🩺 DERMALERT IA...` hasta el final)
2. **Abre tu editor de código** (VS Code, Notepad++, etc.)
3. **Crea un nuevo archivo** llamado `README.md`
4. **Pega el contenido**
5. **Guarda el archivo** en la raíz de tu proyecto `DermAlert_IA_React/`

---