// components/GlobalLoader.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import Router from "next/router";

export function GlobalLoader() {
  // Track all fetching queries, including people query
  const fetching = useIsFetching();
  // Also explicitly track people query (matches any query starting with "people")
  const fetchingPeople = useIsFetching({
    predicate: (query) => query.queryKey[0] === "people",
  });
  const mutating = useIsMutating();
  const videoRef = useRef<HTMLVideoElement>(null);

  // route-change activity
  const [routeLoading, setRouteLoading] = useState(false);
  useEffect(() => {
    const onStart = () => setRouteLoading(true);
    const onEnd = () => setRouteLoading(false);
    Router.events.on("routeChangeStart", onStart);
    Router.events.on("routeChangeComplete", onEnd);
    Router.events.on("routeChangeError", onEnd);
    return () => {
      Router.events.off("routeChangeStart", onStart);
      Router.events.off("routeChangeComplete", onEnd);
      Router.events.off("routeChangeError", onEnd);
    };
  }, []);

  // Restart video when loader becomes active
  useEffect(() => {
    const active =
      routeLoading || fetching > 0 || fetchingPeople > 0 || mutating > 0;
    if (active && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Ignore play errors
      });
    }
  }, [routeLoading, fetching, fetchingPeople, mutating]);

  const active =
    routeLoading || fetching > 0 || fetchingPeople > 0 || mutating > 0;
  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-36 h-36">
        <video
          ref={videoRef}
          src="/logos/exploree.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
