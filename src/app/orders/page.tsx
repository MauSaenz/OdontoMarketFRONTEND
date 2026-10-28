"use client";

/**
 * Historial de Órdenes de Compra y Trazabilidad Sanitaria (`src/app/orders/page.tsx`).
 * Consume `GET /api/orders/my-orders` para mostrar al Odontólogo / Clínica:
 * 1. El estado logístico en tiempo real (`Pendiente` -> `Pagado` -> `Enviado` -> `Entregado`).
 * 2. El número de guía de rastreo (`tracking_number`) asignado por el Depósito Dental.
 * 3. La bitácora inmutable de lotes sanitarios (`lot_snapshot`) y precios congelados
 *    (`unit_price` y `applied_wholesale`) para auditorías de COFEPRIS / FDA.
 */

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  Lock,
  MapPin,
  Package,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import { extractApiErrorMessage, orderService } from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Order, OrderStatus } from "@/types";

const STATUS_STEPS: OrderStatus[] = [
  "Pendiente",
  "Pagado",
  "Enviado",
  "Entregado",
];

function getStatusBadgeStyle(status: OrderStatus): {
  bg: string;
  text: string;
  border: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case "Pendiente":
      return {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200",
        icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
      };
    case "Pagado":
      return {
        bg: "bg-sky-50",
        text: "text-sky-800",
        border: "border-sky-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />,
      };
    case "Enviado":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-800",
        border: "border-indigo-200",
        icon: <Truck className="w-3.5 h-3.5 text-indigo-600" />,
      };
    case "Entregado":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-800",
        border: "border-emerald-200",
        icon: <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />,
      };
    case "Cancelado":
      return {
        bg: "bg-rose-50",
        text: "text-rose-800",
        border: "border-rose-200",
        icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
      };
  }
}

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchOrders();
    } else if (mounted && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [mounted, isAuthenticated, fetchOrders]);

  if (!mounted) {
    return null;
  }

  // Si el usuario no ha iniciado sesión, solicitamos autenticación JWT
  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-dental-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Inicia sesión para consultar tus Pedidos Clínicos
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-2">
            Accede a tu historial de órdenes, descarga la trazabilidad de lotes
            sanitarios COFEPRIS y rastrea tus envíos.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow transition-colors"
          >
            Ir a Iniciar Sesión
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const filteredOrders =
    statusFilter === "TODOS"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  const totalInvested = orders
    .filter((o) => o.status !== "Cancelado")
    .reduce((acc, o) => acc + o.total_amount, 0);

  const totalFrozenLots = orders.reduce((acc, o) => acc + o.items.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado Superior */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-dental-700 hover:text-dental-800 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Catálogo Dental
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Mis Pedidos y Bitácora Sanitaria de Lotes
          </h1>
          <p className="text-sm text-slate-600">
            Consultorio / Comprador: <strong>{user.full_name}</strong>{" "}
            {user.clinic_name ? `(${user.clinic_name})` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 text-dental-600 ${isLoading ? "animate-spin" : ""}`}
          />
          Actualizar Estado de Envíos
        </button>
      </div>

      {/* Tarjetas KPI de Resumen Clínico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Órdenes Registradas
          </p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {orders.length}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Compras clínicas en OdontoMarket
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Inversión Total en Insumos
          </p>
          <p className="text-2xl font-extrabold text-dental-700 mt-1">
            $
            {totalInvested.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-xs font-semibold text-slate-500">MXN</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Incluye IVA y descuentos de mayoreo
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Lotes Sanitarios Congelados
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            {totalFrozenLots}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Respaldados para auditoría COFEPRIS / FDA
          </p>
        </div>
      </div>

      {/* Filtros por Estado Logístico */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {["TODOS", "Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"].map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === st
                  ? "bg-dental-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st === "TODOS" ? `Todas (${orders.length})` : st}
            </button>
          )
        )}
      </div>

      {/* Estado de Carga / Error / Lista Vacía */}
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-dental-600" />
          <p className="text-sm font-semibold text-slate-600">
            Consultando historial de órdenes y lotes sanitarios...
          </p>
        </div>
      ) : errorMsg ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-600 shrink-0" />
          <div>
            <p className="font-bold text-sm">Error al cargar pedidos</p>
            <p className="text-xs mt-0.5">{errorMsg}</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center shadow-sm">
          <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-slate-900">
            No se encontraron órdenes en esta vista
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Cuando realices compras en el Marketplace Dental, aquí aparecerán tus
            facturas, números de guía y lotes sanitarios congelados.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition-colors"
          >
            Explorar Insumos Dentales
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const badge = getStatusBadgeStyle(order.status);
            const currentStepIdx = STATUS_STEPS.indexOf(order.status);

            return (
              <article
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Cabecera de la Orden */}
                <div className="bg-slate-50/90 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Orden de Compra
                      </span>
                      <p className="text-lg font-extrabold text-slate-900">
                        #{order.id}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Fecha de Operación
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {new Date(order.created_at).toLocaleString("es-MX", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Total Facturado
                      </span>
                      <p className="text-sm font-extrabold text-dental-700">
                        $
                        {order.total_amount.toLocaleString("es-MX", {
                          minimumFractionDigits: 2,
                        })}{" "}
                        MXN
                      </p>
                    </div>
                  </div>

                  {/* Insignia de Estado + Guía de Rastreo */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {order.tracking_number && (
                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Guía: {order.tracking_number}</span>
                      </div>
                    )}

                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.icon}
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Línea de Tiempo Logística (Flujo de Estados) */}
                {order.status !== "Cancelado" && (
                  <div className="px-6 py-4 bg-white border-b border-slate-100">
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_STEPS.map((step, idx) => {
                        const isCompleted = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={step} className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold ${
                                  isCompleted
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-400"
                                } ${
                                  isCurrent ? "ring-4 ring-emerald-100" : ""
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  isCompleted
                                    ? "text-slate-900"
                                    : "text-slate-400"
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                            <div
                              className={`h-1.5 rounded-full ${
                                isCompleted ? "bg-emerald-500" : "bg-slate-100"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cuerpo de la Orden: Renglones con Lote Sanitario Congelado */}
                <div className="p-6 space-y-5">
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          {item.product?.image_url ? (
                            <Link
                              href={`/products/${item.product_id}`}
                              className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0"
                            >
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            </Link>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                              <Package className="w-6 h-6 text-slate-400" />
                            </div>
                          )}

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {item.product?.brand && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-sky-50 text-dental-700 px-2 py-0.5 rounded">
                                  {item.product.brand}
                                </span>
                              )}
                              {item.product?.vendor && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                  <Building2 className="w-3 h-3" />
                                  {item.product.vendor.business_name}
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/products/${item.product_id}`}
                              className="text-sm font-extrabold text-slate-900 hover:text-dental-600 transition-colors block mt-0.5"
                            >
                              {item.product?.name ||
                                `Insumo Dental #${item.product_id}`}
                            </Link>

                            {/* Trazabilidad Regulatoria Congelada en el Momento de la Compra */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Lote Congelado: {item.lot_snapshot}
                              </span>

                              {item.product?.sanitary_registration && (
                                <span className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  <FileCheck2 className="w-3 h-3 text-dental-600" />
                                  COFEPRIS: {item.product.sanitary_registration}
                                </span>
                              )}

                              {item.applied_wholesale && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <Tag className="w-3 h-3 text-amber-600" />
                                  Tarifa Mayoreo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Precio Congelado y Enlace a Reseña Verificada */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">
                              {item.quantity} u. × $
                              {item.unit_price.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <p className="text-sm font-extrabold text-slate-900">
                              $
                              {item.subtotal.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              MXN
                            </p>
                          </div>

                          <Link
                            href={`/products/${item.product_id}#reviews`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-dental-700 hover:text-dental-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            Calificar Insumo
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pie de la Orden: Dirección de Entrega y Desglose Financiero */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs">
                    <div className="space-y-1">
                      <p className="font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-dental-600" />
                        Dirección Clínica de Entrega
                      </p>
                      <p className="font-bold text-slate-800">
                        {order.shipping_address}
                      </p>
                      <p className="text-slate-600">
                        {order.shipping_city}, {order.shipping_state} • C.P.{" "}
                        {order.shipping_zip}
                      </p>
                      {order.notes && (
                        <p className="text-slate-500 italic pt-1">
                          Nota: &ldquo;{order.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 md:text-right flex flex-col justify-center">
                      <div className="flex justify-between md:justify-end md:gap-6 text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-semibold text-slate-800">
                          $
                          {order.subtotal.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex justify-between md:justify-end md:gap-6 text-slate-600">
                        <span>IVA (16%):</span>
                        <span className="font-semibold text-slate-800">
                          $
                          {order.tax_amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN
                        </span>
                      </div>
                      <div className="flex justify-between md:justify-end md:gap-6 text-slate-600">
                        <span>Envío Clínico:</span>
                        <span className="font-semibold text-slate-800">
                          {order.shipping_cost === 0
                            ? "GRATIS ($0.00)"
                            : `$${order.shipping_cost.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })} MXN`}
                        </span>
                      </div>
                      <div className="flex justify-between md:justify-end md:gap-6 text-sm font-extrabold text-dental-800 pt-1 border-t border-slate-200">
                        <span>Total de la Orden:</span>
                        <span>
                          $
                          {order.total_amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          MXN
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
