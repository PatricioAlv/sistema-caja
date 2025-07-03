# Sistema de Gestión de Caja

Sistema web para manejar las ventas diarias de un negocio con autenticación Firebase.

## 🚀 Características

- 🔐 **Autenticación segura** con Firebase Auth
- 💰 **Registro de ventas** (efectivo y medios digitales)
- 📊 **Cálculo automático de comisiones** por medio de pago
- 📅 **Historial de ventas** diarias con filtros
- 📈 **Dashboard con resúmenes** y estadísticas
- 📱 **Diseño responsive** y moderno

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express, TypeScript
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Authentication
- **Validación**: Express Validator

## 📁 Estructura del Proyecto

```
sistema-caja/
├── frontend/          # Next.js App (Puerto 3000)
├── backend/           # Express API (Puerto 3001)
├── shared/           # Tipos TypeScript compartidos
└── docs/            # Documentación
```

## ⚡ Inicio Rápido

### 1. Clonar y configurar
```bash
cd sistema-caja
npm run install:all
```

### 2. Configurar Firebase
Sigue las instrucciones detalladas en [CONFIGURACION_FIREBASE.md](./CONFIGURACION_FIREBASE.md)

### 3. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
PORT=3001
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FRONTEND_URL=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 4. Ejecutar en desarrollo

**Opción 1: Usando VS Code Tasks**
- Presiona `Ctrl+Shift+P` y busca "Tasks: Run Task"
- Ejecuta "Iniciar Backend" y "Iniciar Frontend"

**Opción 2: Manualmente**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend  
npm run dev
```

### 5. Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **API Backend**: http://localhost:3001

## 📊 Funcionalidades Principales

### Dashboard Principal
- Resumen diario de ventas
- Totales por efectivo/digital
- Cálculo de comisiones
- Cantidad de ventas

### Registro de Ventas
- Descripción de la venta
- Monto
- Medio de pago (efectivo, tarjetas, Mercado Pago, etc.)
- Fecha (por defecto actual)

### Cálculo Automático de Comisiones
- **Efectivo**: 0%
- **Transferencia**: 0%
- **Tarjeta de débito**: 2.5%
- **Tarjeta de crédito**: 3.5%
- **Mercado Pago**: 4.5%
- **Otro**: 0%

### Historial de Ventas
- Lista completa de ventas del día
- Filtros por fecha
- Eliminación de ventas
- Vista detallada de cada transacción

## 🔧 Desarrollo

### Scripts disponibles

**Raíz del proyecto:**
```bash
npm run dev              # Ejecutar frontend + backend
npm run install:all      # Instalar todas las dependencias
npm run build           # Construir frontend + backend
```

**Frontend:**
```bash
npm run dev             # Servidor de desarrollo
npm run build          # Construir para producción
npm run start          # Ejecutar versión de producción
```

**Backend:**
```bash
npm run dev            # Servidor con nodemon
npm run build         # Compilar TypeScript
npm run start         # Ejecutar versión compilada
```

### Estructura de la API

**Endpoints disponibles:**
- `GET /api/sales` - Obtener ventas con filtros
- `POST /api/sales` - Crear nueva venta
- `GET /api/sales/:id` - Obtener venta específica
- `PUT /api/sales/:id` - Actualizar venta
- `DELETE /api/sales/:id` - Eliminar venta
- `GET /api/summary/daily/:date` - Resumen diario
- `GET /api/summary/range` - Resumen por rango de fechas

## 🔒 Seguridad

- Autenticación requerida para todas las operaciones
- Tokens JWT validados en cada request
- Reglas de Firestore para acceso por usuario
- Validación de datos en backend
- CORS configurado correctamente

## 📝 Notas de la Imagen

Basado en tu Excel actual, el sistema replica:
- **Columna Fecha**: Selector de fecha en el dashboard
- **Columna Descripción**: Campo de descripción en el formulario
- **Columna Efectivo**: Calculado automáticamente según el medio de pago
- **Columna Digital**: Calculado automáticamente para medios no-efectivo
- **Columna Comisiones**: Calculado automáticamente según porcentajes
- **Columna Medio**: Selector de medio de pago mejorado

## 🤝 Contribuir

1. Configura Firebase siguiendo la documentación
2. Crea usuarios de prueba en Firebase Auth
3. Prueba registrando ventas de ejemplo
4. Verifica que los cálculos de comisiones sean correctos

## 📞 Soporte

Si tienes dudas sobre la configuración o encuentras algún problema:
1. Revisa [CONFIGURACION_FIREBASE.md](./CONFIGURACION_FIREBASE.md)
2. Verifica que las variables de entorno estén correctas
3. Asegúrate de que Firebase esté bien configurado
4. Consulta los logs del backend en la consola
