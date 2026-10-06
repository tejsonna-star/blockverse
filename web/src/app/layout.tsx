import type { Metadata } from "next";
import { PLATFORM_NAME } from "@/lib/platformConfig";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: PLATFORM_NAME,
  description: `${PLATFORM_NAME} — free browser math practice games`,
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%94%A2%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
