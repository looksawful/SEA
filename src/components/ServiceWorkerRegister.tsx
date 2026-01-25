"use client";
import { useEffect } from "react";

export const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const basePath = document.body?.dataset?.basepath ?? "";
    const swUrl = `${basePath}/sw.js`;
    navigator.serviceWorker.register(swUrl).catch(() => undefined);
  }, []);

  return null;
};
