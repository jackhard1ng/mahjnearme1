import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let app: App | undefined;
let db: Firestore | undefined;

function getAdminApp(): App {
  if (!app) {
    if (getApps().length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
          const serviceAccount = JSON.parse(raw);

          // Fix private key newlines — Vercel sometimes escapes \n as literal \\n
          if (serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
          }

          app = initializeApp({ credential: cert(serviceAccount), projectId });
          console.log("[Firebase Admin] Initialized with service account");
        } catch (err) {
          console.error("[Firebase Admin] Failed to init with service account:", err);
          app = initializeApp({ projectId });
        }
      } else {
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
