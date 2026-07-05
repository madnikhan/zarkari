/** Safely parse JSON from fetch/XHR — avoids "JSON.parse: unexpected end of data" on empty error bodies. */
export async function parseJsonResponse<T>(res: Response): Promise<T> {
  const raw = await res.text();
  if (!raw.trim()) {
    throw new Error(
      res.ok
        ? "Server returned an empty response"
        : `Request failed (${res.status}) — no response from server. Try again or use a smaller file.`
    );
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Request failed (${res.status}) — invalid server response`);
  }
}

export function parseXhrJson<T>(responseText: string, status: number): T {
  if (!responseText.trim()) {
    throw new Error(`Upload failed (${status}) — server returned an empty response`);
  }
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(`Upload failed (${status}) — invalid server response`);
  }
}
