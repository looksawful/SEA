import { BackgroundLayer } from "@/components/BackgroundLayer";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import type { Metadata, Viewport } from "next";
import "./globals.css";

const basePath = process.env.NODE_ENV === "production" ? "/SEA" : "";

export const metadata: Metadata = {
  title: "SEA",
  description: "Train your eye to see",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Fira+Code&family=Lato&family=Lora&family=Merriweather&family=Montserrat:wght@400;500;600&family=Nunito&family=Open+Sans&family=Playfair+Display&family=Poppins:wght@400;500;600&family=Roboto&family=Source+Code+Pro&family=Source+Sans+Pro&family=PT+Serif:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon-180.png`} />
        <meta name="theme-color" content="#0b0b0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SEA" />
        <meta name="application-name" content="SEA" />
      </head>
      <body className="antialiased font-body text-strong relative" data-basepath={basePath}>
        <BackgroundLayer />
        <ServiceWorkerRegister />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
