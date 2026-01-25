"use client";
import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";

export const useSkipSignal = (onSkip: () => void, enabled = true) => {
  const { skipSignal } = useGameStore();
  const lastSignal = useRef(skipSignal);

  useEffect(() => {
    if (!enabled) return;
    if (skipSignal === lastSignal.current) return;
    lastSignal.current = skipSignal;
    onSkip();
  }, [skipSignal, onSkip, enabled]);
};
