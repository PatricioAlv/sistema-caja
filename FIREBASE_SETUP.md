# 🔥 Configuración Rápida de Firebase

## ⚠️ Error: Firebase no configurado

Si estás viendo el error "The default Firebase app does not exist", necesitas configurar las credenciales de Firebase.

## 📋 Pasos rápidos:

### 1. Obtener credenciales del Backend

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Configuración del proyecto** ⚙️ > **Cuentas de servicio**
4. Haz clic en **"Generar nueva clave privada"**
5. Se descargará un archivo JSON

### 2. Configurar archivo .env del Backend

Abre el archivo `backend/.env` y reemplaza los valores:

```env
FIREBASE_PROJECT_ID=tu-proyecto-real-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
(tu clave privada real aquí)
...
-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto-real-id.iam.gserviceaccount.com
```

**⚠️ Importante:** 
- NO incluyas espacios extra en FIREBASE_PRIVATE_KEY
- Mantén las comillas dobles alrededor de la clave privada
- Los saltos de línea se manejan automáticamente

### 3. Configurar archivo .env.local del Frontend

Para el frontend, obtén la configuración web:

1. En Firebase Console, ve a **Configuración del proyecto** ⚙️
2. En **Tus apps**, agrega una app web o copia la configuración existente
3. Pega los valores en `frontend/.env.local`

### 4. Reiniciar el servidor

```bash
# En la carpeta backend
npm run dev
```

## 🔍 Verificación

Si todo está configurado correctamente, verás:
```
🔥 Firebase Admin SDK inicializado correctamente
📊 Proyecto: tu-proyecto-id
```

## 📚 Documentación completa

Para más detalles, consulta `CONFIGURACION_FIREBASE.md`
