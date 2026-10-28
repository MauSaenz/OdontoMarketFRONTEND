"use client";

/**
 * Barra de Navegación Principal de OdontoMarket (`src/components/Navbar.tsx`).
 * Diseño limpio, médico y comercial inspirado en Mercado Libre / Amazon Dental:
 * 1. Muestra la identidad de la marca con sello de verificación COFEPRIS / FDA.
 * 2. Se suscribe reactivamente a `useAuthStore` y `useCartStore` (Zustand).
 * 3. Adapta los accesos según el rol del usuario (`cliente` Odontólogo vs `vendedor` Depósito Dental).
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  LogIn,
  LogOut,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  UserCheck,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshProfile } = useAuthStore();
  const totalCartUnits = useCartStore((state) => state.getTotalUnits());

  const [mounted, setMounted] = useState(false);
  const [quickSearch, setQuickSearch] = useState("");

  // Evita errores de hidratación entre Server-Side Rendering y localStorage del cliente
  useEffect(() => {
    setMounted(true);
    refreshProfile();
  }, [refreshProfile]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickSearch.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-dental-900 text-white shadow-lg border-b border-dental-800">
      {/* Cinta superior informativa regulatoria */}
      <div className="bg-dental-800/80 text-xs py-1.5 px-4 border-b border-dental-700/60">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sky-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Insumos con Registro Sanitario <strong>COFEPRIS / FDA</strong> y Trazabilidad de Lote
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sky-200">
            <span>Envío Gratis a Consultorios en pedidos mayores a $2,000 MXN</span>
            <span>•</span>
            <span>Precios de Mayoreo Automáticos</span>
          </div>
        </div>
      </div>

      {/* Barra principal */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* 1. Logotipo OdontoMarket */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-dental-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              Odonto<span className="text-sky-400">Market</span>
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-sky-300 font-semibold">
              Marketplace Dental Pro
            </span>
          </div>
        </Link>

        {/* 2. Buscador Rápido estilo Mercado Libre / Amazon */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xl mx-2 order-3 md:order-2 w-full md:w-auto"
        >
          <div className="relative flex items-center">
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Buscar resinas 3M, limas NiTi, piezas de mano NSK, registro COFEPRIS..."
              className="w-full rounded-xl bg-white text-slate-900 placeholder-slate-400 pl-4 pr-11 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-inner"
            />
            <button
              type="submit"
              aria-label="Buscar insumos"
              className="absolute right-1.5 bg-dental-600 hover:bg-dental-500 text-white p-2 rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* 3. Acciones de Usuario, Panel de Vendedor y Carrito */}
        <nav className="flex items-center gap-3 order-2 md:order-3">
          {mounted && isAuthenticated && user ? (
            <>
              {/* Si el usuario es Vendedor (Depósito Dental) o Admin, mostramos enlace a su Panel */}
              {(user.role === "vendedor" || user.role === "admin") && (
                <Link
                  href="/vendor"
                  className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Building2 className="w-4 h-4 text-amber-300" />
                  <span>Panel Depósito</span>
                </Link>
              )}

              {/* Historial de Órdenes del Odontólogo */}
              <Link
                href="/orders"
                className="flex items-center gap-1.5 bg-dental-800 hover:bg-dental-700 px-3 py-2 rounded-xl text-xs font-medium text-sky-100 transition-colors"
              >
                <PackageCheck className="w-4 h-4 text-sky-300" />
                <span className="hidden sm:inline">Mis Pedidos</span>
              </Link>

              {/* Información del Usuario y Rol */}
              <div className="hidden lg:flex items-center gap-2 bg-dental-800/90 border border-dental-700 px-3 py-1.5 rounded-xl">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="leading-tight">
                  <p className="text-xs font-bold text-white truncate max-w-[140px]">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-sky-300 uppercase font-semibold">
                    {user.role === "vendedor"
                      ? user.vendor_profile?.business_name || "Depósito Dental"
                      : user.clinic_name || "Odontólogo"}
                  </p>
                </div>
              </div>

              {/* Botón Cerrar Sesión */}
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                title="Cerrar sesión"
                className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Ingresar / Registro</span>
            </Link>
          )}

          {/* Botón del Carrito con Contador Reactivo */}
          <Link
            href="/cart"
            className="relative flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs shadow transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Carrito</span>
            {mounted && totalCartUnits > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[11px] font-extrabold bg-slate-950 text-emerald-300 rounded-full">
                {totalCartUnits}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
