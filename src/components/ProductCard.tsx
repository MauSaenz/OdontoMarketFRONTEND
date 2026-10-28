"use client";

/**
 * Tarjeta de Producto Dental (`src/components/ProductCard.tsx`).
 * Muestra los atributos críticos que un odontólogo necesita ver antes de comprar:
 * - Marca fabricante (`brand`) y Categoría clínica.
 * - Registro Sanitario COFEPRIS / FDA (`sanitary_registration`).
 * - Lote activo (`lot_number`) y Fecha de Caducidad (`expiration_date`).
 * - Variante de presentación (`presentation`).
 * - Precio unitario normal (`price`) y Precio de Mayoreo (`wholesale_price` desde `wholesale_min_qty`).
 * - Conexión directa con `useCartStore` para agregar al carrito en 1 clic.
 */

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarClock,
  Check,
  Eye,
  Hash,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  const handleQuickAdd = () => {
    if (product.stock <= 0) return;
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <article className="group bg-white rounded-3xl border border-slate-200 hover:border-dental-500/70 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden">
      {/* 1. Imagen y Badges Superiores */}
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Marca Fabricante */}
        <span className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-sm text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full">
          {product.brand}
        </span>

        {/* Badge de Descuento por Mayoreo */}
        {product.wholesale_price && product.wholesale_min_qty && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
            <Sparkles className="w-3 h-3" />
            Mayoreo -{Math.round(((product.price - product.wholesale_price) / product.price) * 100)}%
          </span>
        )}

        {/* Indicador de Cadena de Frío si aplica */}
        {product.requires_cold_chain && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 bg-sky-600/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg">
            <Snowflake className="w-3 h-3" />
            Cadena de Frío
          </span>
        )}
      </div>

      {/* 2. Cuerpo Técnico Dental */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Categoría y Registro Sanitario COFEPRIS / FDA */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
            <span className="font-semibold text-dental-700 bg-dental-50 px-2 py-0.5 rounded-md">
              {product.category?.name || "Insumo Dental"}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {product.sanitary_registration}
            </span>
          </div>

          {/* Título del Producto */}
          <Link
            href={`/products/${product.id}`}
            className="block font-extrabold text-slate-900 group-hover:text-dental-700 transition-colors text-base leading-snug line-clamp-2"
          >
            {product.name}
          </Link>

          {/* Presentación */}
          <p className="text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
            📦 {product.presentation}
          </p>

          {/* Metadatos de Lote y Caducidad */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
            <div className="flex items-center gap-1 truncate">
              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">Lote: <strong>{product.lot_number}</strong></span>
            </div>
            <div className="flex items-center gap-1 truncate">
              <CalendarClock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">
                {product.expiration_date
                  ? `Cad: ${product.expiration_date}`
                  : "No caduca"}
              </span>
            </div>
          </div>

          {/* Depósito Dental Vendedor */}
          {product.vendor && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Building2 className="w-3.5 h-3.5 text-dental-600 shrink-0" />
              <span className="truncate">
                Vendido por <strong className="text-slate-700">{product.vendor.business_name}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 3. Bloque de Precios (Menudeo + Mayoreo) y Botones */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xl font-extrabold text-slate-900">
                ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">MXN / ud.</span>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                product.stock > 0
                  ? "bg-sky-50 text-dental-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {product.stock > 0 ? `Stock: ${product.stock}` : "Agotado"}
            </span>
          </div>

          {product.wholesale_price && product.wholesale_min_qty && (
            <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-semibold">
                Mayoreo ({product.wholesale_min_qty}+ uds.):
              </span>
              <span className="font-extrabold text-emerald-700">
                ${product.wholesale_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })} c/u
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="grid grid-cols-5 gap-2 pt-1">
            <Link
              href={`/products/${product.id}`}
              className="col-span-2 inline-flex items-center justify-center gap-1.5 border border-slate-300 hover:border-dental-600 text-slate-700 hover:text-dental-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Detalle</span>
            </Link>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleQuickAdd}
              className={`col-span-3 inline-flex items-center justify-center gap-1.5 font-bold py-2.5 px-3 rounded-xl text-xs shadow-sm transition-all ${
                justAdded
                  ? "bg-emerald-600 text-white"
                  : product.stock > 0
                  ? "bg-dental-600 hover:bg-dental-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Agregado!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Agregar al Carrito</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
