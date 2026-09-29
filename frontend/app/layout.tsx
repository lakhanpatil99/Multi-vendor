import type { Metadata } from "next";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PRODUCT } from "@/constants/domain";

export const metadata: Metadata = {
  title: {
    default: `${PRODUCT.shortName} — ${PRODUCT.name}`,
    template: `%s · ${PRODUCT.shortName}`,
  },
  description: PRODUCT.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
