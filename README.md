# 📊 NominaSystem

**Sistema de Gestión de Nómina** — Proyecto de Programación II-V

---

## 📋 Descripción

Sistema web completo para la gestión de empleados de una empresa con **arquitectura SPA (Single Page Application)**. Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) de manera asíncrona con una interfaz moderna y responsiva.

El sistema cuenta con un **dashboard con menú lateral**, vistas independientes para empleados y estadísticas, autenticación segura con JWT, modos de visualización (nocturno y protección visual) y persistencia de preferencias.

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología |
|------|------------|
| **Backend** | Node.js + Express |
| **Multimedia / Carga** | `multer` (para procesamiento físico de imágenes en el disco) |
| **Visualizaciones** | `Chart.js` (para gráficos interactivos adaptativos en tiempo real) |
| **Frontend** | HTML5, CSS3, JavaScript (ES6 Modules) |
| **Autenticación** | JWT con cookies HttpOnly |
| **Persistencia** | Archivo JSON (`empleados.json`) + Carpetas físicas (`/uploads`) |
| **Arquitectura** | 3 Capas (Presentación, Lógica de Negocio, Datos) + POO |
| **Estilos** | CSS modular con modo oscuro/claro, protección visual y `@media print` |

---

## ✨ Características principales

### 🔐 Autenticación y Seguridad
- **Login independiente** con redirección automática según sesión.
- **JWT con cookies HttpOnly** para sesiones persistentes (24 horas).
- Cierre de sesión seguro.
- Verificación de sesión en cada carga.

### 📊 Dashboard y Navegación
- **Menú lateral fijo** con navegación entre vistas.
- Vistas dinámicas: **Empleados**, **Formulario de Empleado**, **Estadísticas** y **Reporte de Nómina**.
- Carga de vistas mediante `fetch` sin recargar la página SPA.
- **Diseño responsivo** y moderno con degradados de calidad premium.

### 📸 Gestión de Archivos Multimedia
- **Subida de fotos de perfil:** Formulario de registro con carga de imagen procesada mediante `multer`.
- **Ruta segura controlada:** Descarga/servido de fotos validado en backend para evitar accesos indebidos.
- **Limpieza de disco automatizada:** Eliminación física de archivos huérfanos del servidor cuando un empleado es eliminado o su foto es modificada.

### 👥 Gestión de Empleados (CRUD)
- ✅ Registrar nuevos empleados (con foto de perfil e historial de horas extras).
- ✅ Listar empleados en una tabla responsiva con iniciales dinámicas (si no tiene foto) o miniatura circular de la imagen.
- ✅ Editar empleados (nombre, cargo, sueldo base, horas extras). La cédula se mantiene bloqueada tras el registro.
- ✅ Eliminar empleados con modal de confirmación y eliminación de foto en disco.

### 💵 Lógica de Negocio Avanzada (Nómina)
- **Horas Extras:** Pago calculado según la fórmula: $\text{Sueldo Base} / 240 \times 1.5$ por cada hora.
- **Bono de Alimentación Fijo:** Asignación constante de `500,00 Bs`.
- **Retenciones de Ley:** Deducciones del `4%` por concepto de IVSS y `1%` por Paro Forzoso (L.P.F.).
- **Sueldo Neto:** Suma automática de asignaciones y resta de deducciones.
- **Recibo de Pago:** Modal interactivo con el desglose matemático detallado del cálculo.

### 🧾 Reporte Imprimible Consolidado
- Vista consolidada de nómina con sumatoria reactiva del total acumulado a pagar.
- Configuración de estilos `@media print` para ocultar la barra lateral, botones interactivos y alertas.
- Formato limpio, membretado y de alto contraste con líneas oficiales para firmas autorizadas, inmune al modo oscuro o filtros de protección visual.

### 📈 Estadísticas y Gráficos Reactivos
- **Tarjetas Resumen:** Muestra del total de la plantilla y el gasto neto de nómina global.
- **Gráficos con Chart.js:** Cuatro dashboards gráficos interactivos:
  1. *Distribución de Cargos* (Gráfico de Dona).
  2. *Sueldos Netos por Empleado* (Gráfico de Barras).
  3. *Ranking de Horas Extras por Empleado* (Gráfico de Barras Horizontal).
  4. *Asignaciones vs. Deducciones Totales* (Gráfico de Barras Comparativas).
- Sincronización automática de temas (colores claros/oscuros adaptativos para ticks y grillas del canvas).

### 🔍 Búsqueda Reactiva
- Búsqueda instantánea por cédula o nombre con filtrado dinámico en tiempo real.

### 💵 Moneda
- Formato venezolano para todas las monedas y montos (`es-VE`, ej. `1.250,00 Bs`).

---

## 📁 Estructura del proyecto

```
NominaSystem/
├── backend/
│   ├── data/
│   │   └── empleados.json       # Base de datos JSON
│   ├── models/
│   │   └── GestorArchivo.js     # Manejo del archivo JSON y borrado de archivos del disco
│   ├── routes/
│   │   └── empleados.js         # Endpoints de API y lógica de negocio/multer
│   └── server.js                # Inicialización del servidor Express y JWT
├── uploads/                     # Carpeta de almacenamiento físico de fotos de perfil
├── frontend/
│   ├── css/
│   │   ├── common.css           # Estilos base comunes y botones
│   │   ├── login.css            # Estilos del portal de login premium
│   │   └── dashboard.css        # Layout principal, modales, gráficos y reglas de impresión
│   ├── js/
│   │   ├── app.js               # Enrutador e inicio de sesión
│   │   ├── login.js             # Lógica del formulario de login
│   │   ├── dashboard.js         # Carga de vistas parciales e inicialización de Chart.js
│   │   ├── UI.js                # Renderizado de tabla, avatares y control de modales
│   │   ├── Empleado.js          # Modelo y validaciones de datos
│   │   └── api.js               # Conexiones con backend usando FormData
│   ├── views/                   # Vistas dinámicas cargadas en el SPA
│   │   ├── empleados.html       # Listado de empleados con buscadores
│   │   ├── empleado-form.html   # Formulario con inputs de subida y horas extras
│   │   ├── estadisticas.html    # Contenedores de gráficos interactivos
│   │   └── reporte.html         # Vista oficial del reporte de nómina consolidado
│   ├── index.html               # Redirección inicial
│   ├── login.html               # Portal de acceso
│   └── dashboard.html           # Estructura del dashboard y modales de confirmación/recibos
├── package.json                 # Dependencias de npm y scripts
└── README.md                    # Guía de documentación
```

---

## 🚀 Instalación y ejecución

### Pasos para instalar

```bash
# 1. Clonar el repositorio
git clone https://github.com/sbi447/NominaSystem.git
cd NominaSystem

# 3. Instalar dependencias
pnpm install

# 4. Modificar .env.example a .env

# 5. Ejecutar el servidor
pnpm run dev      # Modo desarrollo (con nodemon)
# o
pnpm start        # Modo producción
```

### Acceso a la aplicación
```
http://localhost:3000
```

---

## 🔑 Credenciales de acceso

| Campo | Valor |
|-------|-------|
| **Correo electrónico** | `sysnom@gmail.com` |
| **Contraseña** | `linux123` |

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/login` | Iniciar sesión (Genera JWT HTTPOnly Cookie) |
| GET | `/api/check-session` | Verificar sesión activa |
| POST | `/api/logout` | Cerrar sesión (Limpia Cookie) |
| GET | `/api/empleados` | Obtener todos los empleados con desgloses de nómina |
| POST | `/api/empleados` | Crear nuevo empleado (Carga de Foto con Multer) |
| PUT | `/api/empleados/:id` | Actualizar empleado (sin cédula, limpia fotos antiguas) |
| DELETE | `/api/empleados/:id` | Eliminar empleado (limpia fotos físicas del disco) |
| GET | `/api/empleados/foto/:filename` | Servir foto de perfil de forma controlada y segura |

---

## 🤝 Contribuciones

Proyecto académico desarrollado por el **Equipo 2** — Programación II-V.

---

## 📄 Licencia

Proyecto educativo — Sin fines comerciales.
