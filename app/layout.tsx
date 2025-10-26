import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medicinsk Sökning AI - Hitta Medicinsk Information",
  description: "Sök medicinsk information med AI-driven översättning från vardagliga termer till medicinsk terminologi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
