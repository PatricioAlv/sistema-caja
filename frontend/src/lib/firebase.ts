import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debug: Verificar configuración
console.log('🔥 Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Configurada' : '✗ Faltante',
  authDomain: firebaseConfig.authDomain ? '✓ Configurada' : '✗ Faltante',
  projectId: firebaseConfig.projectId ? '✓ Configurada' : '✗ Faltante',
  storageBucket: firebaseConfig.storageBucket ? '✓ Configurada' : '✗ Faltante',
  messagingSenderId: firebaseConfig.messagingSenderId ? '✓ Configurada' : '✗ Faltante',
  appId: firebaseConfig.appId ? '✓ Configurada' : '✗ Faltante',
  measurementId: firebaseConfig.measurementId ? '✓ Configurada' : '✗ Faltante',
});

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firebase Authentication
export const auth = getAuth(app);

export default app;
