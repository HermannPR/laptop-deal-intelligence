import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./globals.css";

export const metadata = {
  title: "LapScrapper — Monitor de ofertas",
  description: "Precios observados y rendimiento por peso para laptops en México.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
