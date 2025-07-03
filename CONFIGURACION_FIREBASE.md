# Configuración de Firebase

Para que el sistema funcione correctamente, necesitas configurar Firebase Authentication y Firestore.

## Pasos para configurar Firebase

### 1. Crear proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto"
3. Sigue los pasos para crear tu proyecto

### 2. Configurar Authentication

1. En el panel de Firebase, ve a **Authentication** > **Sign-in method**
2. Habilita **Email/Password**
3. Crea un usuario de prueba en **Authentication** > **Users**

### 3. Configurar Firestore Database

1. Ve a **Firestore Database**
2. Haz clic en "Crear base de datos"
3. Selecciona "Comenzar en modo de prueba" (luego configurarás las reglas)
4. Elige una ubicación cerca de tus usuarios

### 4. Obtener credenciales para el Frontend

1. Ve a **Configuración del proyecto** (ícono de engranaje)
2. En la pestaña **General**, busca "Tus apps"
3. Haz clic en el ícono web `</>`
4. Registra tu app con el nombre "Sistema Caja Frontend"
5. Copia la configuración y pégala en `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 5. Obtener credenciales para el Backend (Admin SDK)

1. Ve a **Configuración del proyecto** > **Cuentas de servicio**
2. Haz clic en "Generar nueva clave privada"
3. Se descargará un archivo JSON
4. Abre el archivo y copia los valores en `backend/.env`:

```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto-id.iam.gserviceaccount.com
```

**Importante:** La clave privada debe mantener los saltos de línea como `\n`

### 6. Configurar reglas de Firestore

Ve a **Firestore Database** > **Reglas** y reemplaza con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir acceso a las ventas solo al usuario autenticado
    match /sales/{saleId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Ejecutar el proyecto

### Instalar dependencias
```bash
# En la raíz del proyecto
npm run install:all

# O individualmente
cd frontend && npm install
cd ../backend && npm install
```

### Desarrollo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Acceso
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Estructura de datos

### Colección 'sales'
```json
{
  "id": "auto-generated",
  "date": "2025-07-02",
  "description": "Venta de producto X",
  "cashAmount": 0,
  "digitalAmount": 1000,
  "commissionAmount": 45,
  "paymentMethod": "mercado_pago",
  "userId": "firebase-user-id",
  "createdAt": "2025-07-02T10:30:00.000Z",
  "updatedAt": "2025-07-02T10:30:00.000Z"
}
```

## Cálculo de comisiones

El sistema calcula automáticamente las comisiones según el medio de pago:

- **Efectivo:** 0%
- **Transferencia:** 0% 
- **Tarjeta de débito:** 2.5%
- **Tarjeta de crédito:** 3.5%
- **Mercado Pago:** 4.5%
- **Otro:** 0%

Puedes modificar estos porcentajes en `backend/src/services/salesService.ts`
