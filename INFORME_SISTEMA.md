# 📘 Informe Técnico del Sistema Base de Nómina (RRHH) - Evaluación 4

Este documento detalla el funcionamiento interno de las extensiones full-stack y lógicas implementadas en el sistema de gestión de personal, con especial enfoque en el motor de subida de archivos, las fórmulas matemáticas de nómina y el diseño del sistema de impresión.

---

## 🏢 1. Arquitectura General de 3 Capas
El proyecto está estructurado bajo el patrón de **Arquitectura de 3 Capas**, garantizando una estricta separación de responsabilidades y modularidad en programación orientada a objetos (POO):

```
┌────────────────────────────────────────────────────────┐
│                   CAPA DE PRESENTACIÓN                  │
│  (Vistas HTML dinámicas, CSS adaptativo, UI.js, SPA)   │
└──────────────────────────┬─────────────────────────────┘
                           │ FormData / Fetch API
┌──────────────────────────▼─────────────────────────────┐
│                    CAPA DE NEGOCIO                     │
│  (Rutas de Express, Express-Validator, Cálculos de     │
│   Nómina, Configuración y Verificación de JWT)         │
└──────────────────────────┬─────────────────────────────┘
                           │ Métodos de Instancia
┌──────────────────────────▼─────────────────────────────┐
│                     CAPA DE DATOS                      │
│  (GestorArchivo.js, persistencia física de archivos    │
│   en /uploads y persistencia lógica en empleados.json) │
└────────────────────────────────────────────────────────┘
```

---

## 📸 2. Configuración y Flujo de `multer`
Para la gestión física y almacenamiento de las fotos de perfil de los empleados, se configuró el middleware `multer` en el backend ([backend/routes/empleados.js](file:///home/sbi/dev/NominaSystem/backend/routes/empleados.js)):

### A. Almacenamiento en Disco (Disk Storage)
Se utiliza `multer.diskStorage` para definir la ubicación física y el nombre exclusivo de cada archivo subido, evitando colisiones de nombres:

```javascript
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Carpeta física donde se guardan las imágenes
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        // Estructura: foto-[timestamp]-[id-unico].[extension]
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'foto-' + uniqueSuffix + ext);
    }
});
```

### B. Filtros de Seguridad y Límites
Para evitar archivos corruptos o ataques de denegación de servicio (DoS) por peso, se configuran límites estrictos:
1. **Límite de tamaño:** Máximo `2 MB` por archivo.
2. **Filtro de formato (MIME type):** Solo se permiten imágenes tipo `image/jpeg`, `image/jpg` y `image/png`.

```javascript
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 Megabytes
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png). Max 2MB'));
    }
});
```

### C. Limpieza Automática de Archivos Huérfanos
Para optimizar el uso de almacenamiento del servidor, el modelo [GestorArchivo.js](file:///home/sbi/dev/NominaSystem/backend/models/GestorArchivo.js) elimina físicamente los archivos del disco:
* **Al eliminar un empleado:** Se lee su propiedad `foto` y se ejecuta `fs.unlinkSync` sobre el path físico.
* **Al editar su foto:** Se ubica la foto anterior y se elimina del disco antes de registrar el nombre del archivo nuevo.

---

## 💵 3. Lógica Matemática del Cálculo de Nómina (Venezuela)
Toda la lógica de negocio y las ecuaciones aritméticas se procesan y validan exclusivamente en el backend para evitar alteraciones en el frontend. Los cálculos se basan en los siguientes parámetros legislativos y empresariales:

### A. Fórmulas de Asignaciones (Ingresos Brutos)
1. **Sueldo Base ($S_{\text{base}}$):** Monto mensual asignado al cargo (debe ser igual o superior al salario mínimo legal establecido de `1000,00 Bs`).
2. **Pago de Horas Extras ($P_{\text{he}}$):**
   * Divisor de jornada mensual: `240 horas` (equivalente a 30 días con jornadas diarias de 8 horas).
   * Recargo por hora extra: `50%` (factor de `1.5` sobre la hora ordinaria).
   * Ecuación:
     $$P_{\text{he}} = \text{Horas Extras} \times \left( \frac{S_{\text{base}}}{240} \times 1.5 \right)$$
3. **Bono Fijo ($B_{\text{fijo}}$):** Ayuda de alimentación establecida en `500,00 Bs` planos mensuales para todos los trabajadores sin distinción de cargo.

### B. Fórmulas de Deducciones (Retenciones Legales)
Se aplican deducciones del `5%` acumulado sobre el sueldo base:
1. **Retención de Seguro Social (IVSS - 4%):**
   $$\text{IVSS} = S_{\text{base}} \times 0.04$$
2. **Retención de Paro Forzoso (L.P.F. - 1%):**
   $$\text{Paro Forzoso} = S_{\text{base}} \times 0.01$$

### C. Ecuación del Sueldo Neto ($S_{\text{neto}}$)
Une todas las asignaciones brutas y deduce las retenciones correspondientes:
$$S_{\text{neto}} = S_{\text{base}} + P_{\text{he}} + B_{\text{fijo}} - \text{IVSS} - \text{Paro Forzoso}$$

*Ejemplo Práctico:* Un empleado con $S_{\text{base}} = 2000,00\text{ Bs}$ y $10\text{ horas extras}$ aplicadas:
* $P_{\text{he}} = 10 \times \left(\frac{2000}{240} \times 1.5\right) = 10 \times (8.33 \times 1.5) = 125,00\text{ Bs}$
* $B_{\text{fijo}} = 500,00\text{ Bs}$
* $\text{IVSS} = 2000 \times 0.04 = 80,00\text{ Bs}$
* $\text{Paro Forzoso} = 2000 \times 0.01 = 20,00\text{ Bs}$
* $S_{\text{neto}} = 2000 + 125 + 500 - 80 - 20 = 2525,00\text{ Bs}$

---

## 🧾 4. Formato y Estructura del Reporte Imprimible
El reporte de nómina consolidado se maneja de forma interactiva en la pantalla mediante la SPA y se adapta para impresión física a través de CSS específico en [dashboard.css](file:///home/sbi/dev/NominaSystem/frontend/css/dashboard.css):

### A. Estructura HTML de la Hoja
El archivo parcial [reporte.html](file:///home/sbi/dev/NominaSystem/frontend/views/reporte.html) contiene:
* **Encabezado institucional:** Logotipo de la empresa, nombre corporativo (NominaSystem S.A.), RIF de ley, y la fecha de emisión calculada dinámicamente en JS.
* **Tabla tabulada de 8 columnas:** Desglose del sueldo base, cobros de extras, bono alimentario, retenciones consolidadas (5%) y neto total a pagar por persona.
* **Sección de Firmas:** Espacios vacíos oficiales (`Preparado por: RRHH` / `Aprobado por: Gerencia General`) para validez de auditoría.
* **Recuadro de Resumen:** Indicador del total de nómina consolidada a liquidar.

### B. Reglas `@media print` (Impresión Física)
Para lograr un formato limpio de oficina y que la impresora no capture la interfaz del navegador, se aplican las siguientes directivas en CSS:

1. **Ocultamiento de Controles Interactivos:**
   Se remueven barras de navegación (`.sidebar`), botones interactivos (`button`, `.btn`), alertas (`#toast-container`), buscadores y formularios:
   ```css
   @media print {
       .sidebar, #toast-container, .modal-overlay, .search-container, .form-actions, button, .btn {
           display: none !important;
       }
   }
   ```
2. **Inmunidad al Modo Oscuro y Filtros Visuales:**
   Si el usuario tiene activado el modo nocturno (`body.night-mode`) o protección de brillo (`body.visual-protection`), se deshabilitan por completo para evitar que la impresora intente imprimir fondos negros o tintes sepia:
   ```css
   @media print {
       body, body.night-mode, body.visual-protection, .dashboard-layout, .main-content, .view-container {
           background: #ffffff !important;
           color: #000000 !important;
           filter: none !important; /* Desactiva el tinte sepia */
           box-shadow: none !important;
           border: none !important;
           padding: 0 !important;
           margin: 0 !important;
           width: 100% !important;
           display: block !important;
       }
       
       /* Asegurar alto contraste para textos y números */
       .report-table th, .report-table td, .report-summary-value {
           color: #000000 !important;
       }
   }
   ```
3. **Formatos de Tabla de Alto Contraste:**
   Se fuerzan bordes negros limpios de 1px y se tiñe el encabezado en color gris claro (`#f1f5f9`) mediante propiedades de impresión forzada:
   ```css
   @media print {
       .report-table {
           width: 100% !important;
           border-collapse: collapse !important;
       }
       .report-table th, .report-table td {
           border: 1px solid #000000 !important;
           padding: 8px 12px !important;
       }
       .report-table th {
           background-color: #f1f5f9 !important;
           -webkit-print-color-adjust: exact; /* Forzar el color de fondo en Chrome/Safari */
           print-color-adjust: exact;         /* Estándar CSS */
       }
   }
   ```
