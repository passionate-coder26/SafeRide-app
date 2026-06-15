import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyDswDQgOTMVLd9kqsM_mnwmwehbgef0a2E",
  authDomain: "saferide-b31d0.firebaseapp.com",
  projectId: "saferide-b31d0",
  storageBucket: "saferide-b31d0.firebasestorage.app",
  messagingSenderId: "698893575168",
  appId: "1:698893575168:web:d36267b73458ca0ccfa4e5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

let auth;

if (Platform.OS === 'web') {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence
  });
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export { auth };
