/**
 * Firebase placeholder — configure when connecting to Firestore.
 * Docs: https://firebase.google.com/docs/firestore
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
};

export async function getFirebaseClient() {
  // TODO: initialize Firebase app and return Firestore instance
  throw new Error("Firebase not configured. Set env vars and implement getFirebaseClient.");
}
