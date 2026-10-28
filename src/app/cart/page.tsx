"use client";

/**
 * Carrito de Compras Interactivo y Checkout Clínico (`src/app/cart/page.tsx`).
 * Conecta el estado global persistente en Zustand (`useCartStore`) con el motor
 * transaccional de órdenes en FastAPI (`POST /api/orders`).
 *
 * Funcionalidades clave:
 * 1. Cálculo reactivo en tiempo real de precios de menudeo vs. mayoreo (`resolveEffectivePrice`).
 * 2. Upsell inteligente de un clic: sugiere al odontólogo completar el mínimo de piezas
 *    para desbloquear el precio de mayoreo.
 * 3. Barra de progreso hacia Envío Clínico Gratis ($2,000.00 MXN).
 * 4. Formulario de dirección de entrega del consultorio/clínica y disparo de transacción ACID.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Loader2,
  Lock,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";
import { extractApiErrorMessage, orderService } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  FREE_SHIPPING_THRESHOLD,
  resolveEffectivePrice,
  useCartStore,
} from "@/store/useCartStore";
import type { Order } from "@/types";

export default function CartCheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalUnits,
    getFinancialSummary,
  } = useCartStore();

  const [mounted, setMounted] = useState(false);

  // Estado del formulario de envío clínico
  const [shippingAddress, setShippingAddress] = useState(
    "Av. Insurgentes Sur 1602, Consultorio 402, Col. Crédito Constructor"
  );
  const [shippingCity, setShippingCity] = useState("Ciudad de México");
  const [shippingState, setShippingState] = useState("CDMX");
  const [shippingZip, setShippingZip] = useState("03940");
  const [notes, setNotes] = useState(
    "Entregar en recepción de la clínica dental de 9:00 a 18:00 hrs."
  );

  // Estados de ejecución HTTP hacia FastAPI (`POST /api/orders`)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin text-dental-600" />
          <span className="font-medium">Cargando carrito clínico...</span>
        </div>
      </div>
    );
  }

  const summary = getFinancialSummary();
  const totalUnits = getTotalUnits();
  const remainingForFreeShipping = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD - summary.subtotal
  );
  const freeShippingProgress = Math.min(
    100,
    (summary.subtotal / FREE_SHIPPING_THRESHOLD) * 100
  );

  // ============================================================================
  // MANEJADOR DE CHECKOUT (CONEXIÓN DIRECTA CON `POST /api/orders`)
  // ============================================================================
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Tu carrito está vacío. Agrega insumos antes de procesar la compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Construimos el payload de seguridad: SOLO enviamos `product_id` y `quantity`.
      // El Backend en FastAPI recalcula el precio real, verifica stock y congela `lot_snapshot`.
      const createdOrder = await orderService.createOrder({
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        shipping_state: shippingState.trim(),
        shipping_zip: shippingZip.trim(),
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      });

      setCompletedOrder(createdOrder);
      clearCart();
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // VISTA 1: CONFIRMACIÓN DE ORDEN EXITOSA (POST-CHECKOUT)
  // ============================================================================
  if (completedOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-emerald-100">
                  Transacción ACID Confirmada • Trazabilidad COFEPRIS
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  ¡Orden de Compra #{completedOrder.id} Generada con Éxito!
                </h1>
              </div>
            </div>
            <p className="text-emerald-50 text-sm mt-2">
              El inventario ha sido reservado y los números de lote sanitarios han quedado
              congelados en tu factura clínica para auditorías odontológicas.
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Resumen de Envío y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Destino Clínico de Entrega
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {completedOrder.shipping_address}
                </p>
                <p className="text-xs text-slate-600">
                  {completedOrder.shipping_city}, {completedOrder.shipping_state} • C.P.{" "}
                  {completedOrder.shipping_zip}
                </p>
              </div>
              <div className="md:text-right">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Estado de la Orden
                </p>
                <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedOrder.status}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Fecha:{" "}
                  {new Date(completedOrder.created_at).toLocaleString("es-MX")}
                </p>
              </div>
            </div>

            {/* Renglones comprados con Lote Sanitario Congelado */}
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                Insumos Adquiridos y Lotes Sanitarios Congelados
              </h2>
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                {completedOrder.items.map((line) => (
                  <div
                    key={line.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 bg-white"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        {line.product?.name || `Producto #${line.product_id}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          Lote Congelado: {line.lot_snapshot}
                        </span>
                        <span>•</span>
                        <span>Cantidad: {line.quantity} u.</span>
                        {line.applied_wholesale && (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Precio Mayoreo Aplicado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">
                        ${line.unit_price.toLocaleString("es-MX", { minimumFractionDigits: 2 })} c/u
                      </p>
                      <p className="text-sm font-extrabold text-slate-900">
                        ${line.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desglose Financiero Final */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Subtotal de Insumos:</span>
                <span>
                  ${completedOrder.subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>IVA Clínico (16%):</span>
                <span>
                  ${completedOrder.tax_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Envío Especializado:</span>
                <span>
                  {completedOrder.shipping_cost === 0
                    ? "GRATIS"
                    : `$${completedOrder.shipping_cost.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })} MXN`}
                </span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-lg font-extrabold text-emerald-400">
                <span>Total Pagado:</span>
                <span>
                  ${completedOrder.total_amount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>

            {/* Botones de Acción Post-Compra */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-dental-700 hover:text-dental-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Catálogo Dental
              </Link>
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-colors text-sm"
              >
                <PackageCheck className="w-4 h-4" />
                Ver Historial en Mis Pedidos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 2: CARRITO VACÍO
  // ============================================================================
  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-12 shadow-sm">
          <div className="w-20 h-20 rounded-3xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5">
            <ShoppingBag className="w-10 h-10 text-dental-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Tu Carrito Clínico está vacío
          </h1>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2">
            Explora nuestro catálogo de resinas 3M, anestésicos, instrumental rotatorio
            NSK y biomateriales con precios automáticos de mayoreo para tu consultorio.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-colors text-sm"
            >
              Explorar Catálogo Dental
              <ArrowRight className="w-4 h-4" />
            </Link>
            {isAuthenticated && (
              <Link
                href="/orders"
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                <PackageCheck className="w-4 h-4" />
                Consultar Mis Pedidos
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VISTA 3: CARRITO INTERACTIVO Y FORMULARIO DE CHECKOUT
  // ============================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-dental-700 hover:text-dental-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Seguir comprando insumos
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Carrito de Compras y Checkout Clínico
          </h1>
          <p className="text-sm text-slate-600">
            Tienes <strong>{totalUnits}</strong>{" "}
            {totalUnits === 1 ? "unidad lista" : "unidades listas"} con trazabilidad de
            lote sanitario garantizada.
          </p>
        </div>

        <button
          onClick={clearCart}
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Vaciar Carrito
        </button>
      </div>

      {/* Barra de Progreso de Envío Gratis ($2,000 MXN) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 text-xs font-bold mb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <Truck className="w-4 h-4 text-dental-600" />
            {remainingForFreeShipping === 0 ? (
              <span className="text-emerald-700">
                ¡Felicidades! Tu pedido califica para{" "}
                <strong>Envío Clínico Especializado GRATIS</strong>.
              </span>
            ) : (
              <span>
                Agrega{" "}
                <strong className="text-dental-700">
                  $
                  {remainingForFreeShipping.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MXN
                </strong>{" "}
                más para obtener <strong>Envío Gratis</strong> a tu consultorio.
              </span>
            )}
          </div>
          <span className="text-slate-500">
            Meta: ${FREE_SHIPPING_THRESHOLD.toLocaleString("es-MX")} MXN
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              remainingForFreeShipping === 0 ? "bg-emerald-500" : "bg-dental-600"
            }`}
            style={{ width: `${freeShippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA (7 cols): Lista de Insumos en el Carrito */}
        <div className="lg:col-span-7 space-y-4">
          {items.map(({ product, quantity }) => {
            const { unitPrice, isWholesale } = resolveEffectivePrice(
              product,
              quantity
            );
            const lineSubtotal = Number((unitPrice * quantity).toFixed(2));
            const regularSubtotal = Number((product.price * quantity).toFixed(2));
            const lineSavings = Number((regularSubtotal - lineSubtotal).toFixed(2));

            // ¿Cuántas piezas faltan para activar mayoreo en este producto?
            const hasWholesaleOffer =
              product.wholesale_price != null && product.wholesale_min_qty != null;
            const unitsNeededForWholesale =
              hasWholesaleOffer && !isWholesale
                ? Math.max(0, (product.wholesale_min_qty as number) - quantity)
                : 0;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-sky-200 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Imagen del Insumo */}
                  <Link
                    href={`/products/${product.id}`}
                    className="w-full sm:w-28 h-28 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center"
                  >
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Información Técnica y Regulatoria */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-dental-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {product.brand}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        SKU: {product.sku}
                      </span>
                      {product.requires_cold_chain && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded-md border border-cyan-200">
                          <Snowflake className="w-3 h-3" />
                          Red Fría
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/products/${product.id}`}
                      className="text-base font-extrabold text-slate-900 hover:text-dental-600 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>

                    <p className="text-xs text-slate-600 mt-0.5">
                      Presentación: <strong>{product.presentation}</strong>
                    </p>

                    {/* Metadatos Sanitarios COFEPRIS y Lote */}
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-medium">
                        <FileCheck2 className="w-3 h-3 text-emerald-600" />
                        Reg. Sanitario: {product.sanitary_registration}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        Lote: {product.lot_number}
                      </span>
                      {product.vendor && (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3 h-3" />
                          {product.vendor.business_name}
                        </span>
                      )}
                    </div>

                    {/* Upsell interactivo de Mayoreo */}
                    {hasWholesaleOffer && !isWholesale && unitsNeededForWholesale > 0 && (
                      <div className="mt-3 bg-amber-50/90 border border-amber-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-amber-900">
                          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            ¡Agrega <strong>{unitsNeededForWholesale} u. más</strong> para
                            activar Mayoreo a{" "}
                            <strong>
                              $
                              {product.wholesale_price?.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              c/u
                            </strong>
                            !
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              product.id,
                              product.wholesale_min_qty as number
                            )
                          }
                          disabled={
                            (product.wholesale_min_qty as number) > product.stock
                          }
                          className="text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Subir a {product.wholesale_min_qty} u.
                        </button>
                      </div>
                    )}

                    {/* Badge cuando el Mayoreo YA está activo */}
                    {isWholesale && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                        <Tag className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Precio de Mayoreo Activo (Ahorras $
                          {lineSavings.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN en esta línea)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Controles de Cantidad y Subtotal por Línea */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      {isWholesale && (
                        <p className="text-xs text-slate-400 line-through">
                          $
                          {product.price.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          c/u
                        </p>
                      )}
                      <p className="text-xs font-semibold text-slate-500">
                        $
                        {unitPrice.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        c/u
                      </p>
                      <p className="text-lg font-extrabold text-slate-900">
                        $
                        {lineSubtotal.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Botonera - / + / Eliminar */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-l-xl transition-colors"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-extrabold text-slate-900 min-w-[2.2rem] text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          disabled={quantity >= product.stock}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-r-xl transition-colors disabled:opacity-40"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        title="Quitar insumo del carrito"
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Stock máx: {product.stock} u.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* COLUMNA DERECHA (5 cols): Resumen Financiero y Checkout Clínico */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-dental-600" />
              Resumen Financiero y Checkout
            </h2>

            {/* Desglose de Importes */}
            <div className="space-y-3 py-4 text-sm border-b border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({totalUnits} unidades):</span>
                <span className="font-bold text-slate-900">
                  $
                  {summary.subtotal.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MXN
                </span>
              </div>

              {summary.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold text-xs">
                  <span>Ahorro por Precios de Mayoreo:</span>
                  <span>
                    -$
                    {summary.totalSavings.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    MXN
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>IVA Clínico (16%):</span>
                <span className="font-semibold text-slate-800">
                  $
                  {summary.taxAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  MXN
                </span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Envío Especializado:</span>
                {summary.shippingCost === 0 ? (
                  <span className="font-extrabold text-emerald-600">
                    GRATIS ($0.00)
                  </span>
                ) : (
                  <span className="font-semibold text-slate-800">
                    $
                    {summary.shippingCost.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    MXN
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-slate-900">
                  Total Neto a Pagar:
                </span>
                <span className="text-2xl font-extrabold text-dental-700">
                  $
                  {summary.totalAmount.toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs font-semibold text-slate-500">MXN</span>
                </span>
              </div>
            </div>

            {/* Formulario de Dirección Clínica */}
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-dental-600" />
                  Datos de Entrega del Consultorio / Clínica
                </h3>
              </div>

              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Completa del Consultorio *
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Calle, número, interior/consultorio y colonia"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estado *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código Postal *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={4}
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instrucciones de Recepción Clínica (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Horario de recepción, indicaciones de cadena de frío, etc."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                />
              </div>

              {/* Botón de Confirmación o Aviso de Login */}
              {!isAuthenticated ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                  <p className="text-xs text-amber-900 font-medium">
                    Para procesar tu orden y registrar los lotes sanitarios a nombre
                    de tu consultorio, inicia sesión con tu cuenta de Odontólogo.
                  </p>
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Iniciar Sesión para Completar Compra
                  </Link>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition-all text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando Orden y Reservando Lotes...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Confirmar y Pagar $
                      {summary.totalAmount.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      MXN
                    </>
                  )}
                </button>
              )}

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  Transacción protegida con JWT • Congelamiento de lote COFEPRIS
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
