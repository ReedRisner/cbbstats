import { API_BASE } from "./constants";

const headers: HeadersInit = {
  Authorization: `Bearer ${process.env.NEXT_PUBLIC_CBB_API_KEY}`,
  Accept: "application/json",
};

export async function apiFetch<T>(
  endpoint: string,
  params: Record<string, string | number | undefined | null> = {}
): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "")
      url.searchParams.append(k, String(v));
  });
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}
