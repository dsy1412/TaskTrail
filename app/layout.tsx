import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskTrail",
  description: "A modular planning MVP with Today Canvas, Task Backpack, and Focus Trail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
