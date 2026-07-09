"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";
import { firebaseClientConfig, firebaseVapidKey, isFirebaseClientConfigured } from "./config";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let messaging: Messaging | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseClientConfigured()) return null;
  if (!firebaseClientConfig.projectId) return null;
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseClientConfig);
  }
  return app;
}

export function getClientAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!auth) auth = getAuth(firebaseApp);
  return auth;
}

export function getClientFirestore(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!firestore) firestore = getFirestore(firebaseApp);
  return firestore;
}

export async function getClientMessaging(): Promise<Messaging | null> {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  const supported = await isSupported();
  if (!supported) return null;
  if (!messaging) messaging = getMessaging(firebaseApp);
  return messaging;
}
