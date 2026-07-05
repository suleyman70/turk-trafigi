import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Türk Trafiği | Endless Runner Araba Oyunu",
  description: "İstanbul trafiğinde makas atarak ilerle, engellerden kaç ve en yüksek skoru yap! Türkçe sesler ve eğlenceli Phaser oynanışı.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Türk Trafiği",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d0f13",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={outfit.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('SW registered:', reg.scope);
                    },
                    function(err) {
                      console.log('SW failure:', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

