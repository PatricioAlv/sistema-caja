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
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar que el usuario es dueño del documento
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    // Función helper para verificar que el usuario es dueño del documento que se está creando
    function isOwnerCreate(userId) {
      return request.auth.uid == userId;
    }

    // === COLECCIÓN SALES ===
    match /sales/{saleId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === COLECCIÓN WITHDRAWALS ===
    match /withdrawals/{withdrawalId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === COLECCIÓN CUSTOMERS (Cuentas Corrientes) ===
    match /customers/{customerId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === COLECCIÓN ACCOUNT_MOVEMENTS (Movimientos de Cuenta Corriente) ===
    match /accountMovements/{movementId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === COLECCIÓN BUSINESS_CONFIG ===
    match /businessConfig/{configId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === COLECCIÓN COMMISSIONS ===
    match /commissions/{commissionId} {
      allow read, write: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwnerCreate(request.resource.data.userId);
    }

    // === REGLAS PARA FUTURAS COLECCIONES ===
    // Regla general para cualquier nueva colección que tenga userId
    match /{collection}/{documentId} {
      allow read, write: if isAuthenticated() && 
        collection in ['products', 'categories', 'reports', 'settings'] &&
        resource.data.keys().hasAll(['userId']) &&
        isOwner(resource.data.userId);
      allow create: if isAuthenticated() && 
        collection in ['products', 'categories', 'reports', 'settings'] &&
        request.resource.data.keys().hasAll(['userId']) &&
        isOwnerCreate(request.resource.data.userId);
    }
  }
}
```

### 🔐 **Explicación de las Reglas:**

**Principios de Seguridad:**
1. ✅ **Solo usuarios autenticados** pueden acceder a los datos
2. ✅ **Cada usuario solo ve sus propios datos** (aislamiento por `userId`)
3. ✅ **Previene acceso no autorizado** entre usuarios
4. ✅ **Permite operaciones CRUD completas** para datos propios

**Colecciones Protegidas:**
- `sales` - Ventas del sistema
- `withdrawals` - Retiros/gastos  
- `customers` - Clientes (cuentas corrientes)
- `accountMovements` - Movimientos de cuenta corriente
- `businessConfig` - Configuración del negocio
- `commissions` - Configuración de comisiones

**Funciones Helper:**
- `isAuthenticated()` - Verifica que el usuario esté logueado
- `isOwner()` - Verifica que el `userId` del documento coincida con el usuario actual
- `isOwnerCreate()` - Verifica el `userId` en documentos que se están creando

### 🚨 **Reglas Alternativas (Más Restrictivas):**

Si quieres mayor seguridad, puedes usar estas reglas más específicas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // === REGLAS MÁS RESTRICTIVAS ===
    
    // Solo permitir lectura y escritura de documentos propios
    match /sales/{saleId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        resource.data.keys().hasAll(['userId', 'date', 'description']);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId &&
        request.resource.data.keys().hasAll(['userId', 'date', 'description']);
    }

    match /customers/{customerId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId &&
        resource.data.keys().hasAll(['userId', 'name']);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId &&
        request.resource.data.keys().hasAll(['userId', 'name']);
    }

    // Continuar para cada colección...
  }
}
```

### 🛠️ **Reglas para Desarrollo/Testing:**

Si estás en desarrollo y necesitas depurar problemas, puedes usar temporalmente estas reglas más permisivas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ SOLO PARA DESARROLLO - MUY INSEGURO
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**🚨 IMPORTANTE:** Estas reglas permiten que cualquier usuario autenticado lea/escriba cualquier documento. **NUNCA las uses en producción.**

### 📋 **Cómo aplicar las reglas:**

1. **Ir a Firebase Console:** https://console.firebase.google.com/
2. **Seleccionar tu proyecto:** epointbohemia
3. **Navegar a:** Firestore Database > Reglas
4. **Reemplazar** las reglas existentes con las nuevas
5. **Hacer clic en "Publicar"**

### 🔍 **Verificar que las reglas funcionan:**

Después de aplicar las reglas, puedes probar:

```javascript
// En la consola del navegador
// Esto debería funcionar si estás autenticado
firebase.firestore().collection('customers').get()
  .then(snapshot => console.log('Clientes:', snapshot.docs.length))
  .catch(err => console.error('Error:', err));
```

### 🐛 **Si tienes problemas con las reglas:**

1. **Revisar logs de Firestore:** En Firebase Console > Firestore > Uso
2. **Verificar autenticación:** `firebase.auth().currentUser`
3. **Verificar userId en documentos:** Asegúrate que todos los documentos tengan el campo `userId`

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
