"use client";

/**
 * Home del Marketplace OdontoMarket (`src/app/page.tsx` - Fase 5 Completa).
 * Diseño inspirado en Mercado Libre / Amazon especializado en Odontología:
 * 1. Sincroniza la búsqueda de la barra superior (`?search=...`) con el estado local de filtros.
 * 2. Muestra accesos rápidos por Especialidad Clínica en la parte superior.
 * 3. Conecta el `FilterSidebar` lateral con `catalogService.getProducts(filters)` en tiempo real.
 * 4. Renderiza la grilla de tarjetas técnicas `ProductCard`.
 */

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PackageSearch,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import FilterSidebar from "@/components/FilterSidebar";
import ProductCard from "@/components/ProductCard";
import { catalogService, extractApiErrorMessage } from "@/services/api";
import type { Category, Product, ProductFilterParams } from "@/types";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get("search") || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<ProductFilterParams>({
    search: urlSearch || undefined,
    sort_by: "newest",
  });

  // Sincronizar cuando cambia el parámetro ?search= desde el Navbar
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: urlSearch || undefined,
    }));
  }, [urlSearch]);

  // Cargar categorías y marcas disponibles una sola vez al montar
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [cats, brandList] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands(),
        ]);
        setCategories(cats);
        setBrands(brandList);
      } catch (err) {
        setError(extractApiErrorMessage(err));
      }
    }
    loadMetadata();
  }, []);

  // Consultar productos en FastAPI cada vez que cambian los filtros
  const fetchFilteredProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogService.getProducts(filters);
      setProducts(data);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  const handleFilterChange = (updated: Partial<ProductFilterParams>) => {
    setFilters((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: undefined,
      category_id: undefined,
      brand: undefined,
      min_price: undefined,
      max_price: undefined,
      in_stock_only: undefined,
      wholesale_only: undefined,
      sort_by: "newest",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 1. Hero Banner Clínico y Comercial */}
      <section className="bg-gradient-to-r from-dental-900 via-dental-800 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-sky-400/20 border border-sky-300/30 text-sky-200 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Depósitos Dentales Verificados • COFEPRIS / FDA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Todo para tu Consultorio y Clínica Dental en un solo lugar
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed">
            Compara lotes vigentes, fechas de caducidad y activa{" "}
            <strong>descuentos automáticos de mayoreo</strong> al comprar por volumen.
          </p>
        </div>

        {/* Buscador rápido en el Hero */}
        <div className="w-full lg:w-96 bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl space-y-2">
          <label className="block text-xs font-bold text-sky-200">
            Búsqueda instantánea por insumo, marca o registro:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={filters.search || ""}
              onChange={(e) =>
                handleFilterChange({
                  search: e.target.value || undefined,
                })
              }
              placeholder="Ej. Filtek, NSK, Articaína, COFEPRIS..."
              className="w-full rounded-xl bg-white text-slate-900 pl-10 pr-8 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleFilterChange({ search: undefined })}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Cinta Rápida de Categorías Clínicas */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => handleFilterChange({ category_id: undefined })}
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
            filters.category_id === undefined
              ? "bg-dental-700 border-dental-700 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-700 hover:border-dental-400"
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Todas las Categorías</span>
        </button>

        {categories.map((cat) => {
          const isSelected = filters.category_id === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() =>
                handleFilterChange({
                  category_id: isSelected ? undefined : cat.id,
                })
              }
              className={`shrink-0 px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${
                isSelected
                  ? "bg-dental-700 border-dental-700 text-white shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:border-dental-400"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </section>

      {/* 3. Layout Principal: Sidebar Lateral (3 cols) + Grilla de Productos (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3">
          <FilterSidebar
            categories={categories}
            brands={brands}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        </div>

        <div className="lg:col-span-9 space-y-4">
          {/* Barra de estado de resultados y chips de filtros activos */}
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold text-slate-700">
              Mostrando{" "}
              <span className="text-dental-700 font-extrabold">
                {products.length}
              </span>{" "}
              {products.length === 1
                ? "insumo dental encontrado"
                : "insumos dentales encontrados"}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              {filters.brand && (
                <span className="inline-flex items-center gap-1 bg-dental-50 text-dental-800 border border-dental-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  Marca: {filters.brand}
                  <button
                    type="button"
                    onClick={() => handleFilterChange({ brand: undefined })}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.wholesale_only && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  Con Mayoreo
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* Grilla de Tarjetas de Producto */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-96 rounded-3xl bg-slate-200 animate-pulse"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <PackageSearch className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                No encontramos insumos con esos filtros
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Intenta limpiar los filtros de marca o rango de precio para ver todo el catálogo dental disponible.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-dental-600 hover:bg-dental-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-sm text-slate-500">
          Cargando catálogo odontológico...
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
