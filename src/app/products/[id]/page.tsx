"use client";

/**
 * Vista Detallada de Producto Dental (`src/app/products/[id]/page.tsx`).
 * Diseño estilo Mercado Libre / Amazon especializado en Odontología:
 * 1. Carga en paralelo (`Promise.all`) la ficha del producto, sus preguntas (`questions`) y sus reseñas (`reviews`).
 * 2. Muestra la tabla técnica regulatoria completa (SKU, Marca, Registro COFEPRIS/FDA, Lote, Caducidad, Presentación).
 * 3. Incluye una Calculadora Interactiva de Compra por Volumen: si el odontólogo selecciona una cantidad
 *    igual o mayor a `wholesale_min_qty`, resalta en vivo el Precio de Mayoreo activado y el ahorro total.
 * 4. Integra el módulo `<QuestionSection />` para preguntas al vendedor y reseñas con Compra Verificada.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Hash,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Snowflake,
  Sparkles,
  Star,
} from "lucide-react";
import QuestionSection from "@/components/QuestionSection";
import {
  catalogService,
  extractApiErrorMessage,
  interactionService,
} from "@/services/api";
import { resolveEffectivePrice, useCartStore } from "@/store/useCartStore";
import type { Product, Question, Review } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id);

  const addItem = useCartStore((state) => state.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [addedBanner, setAddedBanner] = useState(false);

  useEffect(() => {
    if (!productId || Number.isNaN(productId)) return;

    async function loadProductBundle() {
      try {
        setLoading(true);
        const [prodData, qList, rList] = await Promise.all([
          catalogService.getProductById(productId),
          interactionService.getProductQuestions(productId),
          interactionService.getProductReviews(productId),
        ]);
        setProduct(prodData);
        setQuestions(qList);
        setReviews(rList);
      } catch (err) {
        setError(extractApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }
    loadProductBundle();
  }, [productId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <div className="h-96 rounded-3xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
          <p className="text-base font-bold text-rose-600">
            {error || "Producto dental no encontrado."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-dental-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Catálogo</span>
          </Link>
        </div>
      </div>
    );
  }

  const { unitPrice, isWholesale } = resolveEffectivePrice(product, quantity);
  const totalLine = unitPrice * quantity;
  const savingsAmount = isWholesale
    ? (product.price - unitPrice) * quantity
    : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAddedBanner(true);
    setTimeout(() => setAddedBanner(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push("/cart");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Migas de pan (Breadcrumbs) */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-dental-700 font-bold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catálogo Dental</span>
        </Link>
        <span>/</span>
        <span>{product.category?.name || "Especialidad"}</span>
        <span>/</span>
        <span className="text-slate-800 font-semibold truncate max-w-xs">
          {product.name}
        </span>
      </div>

      {/* Bloque Principal: Imagen (5 cols) + Especificaciones (4 cols) + Caja de Compra (3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna 1: Fotografía del Insumo y Sellos Regulatorios */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-slate-100">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-3 left-3 bg-slate-950/90 text-white text-xs font-extrabold px-3 py-1 rounded-full">
              {product.brand}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-700">
                  Registro Sanitario
                </p>
                <p className="font-extrabold text-emerald-950">
                  {product.sanitary_registration}
                </p>
              </div>
            </div>

            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex items-center gap-2.5">
              <CalendarClock className="w-5 h-5 text-dental-600 shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-bold text-dental-700">
                  Caducidad de Lote
                </p>
                <p className="font-extrabold text-slate-900">
                  {product.expiration_date || "No caduca (Equipo)"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna 2: Ficha Técnica Clínica y Datos del Depósito Dental */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-dental-700 bg-dental-50 px-3 py-1 rounded-full">
                {product.category?.name}
              </span>
              <span className="text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Tabla de Especificaciones Dentales */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                Especificaciones Clínicas y Trazabilidad
              </h3>

              <div className="grid grid-cols-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fabricante / Marca:</span>
                <span className="font-bold text-slate-900">{product.brand}</span>
              </div>

              <div className="grid grid-cols-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Presentación:</span>
                <span className="font-bold text-slate-900">
                  {product.presentation}
                </span>
              </div>

              <div className="grid grid-cols-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" /> Lote en Almacén:
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {product.lot_number}
                </span>
              </div>

              <div className="grid grid-cols-2 py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Cadena de Frío:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  {product.requires_cold_chain ? (
                    <>
                      <Snowflake className="w-3.5 h-3.5 text-sky-600" />
                      Sí (Envío Refrigerado)
                    </>
                  ) : (
                    "No requiere (Temp. Ambiente)"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Tarjeta del Depósito Dental Vendedor */}
          {product.vendor && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-dental-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Distribuido oficialmente por
                    </p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {product.vendor.business_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.vendor.rating_avg.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {product.vendor.city}, {product.vendor.state}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Licencia: {product.vendor.sanitary_license}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna 3: Caja de Compra y Calculadora de Mayoreo estilo Amazon / Mercado Libre */}
        <div className="lg:col-span-3 bg-white rounded-3xl border-2 border-dental-600/20 p-6 shadow-md space-y-5 sticky top-24">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Precio Unitario Aplicado
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                ${unitPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500">MXN</span>
            </div>
            {isWholesale && (
              <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                ¡Precio de Mayoreo Activado! (Normal: ${product.price.toFixed(2)})
              </p>
            )}
          </div>

          {/* Escala de Precios por Volumen */}
          {product.wholesale_price && product.wholesale_min_qty && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                Escala de Precios para Clínicas
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-xl border ${
                    !isWholesale
                      ? "bg-white border-dental-600 font-bold text-slate-900 shadow-sm"
                      : "border-slate-200 text-slate-500"
                  }`}
                >
                  <p className="text-[10px]">1 a {product.wholesale_min_qty - 1} uds.</p>
                  <p className="text-sm font-extrabold">${product.price.toFixed(2)}</p>
                </div>
                <div
                  className={`p-2.5 rounded-xl border ${
                    isWholesale
                      ? "bg-emerald-50 border-emerald-600 font-bold text-emerald-950 shadow-sm"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <p className="text-[10px]">{product.wholesale_min_qty}+ unidades</p>
                  <p className="text-sm font-extrabold text-emerald-700">
                    ${product.wholesale_price.toFixed(2)}
                  </p>
                </div>
              </div>
              {!isWholesale && (
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(
                      Math.min(product.wholesale_min_qty!, product.stock)
                    )
                  }
                  className="w-full text-center text-[11px] font-bold text-emerald-700 hover:underline pt-1"
                >
                  ⚡ Subir a {product.wholesale_min_qty} unidades para activar mayoreo
                </button>
              )}
            </div>
          )}

          {/* Selector de Cantidad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Cantidad:</span>
              <span className="text-slate-500">
                Disponibles: <strong>{product.stock}</strong>
              </span>
            </div>

            <div className="flex items-center justify-between border border-slate-300 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-base font-extrabold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Resumen Subtotal de la Selección */}
          <div className="pt-3 border-t border-slate-100 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Subtotal ({quantity} uds.):</span>
              <span className="text-base font-extrabold text-slate-900">
                ${totalLine.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
              </span>
            </div>
            {savingsAmount > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-bold">
                <span>Ahorro por mayoreo:</span>
                <span>-${savingsAmount.toFixed(2)} MXN</span>
              </div>
            )}
          </div>

          {addedBanner && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>¡Se agregaron {quantity} uds. a tu carrito!</span>
            </div>
          )}

          {/* Botones de Compra */}
          <div className="space-y-2.5">
            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleBuyNow}
              className="w-full flex items-center justify-center gap-2 bg-dental-600 hover:bg-dental-700 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Comprar Ahora</span>
            </button>

            <button
              type="button"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-dental-50 hover:bg-dental-100 text-dental-800 border border-dental-200 font-extrabold py-3 px-4 rounded-2xl text-xs sm:text-sm transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Agregar al Carrito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Preguntas al Vendedor y Reseñas Verificadas */}
      <QuestionSection
        productId={product.id}
        productVendorId={product.vendor_id}
        initialQuestions={questions}
        initialReviews={reviews}
      />
    </div>
  );
}
