import admin from 'firebase-admin';

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Verificar que todas las variables estén configuradas
    if (!projectId || !privateKey || !clientEmail) {
      console.error('❌ Error: Credenciales de Firebase no configuradas correctamente');
      console.error('Variables faltantes:');
      if (!projectId) console.error('  - FIREBASE_PROJECT_ID');
      if (!privateKey) console.error('  - FIREBASE_PRIVATE_KEY');
      if (!clientEmail) console.error('  - FIREBASE_CLIENT_EMAIL');
      console.error('');
      console.error('Por favor configura las variables de entorno en el archivo backend/.env');
      console.error('Consulta CONFIGURACION_FIREBASE.md para más detalles.');
      
      // No lanzar error, solo advertir para permitir desarrollo sin Firebase
      return null;
    }

    // Verificar que las variables no tengan valores de ejemplo
    if (projectId === 'tu-proyecto-id' || 
        privateKey.includes('TU_CLAVE_PRIVADA_AQUI') || 
        clientEmail.includes('firebase-adminsdk-xxxxx')) {
      console.error('❌ Error: Las credenciales de Firebase contienen valores de ejemplo');
      console.error('Por favor reemplaza los valores en backend/.env con las credenciales reales');
      console.error('Consulta CONFIGURACION_FIREBASE.md para obtener las credenciales.');
      return null;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          privateKey,
          clientEmail,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });

      // Configurar Firestore para ignorar valores undefined
      const firestoreInstance = admin.firestore();
      firestoreInstance.settings({ ignoreUndefinedProperties: true });

      console.log('🔥 Firebase Admin SDK inicializado correctamente');
      console.log(`📊 Proyecto: ${projectId}`);
      return admin.app();
    } catch (error) {
      console.error('❌ Error inicializando Firebase Admin SDK:', error);
      return null;
    }
  }
  
  return admin.app();
};

// Inicializar Firebase inmediatamente
initializeFirebase();

// Solo exportar auth y firestore si Firebase se inicializó correctamente
let authInstance: admin.auth.Auth | null = null;
let firestoreInstance: admin.firestore.Firestore | null = null;

try {
  if (admin.apps.length > 0) {
    authInstance = admin.auth();
    firestoreInstance = admin.firestore();
  }
} catch (error) {
  console.error('❌ Error obteniendo instancias de Firebase:', error);
}

export const auth = authInstance!;
export const firestore = firestoreInstance!;
