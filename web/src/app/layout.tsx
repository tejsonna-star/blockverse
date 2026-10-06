import type { Metadata } from "next";
import { PLATFORM_NAME } from "@/lib/platformConfig";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: PLATFORM_NAME,
  description: `${PLATFORM_NAME} — a browser multiplayer game hub`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
