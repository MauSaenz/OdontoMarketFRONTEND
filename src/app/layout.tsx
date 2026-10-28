import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "OdontoMarket | Marketplace Dental Multi-Vendedor",
  description:
    "E-Commerce especializado en Productos, Insumos, Biomateriales y Equipos Dentales con registro COFEPRIS/FDA y precios de mayoreo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-16">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-white text-sm">
                OdontoMarket — Plataforma E-Commerce Dental Multi-Vendedor
              </p>
              <p className="mt-1">
                Trazabilidad sanitaria COFEPRIS / FDA • Precios por volumen para clínicas • Depósitos verificados.
              </p>
            </div>
            <div className="text-right">
              <p>Arquitectura Limpia: FastAPI + SQLAlchemy 2.0 + Next.js + Zustand</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
