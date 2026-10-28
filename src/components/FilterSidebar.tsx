"use client";

/**
 * Panel Lateral de Filtros Clínicos y Comerciales (`src/components/FilterSidebar.tsx`).
 * Estilo Mercado Libre / Amazon Dental:
 * Permite al odontólogo filtrar el catálogo combinando:
 * 1. Especialidad Odontológica (`category_id`).
 * 2. Marca Fabricante (`brand`, cargada dinámicamente de `/api/products/brands`).
 * 3. Rango de Precios (`min_price`, `max_price`).
 * 4. Disponibilidad inmediata (`in_stock_only`) y Descuento de Mayoreo (`wholesale_only`).
 * 5. Criterio de ordenamiento (`sort_by`).
 */

import React from "react";
import {
  Award,
  Filter,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import type { Category, ProductFilterParams } from "@/types";

interface FilterSidebarProps {
  categories: Category[];
  brands: string[];
  filters: ProductFilterParams;
  onFilterChange: (updated: Partial<ProductFilterParams>) => void;
  onResetFilters: () => void;
}

export default function FilterSidebar({
  categories,
  brands,
  filters,
  onFilterChange,
  onResetFilters,
}: FilterSidebarProps) {
  return (
    <aside className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-6">
      {/* Encabezado del Panel Lateral */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
          <Filter className="w-4 h-4 text-dental-600" />
          <span>Filtros Clínicos</span>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1 text-xs font-semibold text-dental-600 hover:text-dental-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* 1. Ordenamiento */}
      <div className="space-y-2">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <SlidersHorizontal className="w-3.5 h-3.5 text-dental-600" />
          <span>Ordenar por</span>
        </label>
        <select
          value={filters.sort_by || "newest"}
          onChange={(e) =>
            onFilterChange({
              sort_by: e.target.value as ProductFilterParams["sort_by"],
            })
          }
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-dental-500"
        >
          <option value="newest">Más recientes</option>
          <option value="price_asc">Menor a mayor precio</option>
          <option value="price_desc">Mayor a menor precio</option>
          <option value="name_asc">Nombre (A - Z)</option>
        </select>
      </div>

      {/* 2. Especialidades Odontológicas */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Layers className="w-3.5 h-3.5 text-dental-600" />
          <span>Especialidad Dental</span>
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onFilterChange({ category_id: undefined })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filters.category_id === undefined
                ? "bg-dental-600 text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Todas las especialidades
          </button>
          {categories.map((cat) => {
            const active = filters.category_id === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() =>
                  onFilterChange({
                    category_id: active ? undefined : cat.id,
                  })
                }
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? "bg-dental-600 text-white font-bold shadow-sm"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Marca Fabricante Dental */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Award className="w-3.5 h-3.5 text-dental-600" />
          <span>Marca Fabricante</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ brand: undefined })}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
              !filters.brand
                ? "bg-dental-50 border-dental-600 text-dental-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            }`}
          >
            Todas
          </button>
          {brands.map((brandName) => {
            const active = filters.brand === brandName;
            return (
              <button
                key={brandName}
                type="button"
                onClick={() =>
                  onFilterChange({
                    brand: active ? undefined : brandName,
                  })
                }
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  active
                    ? "bg-dental-600 border-dental-600 text-white"
                    : "border-slate-200 text-slate-700 hover:border-dental-400"
                }`}
              >
                {brandName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Rango de Precios */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Tag className="w-3.5 h-3.5 text-dental-600" />
          <span>Rango de Precio (MXN)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Mínimo</label>
            <input
              type="number"
              min={0}
              placeholder="$0"
              value={filters.min_price ?? ""}
              onChange={(e) =>
                onFilterChange({
                  min_price: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-dental-500"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-1">Máximo</label>
            <input
              type="number"
              min={0}
              placeholder="Sin límite"
              value={filters.max_price ?? ""}
              onChange={(e) =>
                onFilterChange({
                  max_price: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-dental-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Filtros Rápidos de Mayoreo y Stock */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.wholesale_only)}
            onChange={(e) =>
              onFilterChange({ wholesale_only: e.target.checked || undefined })
            }
            className="w-4 h-4 rounded text-dental-600 focus:ring-dental-500"
          />
          <span className="text-xs font-semibold text-slate-700">
            Solo con Precio de Mayoreo
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={Boolean(filters.in_stock_only)}
            onChange={(e) =>
              onFilterChange({ in_stock_only: e.target.checked || undefined })
            }
            className="w-4 h-4 rounded text-dental-600 focus:ring-dental-500"
          />
          <span className="text-xs font-semibold text-slate-700">
            Solo con Stock Disponible
          </span>
        </label>
      </div>
    </aside>
  );
}
