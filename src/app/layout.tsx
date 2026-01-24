import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "painful",
  description: "Train your design eye",
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
      </head>
      <body className="antialiased font-body text-strong">{children}</body>
    </html>
  );
}
