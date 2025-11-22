import "./globals.css";
import { ReactNode } from "react";
import Providers from "../components/Providers"; // adjust path if your Providers file differs
import InactivityModal from "../components/InactivityModal";
import Header from "../components/Header";

export const metadata = {
  title: "Todo App - Assignment",
  description: "MERN-like TODO app using Next.js + React Query + Zustand",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* global header — toggles by auth inside Header */}
          <Header />

          {/* main app content */}
          <div className="min-h-[calc(100vh-80px)]">
            {children}
          </div>

          {/* global inactivity modal (mounted once) */}
          <InactivityModal />
        </Providers>
      </body>
    </html>
  );
}
