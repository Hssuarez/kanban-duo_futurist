# 🚀 Kanban Duo v2 - Tablero Colaborativo con Panel de Administración y Seguridad

Una aplicación web completa y colaborativa tipo Kanban con **seguridad, autenticación con contraseñas cifradas, Panel de Administración, gestión de usuarios, edición de nombres, fotos de perfil y 3 columnas de tareas (Iniciado, Trabajando, Finalizado)**. Optimizada para ser desplegada **100% gratis en Vercel**.

---

## 🔐 Cuentas de Acceso Preconfiguradas (Demo Inmediato)

Al abrir la aplicación verás una pantalla de inicio de sesión segura con botones de acceso rápido (1 clic) para probar cada perfil:

| Usuario | Correo Electrónico | Contraseña Inicial | Rol y Permisos |
| :--- | :--- | :--- | :--- |
| 🛡️ **Diana Méndez** | `admin@empresa.com` | `Admin123!` | **Administrador** (Acceso total + Panel de Administración) |
| 👤 **Alex Rivera** | `alex@empresa.com` | `Alex123!` | **Colaborador** (Tablero, tareas y espacio propio/compañero) |
| 👤 **Beatriz Castro** | `beatriz@empresa.com` | `Beatriz123!` | **Colaboradora** (Tablero, tareas y espacio propio/compañero) |

---

## ✨ Nuevas Características de la Versión 2

### 1. 🛡️ Panel de Administración Exclusivo (Solo Admins)
- **Métricas del Sistema**: Total de usuarios registrados, usuarios activos, administradores y eventos de seguridad.
- **Tabla de Gestión de Usuarios**:
  - Visualización de foto de perfil, nombre, correo, rol (Badge Administrador/Colaborador) y estado (Activo/Suspendido).
  - ✏️ **Editar Usuario**: Modifica su nombre, correo, rol y cambia su foto de perfil.
  - 🔑 **Cambiar Contraseña**: Asigna o restablece la contraseña de cualquier usuario con generador aleatorio de claves seguras.
  - 🚫 **Activar / Suspender**: Bloquea o reactiva el acceso de cualquier colaborador temporalmente.
  - 🗑️ **Eliminar Usuario**: Borra usuarios de forma segura (con protección contra el auto-borrado del único admin).
- ➕ **Crear Nuevos Usuarios**: Formulario para dar de alta colaboradores con su nombre, foto, correo, rol y clave inicial.
- 📋 **Registro de Auditoría**: Historial con fecha y hora de cambios de contraseña, ediciones de nombre, fotos e inicios de sesión.

### 2. 📸 Personalización de Fotos de Perfil (Avatar)
- Galería de **avatares profesionales e ilustrados** listos para seleccionar con 1 clic.
- Soporte para **URL de foto personalizada** (Google Photos, Unsplash, Gravatar, redes sociales).
- Generador automático de avatares con inteligencia según el nombre del usuario.

### 3. 👤 Modal de Perfil de Usuario ("Mi Perfil")
- Cada usuario (incluso los colaboradores sin rol de admin) puede hacer clic en su avatar en el encabezado y seleccionar **"Mi Perfil"** para:
  - Cambiar su **Nombre**.
  - Cambiar su **Foto de Perfil**.
  - Actualizar su propia **Contraseña**.

### 4. 🗂️ Tablero Kanban Colaborativo de 3 Columnas
- **Iniciado**: Tareas pendientes o planificadas.
- **Trabajando**: Tareas en desarrollo activo.
- **Finalizado**: Tareas completadas con animación de **confetti** 🎉.
- **Arrastrar y Soltar (Drag & Drop)** nativo y botones de acción rápida por tarjeta.
- **Filtros por Espacio**: *Mi Espacio*, *Espacio del Compañero* y *Vista de Equipo*.
- **Widget "¿Qué está haciendo ahora?"**: Muestra la tarea activa en curso del compañero en tiempo real.

---

## 💻 Cómo Ejecutar en Local

1. Abre tu terminal en PowerShell:
   ```powershell
   cd C:\Users\WIN\.gemini\antigravity\scratch\kanban-duo
   npm.cmd run dev
   ```
2. Abre tu navegador en [http://localhost:3000](http://localhost:3000).
3. Prueba la experiencia iniciando sesión como **Diana (Admin)** para explorar el panel de administración, o como **Alex** o **Beatriz** para gestionar tareas.

---

## 🌐 Cómo Desplegar Gratis en Vercel

### Paso 1: Subir a GitHub
```powershell
cd C:\Users\WIN\.gemini\antigravity\scratch\kanban-duo
git init
git add .
git commit -m "Kanban Duo v2 con Panel de Administracion y Seguridad"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/kanban-duo.git
git push -u origin main
```

### Paso 2: Desplegar en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Pulsa en **"Add New..." ➔ "Project"**.
3. Selecciona tu repositorio `kanban-duo` y haz clic en **"Deploy"**.
4. En menos de 60 segundos obtendrás tu URL pública gratuita (ej: `https://kanban-duo-v2.vercel.app`).

### Paso 3 (Opcional): Base de Datos en la Nube con Supabase
Para compartir la misma base de datos entre diferentes celulares o computadoras:
1. Crea un proyecto gratuito en [Supabase](https://supabase.com).
2. Pega el script [`supabase/schema.sql`](./supabase/schema.sql) en el **SQL Editor** de Supabase y ejecútalo.
3. En Vercel (**Settings ➔ Environment Variables**), agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu URL del proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu clave anónima pública
