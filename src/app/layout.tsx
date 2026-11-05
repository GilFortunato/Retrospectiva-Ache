import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Programa PcD – Propagandista Trainee",
  description: "Mais que contratar, queremos incluir.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
