import type { Metadata } from "next";
import "./globals.css";
import AuthInitializer from "@/components/layout/AuthInitializer";
import PageTracker from "@/components/layout/PageTracker";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "New Mankamana Printers – B2B Printing Platform",
  description:
    "Professional B2B printing platform. Order visiting cards, pamphlets, letterheads, ID cards, garment tags and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <PageTracker />
        <AuthInitializer>
          {children}
          <Toaster
            // position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              },
              duration: 3500,
            }}
          />
        </AuthInitializer>
      </body>
    </html>
  );
}
