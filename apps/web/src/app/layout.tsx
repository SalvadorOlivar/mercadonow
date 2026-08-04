import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MercadoNow",
  description: "Billing MVP — learning lab",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}