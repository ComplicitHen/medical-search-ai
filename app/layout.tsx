import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Search AI - Find Medical Information",
  description: "Search medical information with AI-powered translation from layman's terms to medical terminology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
