import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function getAdminApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      // In production, use a service account. For development, the
      // FIREBASE_PROJECT_ID env var is enough if running locally with
      // Firebase emulator or if the server has default credentials.
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        app = initializeApp({ credential: cert(serviceAccount), projectId });
      } else {
        // Initialize without explicit credentials (works with GCP default creds
        // or Firebase emulator)
        app = initializeApp({ projectId });
      }
    } else {
      app = getApps()[0];
    }
  }
  return app!;
}

export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getAdminApp());
  }
  return db;
}
