import "./globals.css";
import Providers from "../components/Providers";
import InactivityModal from "../components/InactivityModal";

export const metadata = {
  title: "Todo App - Assignment",
  description: "MERN-like TODO app using Next.js + React Query + Zustand",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <InactivityModal />
        </Providers>
      </body>
    </html>
  );
}
