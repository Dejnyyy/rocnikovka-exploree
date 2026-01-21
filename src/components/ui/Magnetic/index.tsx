"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export const Magnetic: React.FC<
  React.PropsWithChildren<{ strength?: number; className?: string }>
> = ({ strength = 0.25, className, children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const inner = el.querySelector("[data-magnet-inner]") as HTMLElement | null;
    if (!inner) return;

    const xTo = gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" });

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      xTo(dx);
      yTo(dy);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className}>
      <div data-magnet-inner className="will-change-transform">
        {children}
      </div>
    </div>
  );
};
