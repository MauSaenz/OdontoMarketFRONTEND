"use client";

/**
 * Panel de Control del Depósito Dental — Centro de Vendedores (`src/app/vendor/page.tsx`).
 * Exclusivo para usuarios con rol `vendedor` (Depósito Dental) o `admin`.
 *
 * Se conecta con 6 endpoints del Backend en FastAPI:
 * 1. `GET /api/categories` -> Lista las especialidades odontológicas para el formulario.
 * 2. `GET /api/products/my-inventory` -> Carga el catálogo propio del Depósito Dental.
 * 3. `POST /api/products` -> Publica un nuevo insumo o equipo con registro COFEPRIS y lote.
 * 4. `PUT /api/products/{id}` / `DELETE /api/products/{id}` -> Actualiza stock, lote o pausa publicación.
 * 5. `GET /api/orders/vendor-sales` -> Lista cada renglón vendido por este Depósito Dental.
 * 6. `PATCH /api/orders/{id}/status` -> Actualiza el estado (`Pagado` -> `Enviado` -> `Entregado`) y guía.
 */

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileCheck2,
  Loader2,
  Lock,
  PackagePlus,
  PauseCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Tag,
  TrendingUp,
  Truck,
} from "lucide-react";
import {
  catalogService,
  extractApiErrorMessage,
  orderService,
} from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";
import type {
  Category,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductCreatePayload,
} from "@/types";

type VendorTab = "inventory" | "publish" | "sales";

export default function VendorDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<VendorTab>("inventory");

  // Datos cargados desde FastAPI
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [sales, setSales] = useState<OrderItem[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<number, Order>>({});

  // Estados de carga y notificaciones
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Estado para edición rápida de stock / estado en el inventario
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);

  // Estado para despacho logístico de órdenes (`PATCH /api/orders/{id}/status`)
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<number, OrderStatus>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // ============================================================================
  // ESTADO DEL FORMULARIO DE NUEVA PUBLICACIÓN DENTAL (`POST /api/products`)
  // ============================================================================
  const [categoryId, setCategoryId] = useState<number>(1);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [sanitaryRegistration, setSanitaryRegistration] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("2028-06-30");
  const [presentation, setPresentation] = useState("");
  const [requiresColdChain, setRequiresColdChain] = useState(false);
  const [price, setPrice] = useState("");
  const [enableWholesale, setEnableWholesale] = useState(true);
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [wholesaleMinQty, setWholesaleMinQty] = useState("5");
  const [stock, setStock] = useState("30");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=900&q=80"
  );
  const [description, setDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const loadVendorDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [catsData, invData, salesData] = await Promise.all([
        catalogService.getCategories(),
        catalogService.getMyVendorInventory(),
        orderService.getVendorSales(),
      ]);

      setCategories(catsData);
      if (catsData.length > 0) {
        setCategoryId(catsData[0].id);
      }
      setInventory(invData);
      setSales(salesData);

      // Obtenemos los detalles logísticos de cada orden única involucrada en las ventas
      const uniqueOrderIds = Array.from(
        new Set(salesData.map((s) => s.order_id))
      );
      const fetchedOrders: Record<number, Order> = {};
      const initialTracking: Record<number, string> = {};
      const initialStatuses: Record<number, OrderStatus> = {};

      await Promise.all(
        uniqueOrderIds.map(async (orderId) => {
          try {
            const ord = await orderService.getOrderById(orderId);
            fetchedOrders[orderId] = ord;
            initialTracking[orderId] = ord.tracking_number || "";
            initialStatuses[orderId] = ord.status;
          } catch {
            // Si alguna orden no se pudiera cargar individualmente, continuamos sin bloquear
          }
        })
      );

      setOrdersMap(fetchedOrders);
      setTrackingInputs(initialTracking);
      setStatusInputs(initialStatuses);
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
    if (
      mounted &&
      isAuthenticated &&
      user &&
      (user.role === "vendedor" || user.role === "admin")
    ) {
      loadVendorDashboard();
    } else if (mounted) {
      setIsLoading(false);
    }
  }, [mounted, isAuthenticated, user, loadVendorDashboard]);

  if (!mounted) {
    return null;
  }

  // ============================================================================
  // GUARDIA DE SEGURIDAD POR ROL (`vendedor` o `admin`)
  // ============================================================================
  if (!isAuthenticated || !user || (user.role !== "vendedor" && user.role !== "admin")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl border border-amber-200 p-10 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Acceso Exclusivo para Depósitos Dentales Verificados
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto mt-2">
            Esta sección está reservada para cuentas con rol{" "}
            <strong className="text-slate-900">Vendedor (Depósito Dental)</strong>.
            Puedes ingresar con la cuenta demostrativa{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs">
              ventas@depositovillacortes.com
            </code>{" "}
            desde la pantalla de Login en un solo clic.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-6 py-3 rounded-xl text-sm shadow transition-colors"
            >
              Cambiar a Cuenta de Depósito Dental
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Volver al Catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CÁLCULO DE MÉTRICAS KPI DEL DEPÓSITO DENTAL
  // ============================================================================
  const activeProductsCount = inventory.filter((p) => p.is_active).length;
  const totalUnitsInStock = inventory.reduce((acc, p) => acc + p.stock, 0);
  const totalUnitsSold = sales.reduce((acc, s) => acc + s.quantity, 0);
  const totalGrossRevenue = sales.reduce((acc, s) => acc + s.subtotal, 0);

  // ============================================================================
  // ACCIÓN 1: AUTOCOMPLETAR PLANTILLA DEMO DE INSUMO DENTAL
  // ============================================================================
  const handleFillDemoProduct = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setName(
      `Adhesivo Universal 3M Single Bond Universal Plus (${randomSuffix})`
    );
    setSku(`3M-SBU-PLUS-${randomSuffix}`);
    setBrand("3M ESPE");
    setSanitaryRegistration(`1892C2026 SSA`);
    setLotNumber(`LOT-2026-SBU${randomSuffix}`);
    setExpirationDate("2028-11-30");
    setPresentation("Frasco gotero de 5ml (200 aplicaciones)");
    setRequiresColdChain(false);
    setPrice("1650");
    setEnableWholesale(true);
    setWholesalePrice("1420");
    setWholesaleMinQty("3");
    setStock("40");
    setImageUrl(
      "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=900&q=80"
    );
    setDescription(
      "Adhesivo dental monocomponente radiopaco de última generación para técnicas de grabado total, grabado selectivo en esmalte y autograbado. Libre de derivados de BPA, con adhesión química a zirconia, cerámica vítrea y aleaciones metálicas sin necesidad de silano adicional."
    );
  };

  // ============================================================================
  // ACCIÓN 2: PUBLICAR NUEVO PRODUCTO (`POST /api/products`)
  // ============================================================================
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessBanner(null);

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedWholesalePrice = enableWholesale
      ? parseFloat(wholesalePrice)
      : null;
    const parsedWholesaleMin = enableWholesale
      ? parseInt(wholesaleMinQty, 10)
      : null;

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg("El precio unitario debe ser un número mayor a $0.00 MXN.");
      return;
    }

    if (
      enableWholesale &&
      parsedWholesalePrice !== null &&
      (isNaN(parsedWholesalePrice) || parsedWholesalePrice >= parsedPrice)
    ) {
      setErrorMsg(
        "El precio de mayoreo debe ser estrictamente menor al precio unitario normal."
      );
      return;
    }

    setIsPublishing(true);
    try {
      const payload: ProductCreatePayload = {
        category_id: categoryId,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        brand: brand.trim(),
        sanitary_registration: sanitaryRegistration.trim(),
        lot_number: lotNumber.trim().toUpperCase(),
        expiration_date: expirationDate ? expirationDate : null,
        presentation: presentation.trim(),
        requires_cold_chain: requiresColdChain,
        price: parsedPrice,
        wholesale_price: enableWholesale ? parsedWholesalePrice : null,
        wholesale_min_qty: enableWholesale ? parsedWholesaleMin : null,
        stock: isNaN(parsedStock) ? 0 : parsedStock,
        image_url: imageUrl.trim(),
        description: description.trim(),
        is_active: true,
      };

      const created = await catalogService.createProduct(payload);
      setInventory((prev) => [created, ...prev]);
      setSuccessBanner(
        `¡Insumo "${created.name}" (SKU: ${created.sku}) publicado exitosamente en el catálogo!`
      );
      setActiveTab("inventory");

      // Limpiar campos principales
      setName("");
      setSku("");
      setLotNumber("");
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setIsPublishing(false);
    }
  };

  // ============================================================================
  // ACCIÓN 3: AJUSTE RÁPIDO DE STOCK O PAUSA DE PUBLICACIÓN (`PUT /api/products/{id}`)
  // ============================================================================
  const handleQuickAdjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, product.stock + delta);
    setUpdatingProductId(product.id);
    setErrorMsg(null);
    try {
      const updated = await catalogService.updateProduct(product.id, {
        stock: nextStock,
      });
      setInventory((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item))
      );
      setSuccessBanner(
        `Stock de "${updated.name}" actualizado a ${updated.stock} unidades.`
      );
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleToggleProductActive = async (product: Product) => {
    setUpdatingProductId(product.id);
    setErrorMsg(null);
    try {
      if (product.is_active) {
        await catalogService.deactivateProduct(product.id);
        setInventory((prev) =>
          prev.map((item) =>
            item.id === product.id ? { ...item, is_active: false } : item
          )
        );
        setSuccessBanner(`Publicación "${product.name}" pausada del buscador.`);
      } else {
        const reactivated = await catalogService.updateProduct(product.id, {
          is_active: true,
        });
        setInventory((prev) =>
          prev.map((item) => (item.id === product.id ? reactivated : item))
        );
        setSuccessBanner(
          `Publicación "${product.name}" reactivada en el Marketplace.`
        );
      }
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setUpdatingProductId(null);
    }
  };

  // ============================================================================
  // ACCIÓN 4: DESPACHO Y ACTUALIZACIÓN DE ORDEN (`PATCH /api/orders/{id}/status`)
  // ============================================================================
  const handleUpdateOrderLogistics = async (orderId: number) => {
    const newStatus = statusInputs[orderId] || "Enviado";
    const tracking = trackingInputs[orderId]?.trim() || undefined;

    setUpdatingOrderId(orderId);
    setErrorMsg(null);
    setSuccessBanner(null);
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        newStatus,
        tracking
      );
      setOrdersMap((prev) => ({
        ...prev,
        [orderId]: updatedOrder,
      }));
      setSuccessBanner(
        `Orden #${orderId} actualizada a estado "${updatedOrder.status}"${
          updatedOrder.tracking_number
            ? ` con guía ${updatedOrder.tracking_number}`
            : ""
        }.`
      );
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Encabezado del Depósito Dental */}
      <div className="bg-gradient-to-r from-dental-900 via-dental-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a la tienda pública
            </Link>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-widest text-amber-300 font-extrabold block">
                  Centro de Operaciones • Depósito Dental Oficial
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold">
                  {user.vendor_profile?.business_name || user.full_name}
                </h1>
              </div>
            </div>

            {user.vendor_profile && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-sky-100 pt-1">
                <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Licencia COFEPRIS: {user.vendor_profile.sanitary_license}
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg font-mono">
                  RFC: {user.vendor_profile.tax_id}
                </span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                  {user.vendor_profile.city}, {user.vendor_profile.state}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadVendorDashboard}
              disabled={isLoading}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Sincronizar Datos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("publish")}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-colors"
            >
              <PackagePlus className="w-4 h-4" />
              Publicar Nuevo Insumo
            </button>
          </div>
        </div>

        {/* 4 Tarjetas KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-sky-200 text-xs font-bold">
              <span>Publicaciones Activas</span>
              <Boxes className="w-4 h-4 text-sky-300" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-1">
              {activeProductsCount}{" "}
              <span className="text-xs font-normal text-sky-200">
                / {inventory.length} totales
              </span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-sky-200 text-xs font-bold">
              <span>Stock Físico en Almacén</span>
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-1">
              {totalUnitsInStock.toLocaleString("es-MX")}{" "}
              <span className="text-xs font-normal text-sky-200">unidades</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-sky-200 text-xs font-bold">
              <span>Insumos Despachados</span>
              <TrendingUp className="w-4 h-4 text-amber-300" />
            </div>
            <p className="text-2xl font-extrabold text-white mt-1">
              {totalUnitsSold}{" "}
              <span className="text-xs font-normal text-sky-200">
                en {sales.length} líneas
              </span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-sky-200 text-xs font-bold">
              <span>Ventas Brutas Acumuladas</span>
              <DollarSign className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-300 mt-1">
              $
              {totalGrossRevenue.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Banners de Notificación */}
      {errorMsg && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {successBanner && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas de Navegación del Panel */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === "inventory"
              ? "bg-dental-600 text-white shadow"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Boxes className="w-4 h-4" />
          Mi Inventario Dental ({inventory.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("publish")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === "publish"
              ? "bg-dental-600 text-white shadow"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <PackagePlus className="w-4 h-4" />
          Publicar Nuevo Insumo / Equipo
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sales")}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            activeTab === "sales"
              ? "bg-dental-600 text-white shadow"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-4 h-4" />
          Ventas y Despachos ({sales.length})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-dental-600" />
          <p className="text-sm font-semibold text-slate-600">
            Cargando inventario y operaciones del Depósito Dental...
          </p>
        </div>
      ) : (
        <>
          {/* ==========================================================================
              PESTAÑA 1: MI INVENTARIO DENTAL Y CONTROL DE STOCK
             ========================================================================== */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {inventory.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <Boxes className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Aún no tienes insumos publicados
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Publica tu primer insumo o equipo odontológico con registro
                    COFEPRIS para empezar a recibir pedidos de clínicas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("publish")}
                    className="mt-5 inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow"
                  >
                    <PackagePlus className="w-4 h-4" />
                    Publicar Primer Producto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {inventory.map((prod) => (
                    <div
                      key={prod.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                        prod.is_active
                          ? "border-slate-200"
                          : "border-rose-200 bg-rose-50/20 opacity-80"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Link
                            href={`/products/${prod.id}`}
                            className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0"
                          >
                            <img
                              src={prod.image_url}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                  prod.is_active
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {prod.is_active ? "Activo en Catálogo" : "Pausado"}
                              </span>
                              <span className="text-[11px] font-extrabold text-dental-700 bg-sky-50 px-2 py-0.5 rounded">
                                {prod.brand}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                SKU: {prod.sku}
                              </span>
                              {prod.requires_cold_chain && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-cyan-50 text-cyan-800 px-2 py-0.5 rounded border border-cyan-200">
                                  <Snowflake className="w-3 h-3" />
                                  Red Fría
                                </span>
                              )}
                            </div>

                            <Link
                              href={`/products/${prod.id}`}
                              className="text-base font-extrabold text-slate-900 hover:text-dental-600 transition-colors block"
                            >
                              {prod.name}
                            </Link>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                                COFEPRIS: <strong>{prod.sanitary_registration}</strong>
                              </span>
                              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">
                                Lote: {prod.lot_number}
                              </span>
                              {prod.expiration_date && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  Caducidad: {prod.expiration_date}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Precios y Controles Rápidos de Inventario */}
                        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          <div className="text-left lg:text-right">
                            <p className="text-sm font-extrabold text-slate-900">
                              Menudeo: $
                              {prod.price.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            {prod.wholesale_price && prod.wholesale_min_qty && (
                              <p className="text-xs font-bold text-emerald-700 flex items-center lg:justify-end gap-1">
                                <Tag className="w-3 h-3" />
                                Mayoreo: $
                                {prod.wholesale_price.toLocaleString("es-MX", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                (mín. {prod.wholesale_min_qty} u.)
                              </p>
                            )}
                          </div>

                          {/* Control de Stock Rápido */}
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                            <div className="px-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Stock Actual
                              </span>
                              <span
                                className={`text-sm font-extrabold ${
                                  prod.stock <= 5
                                    ? "text-rose-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {prod.stock} u.
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={updatingProductId === prod.id}
                              onClick={() => handleQuickAdjustStock(prod, 10)}
                              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              title="Sumar 10 unidades al lote actual"
                            >
                              <Plus className="w-3 h-3" />
                              10 u.
                            </button>
                          </div>

                          {/* Botón Pausar / Reactivar */}
                          <button
                            type="button"
                            disabled={updatingProductId === prod.id}
                            onClick={() => handleToggleProductActive(prod)}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                              prod.is_active
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {prod.is_active ? (
                              <>
                                <PauseCircle className="w-4 h-4" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-4 h-4" />
                                Reactivar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==========================================================================
              PESTAÑA 2: FORMULARIO PARA PUBLICAR NUEVO INSUMO O EQUIPO DENTAL
             ========================================================================== */}
          {activeTab === "publish" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Publicar Nuevo Insumo o Equipo Odontológico
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Completa las especificaciones clínicas, registro COFEPRIS / FDA y
                    esquema de precios de mayoreo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFillDemoProduct}
                  className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Autocompletar Insumo Demo (1 Clic)
                </button>
              </div>

              <form onSubmit={handlePublishSubmit} className="space-y-6">
                {/* Bloque 1: Identificación Comercial y Categoría */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nombre Comercial y Clínico del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={4}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Resina Nanohíbrida 3M Filtek Z350 XT Jeringa 4g Tono A2"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoría Clínica Especializada *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-dental-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bloque 2: Atributos Regulatorios y Trazabilidad Dental */}
                <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-dental-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-dental-600" />
                    Especificaciones Técnicas y Regulatorias (COFEPRIS / FDA)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Marca Fabricante *
                      </label>
                      <input
                        type="text"
                        required
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Ej. 3M ESPE, NSK, Septodont"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Código SKU Único *
                      </label>
                      <input
                        type="text"
                        required
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        placeholder="Ej. 3M-SBU-7012"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Registro Sanitario COFEPRIS/FDA *
                      </label>
                      <input
                        type="text"
                        required
                        value={sanitaryRegistration}
                        onChange={(e) => setSanitaryRegistration(e.target.value)}
                        placeholder="Ej. 1428C2025 SSA"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Número de Lote Actual *
                      </label>
                      <input
                        type="text"
                        required
                        value={lotNumber}
                        onChange={(e) => setLotNumber(e.target.value)}
                        placeholder="Ej. LOT-2026-A89"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Presentación / Empaque *
                      </label>
                      <input
                        type="text"
                        required
                        value={presentation}
                        onChange={(e) => setPresentation(e.target.value)}
                        placeholder="Ej. Caja con 50 cartuchos de 1.8ml"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fecha de Caducidad del Lote
                      </label>
                      <input
                        type="date"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="pt-4">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl w-full">
                        <input
                          type="checkbox"
                          checked={requiresColdChain}
                          onChange={(e) => setRequiresColdChain(e.target.checked)}
                          className="w-4 h-4 rounded text-dental-600 focus:ring-dental-500"
                        />
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Snowflake className="w-4 h-4 text-cyan-600" />
                          Requiere Cadena de Frío (2°C - 8°C)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bloque 3: Esquema de Precios Menudeo / Mayoreo e Inventario */}
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      Precios Clínicos, Mayoreo por Volumen y Stock
                    </h3>

                    <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableWholesale}
                        onChange={(e) => setEnableWholesale(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600"
                      />
                      Ofrecer Descuento Automático por Mayoreo
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Precio Unitario Menudeo (MXN) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="Ej. 1290.00"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Precio Unitario Mayoreo (MXN)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        disabled={!enableWholesale}
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        placeholder="Ej. 1090.00"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Cantidad Mínima Mayoreo (u.)
                      </label>
                      <input
                        type="number"
                        min="2"
                        disabled={!enableWholesale}
                        value={wholesaleMinQty}
                        onChange={(e) => setWholesaleMinQty(e.target.value)}
                        placeholder="Ej. 5"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Stock Físico Disponible *
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="Ej. 35"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 4: Imagen y Descripción Técnica */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      URL de Fotografía del Producto *
                    </label>
                    <input
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ficha Técnica e Indicaciones Clínicas *
                    </label>
                    <textarea
                      rows={4}
                      required
                      minLength={15}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe las indicaciones odontológicas, protocolo de uso, radiopacidad, compatibilidad y garantía..."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="inline-flex items-center gap-2 bg-dental-600 hover:bg-dental-700 disabled:opacity-60 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg text-sm transition-all"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publicando en Catálogo...
                      </>
                    ) : (
                      <>
                        <PackagePlus className="w-5 h-5" />
                        Publicar Producto en OdontoMarket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==========================================================================
              PESTAÑA 3: VENTAS DEL DEPÓSITO Y GESTIÓN DE DESPACHOS LOGÍSTICOS
             ========================================================================== */}
          {activeTab === "sales" && (
            <div className="space-y-4">
              {sales.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Aún no se registran ventas para este Depósito Dental
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Cuando un odontólogo compre tus productos en el Checkout, aquí
                    aparecerán los lotes comprometidos y podrás asignar la guía de
                    envío.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.map((saleItem) => {
                    const parentOrder = ordersMap[saleItem.order_id];
                    const currentStatus =
                      statusInputs[saleItem.order_id] ||
                      parentOrder?.status ||
                      "Pagado";
                    const currentTracking =
                      trackingInputs[saleItem.order_id] ??
                      parentOrder?.tracking_number ??
                      "";

                    return (
                      <div
                        key={saleItem.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-dental-900 text-white text-xs font-extrabold px-3 py-1 rounded-lg">
                              Orden #{saleItem.order_id}
                            </span>
                            <span className="text-xs font-mono bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                              Lote Despachado: {saleItem.lot_snapshot}
                            </span>
                            {saleItem.applied_wholesale && (
                              <span className="text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
                                Venta de Mayoreo
                              </span>
                            )}
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-500 mr-2">
                              {saleItem.quantity} u. × $
                              {saleItem.unit_price.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-base font-extrabold text-emerald-700">
                              $
                              {saleItem.subtotal.toLocaleString("es-MX", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              MXN
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                          {/* Producto vendido y destino */}
                          <div className="lg:col-span-6 space-y-1">
                            <p className="text-sm font-extrabold text-slate-900">
                              {saleItem.product?.name ||
                                `Producto #${saleItem.product_id}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              SKU: {saleItem.product?.sku || "N/A"} • Presentación:{" "}
                              {saleItem.product?.presentation || "Estándar"}
                            </p>
                            {parentOrder && (
                              <p className="text-xs text-slate-600 pt-1">
                                <strong>Destino Clínico:</strong>{" "}
                                {parentOrder.shipping_address},{" "}
                                {parentOrder.shipping_city},{" "}
                                {parentOrder.shipping_state} (C.P.{" "}
                                {parentOrder.shipping_zip})
                              </p>
                            )}
                          </div>

                          {/* Controles Logísticos de Estado y Guía (`PATCH /api/orders/{id}/status`) */}
                          <div className="lg:col-span-6 flex flex-wrap sm:flex-nowrap items-end gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div className="w-full sm:w-40">
                              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                                Estado de Orden
                              </label>
                              <select
                                value={currentStatus}
                                onChange={(e) =>
                                  setStatusInputs((prev) => ({
                                    ...prev,
                                    [saleItem.order_id]: e.target
                                      .value as OrderStatus,
                                  }))
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Pagado">Pagado</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </div>

                            <div className="flex-1 w-full">
                              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                                Guía de Rastreo (DHL / FedEx / Estafeta)
                              </label>
                              <input
                                type="text"
                                value={currentTracking}
                                onChange={(e) =>
                                  setTrackingInputs((prev) => ({
                                    ...prev,
                                    [saleItem.order_id]: e.target.value,
                                  }))
                                }
                                placeholder="Ej. DHL-ODONTO-884920"
                                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono"
                              />
                            </div>

                            <button
                              type="button"
                              disabled={updatingOrderId === saleItem.order_id}
                              onClick={() =>
                                handleUpdateOrderLogistics(saleItem.order_id)
                              }
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-dental-600 hover:bg-dental-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow transition-colors shrink-0 disabled:opacity-50"
                            >
                              {updatingOrderId === saleItem.order_id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                              Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
