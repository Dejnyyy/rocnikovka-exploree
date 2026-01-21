// src/pages/map.tsx
import dynamic from "next/dynamic";

function MapPageWrapper() {
  return <ClientMapPage />;
}
export default dynamic(() => Promise.resolve(MapPageWrapper), { ssr: false });

// ---- client-only map below ----
import { useEffect, useRef, useState } from "react";
import maplibregl, {
  Map as MLMap,
  Marker as MLMarker,
  Popup as MLPopup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type Spot = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  coverUrl?: string | null;
  city?: string | null;
  country?: string | null;
};

function ClientMapPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markersRef = useRef<MLMarker[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);

  // fetch spots from DB
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/spots");
        const data = await r.json();
        if (mounted) setSpots(data.spots ?? []);
      } catch (e) {
        console.error("Failed to fetch spots", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [0, 20],
      zoom: 2,
      attributionControl: {},
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // add markers when spots change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!spots.length) return;

    const bounds = new maplibregl.LngLatBounds();

    spots.forEach((s) => {
      // marker element
      const el = document.createElement("div");
      Object.assign(el.style, {
        width: "12px",
        height: "12px",
        borderRadius: "9999px",
        border: "2px solid white",
        boxShadow: "0 0 8px rgba(255,255,255,0.6)",
        cursor: "pointer",
        background: "#ec4899",
      });

      const popupHtml = `
        <div style="text-align:center;max-width:200px">
          ${
            s.coverUrl
              ? `<img src="${s.coverUrl}" alt="${s.title}" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px" />`
              : ""
          }
          <div style="font-weight:600">${s.title ?? ""}</div>
          <div style="font-size:12px;color:#9ca3af">${s.city ?? ""}${
            s.city && s.country ? ", " : ""
          }${s.country ?? ""}</div>
        </div>
      `;
      const popup = new MLPopup({ offset: 12 }).setHTML(popupHtml);

      const marker = new MLMarker({ element: el, anchor: "bottom" })
        .setLngLat([s.lng, s.lat])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend([s.lng, s.lat]);
    });

    // fit map to all markers
    if (spots.length > 1) {
      map.fitBounds(bounds, { padding: 64, duration: 800 });
    } else {
      map.setCenter([spots[0].lng, spots[0].lat]);
      map.setZoom(10);
    }
  }, [spots]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
