import { getFirebaseAuth } from "@/lib/firebase";

/**
 * Authenticated admin fetch — sends the current user's Firebase ID token
 * when proxying requests through /api/admin-proxy.
 */
export async function adminFetch(
  route: string,
  method: string = "GET",
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Firebase not available — request will fail auth on the server
  }

  return fetch("/api/admin-proxy", {
    method: "POST",
    headers,
    body: JSON.stringify({ route, method, body }),
  });
}
