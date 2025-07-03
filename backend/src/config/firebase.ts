import admin from 'firebase-admin';

export const initializeFirebase = () => {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
      console.warn('⚠️  Credenciales de Firebase no configuradas correctamente');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });

    console.log('🔥 Firebase Admin SDK inicializado');
  }
};

// Inicializar Firebase inmediatamente
initializeFirebase();

export const auth = admin.auth();
export const firestore = admin.firestore();
