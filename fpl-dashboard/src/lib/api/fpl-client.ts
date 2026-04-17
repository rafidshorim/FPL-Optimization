// Simple fetch wrappers used by SWR hooks.
// All requests go to our own Next.js API routes, never directly to FPL.

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.message ?? `HTTP ${res.status}`);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }

  return res.json() as Promise<T>;
}
