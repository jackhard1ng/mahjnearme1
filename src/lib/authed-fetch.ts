import { getFirebaseAuth } from "@/lib/firebase";

/**
 * Wrapper around fetch that automatically attaches the current user's
 * Firebase ID token as a Bearer token in the Authorization header.
 */
export async function authedFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Firebase not available — proceed without token
  }

  return fetch(url, { ...init, headers });
}
