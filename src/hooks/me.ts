// hooks/me.ts
import { useQuery } from "@tanstack/react-query";

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useMySpots(cursor?: string) {
  const url = cursor ? `/api/me/spots?cursor=${cursor}` : `/api/me/spots`;
  return useQuery({
    queryKey: ["me", "spots", cursor ?? ""],
    queryFn: () =>
      getJSON<{
        items: Array<{
          id: string;
          title: string;
          coverUrl: string | null;
          city: string | null;
          country: string | null;
          slug: string;
          lat: number;
          lng: number;
          createdAt: string;
        }>;
        nextCursor?: string | null;
      }>(url),
  });
}

export function useMyCollections() {
  return useQuery({
    queryKey: ["me", "collections"],
    queryFn: () =>
      getJSON<{
        items: Array<{
          id: string;
          name: string;
          slug: string;
          isPublic: boolean;
          count: number;
          coverUrl: string | null;
        }>;
      }>("/api/me/collections"),
  });
}

export function useMySaved(cursor?: string) {
  const url = cursor ? `/api/me/saved?cursor=${cursor}` : `/api/me/saved`;
  return useQuery({
    queryKey: ["me", "saved", cursor ?? ""],
    queryFn: () =>
      getJSON<{
        items: Array<{
          id: string;
          title: string;
          coverUrl: string | null;
          city: string | null;
          country: string | null;
          slug: string;
          lat: number;
          lng: number;
          createdAt: string;
        }>;
        nextCursor?: string | null;
      }>(url),
  });
}
