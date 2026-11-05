/**
 * Authenticated fetch for the admin screens.
 *
 * All admin writes go through /api/admin-proxy, which verifies a Firebase ID
 * token for an admin user and only then forwards the request downstream with
 * CRON_SECRET attached. The token is the whole point: without an
 * `Authorization: Bearer <idToken>` header the proxy answers
 * `401 {"error":"Missing auth token"}` and nothing downstream ever runs.
 *
 * This used to be copy-pasted into each admin page, and three of the four
 * copies (games, events, mobile) had dropped the token-fetching half. Every
 * write from those screens was rejected at the proxy. The callers compounded
 * it by discarding the response, so the UI reported success for a request that
 * had returned 401 — the reported "edits do not persist, but it says saved".
 *
 * There is one implementation now. Prefer `adminWrite` for mutations: it turns
 * a non-2xx response into a thrown Error carrying the server's message, so a
 * caller cannot accidentally treat a failure as a success.
 */

/** Raw proxied request. Returns the Response; the caller must check `res.ok`. */
export async function adminFetch(
  route: string,
  method: string = "GET",
  body?: unknown
): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const { getFirebaseAuth } = await import("@/lib/firebase");
    const user = getFirebaseAuth().currentUser;
    if (user) {
      const idToken = await user.getIdToken();
      headers.Authorization = `Bearer ${idToken}`;
    }
  } catch (err) {
    console.error("[adminFetch] Failed to get ID token:", err);
  }
  return fetch("/api/admin-proxy", {
    method: "POST",
    headers,
    body: JSON.stringify({ route, method, body }),
  });
}

/**
 * Proxied request that throws on failure.
 *
 * Resolves with the parsed JSON body on a 2xx. On anything else it throws an
 * Error whose message is the server's `error` field where there is one, so the
 * UI can show the actual reason instead of a generic failure.
 */
export async function adminWrite<T = unknown>(
  route: string,
  method: string,
  body?: unknown
): Promise<T> {
  let res: Response;
  try {
    res = await adminFetch(route, method, body);
  } catch {
    // Network-level failure: offline, DNS, request aborted.
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Body was empty or not JSON. Status still decides the outcome.
  }

  if (!res.ok) {
    const fromBody =
      payload && typeof payload === "object" && typeof (payload as { error?: unknown }).error === "string"
        ? (payload as { error: string }).error
        : "";
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        fromBody
          ? `Not authorized: ${fromBody}. Sign out and back in with an admin account.`
          : "Not authorized. Sign out and back in with an admin account."
      );
    }
    throw new Error(fromBody || `Save failed (HTTP ${res.status}).`);
  }

  return payload as T;
}
