"use client";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { AuroraBackground } from "@/components/AuroraBackground";

export const BackgroundLayer = () => {
  const { backgroundAnimation } = useGameStore();
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!backgroundAnimation || reducedMotion) return null;
  return <AuroraBackground />;
};
