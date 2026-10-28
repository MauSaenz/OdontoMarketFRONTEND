"use client";

/**
 * Pantalla de Autenticación y Registro con Roles (`src/app/login/page.tsx`).
 * Conecta directamente con:
 * - `useAuthStore` (`login` y `register`) -> `authService` (`POST /api/auth/login-json` y `/register`).
 * Soporta dos flujos de registro diferenciados:
 * 1. Odontólogo / Clínica Dental (`role = "cliente"`): solicita Cédula Profesional y Nombre de Clínica.
 * 2. Depósito Dental / Distribuidor (`role = "vendedor"`): solicita Razón Comercial, RFC (`tax_id`),
 *    Licencia Sanitaria COFEPRIS/FDA (`sanitary_license`) y dirección del almacén.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { extractApiErrorMessage } from "@/services/api";
import type { RegisterPayload, UserRole } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isLoading } = useAuthStore();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("cliente");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Campos de Login / Registro común
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Campos exclusivos de Odontólogo (Cliente)
  const [professionalLicense, setProfessionalLicense] = useState("");
  const [clinicName, setClinicName] = useState("");

  // Campos exclusivos de Depósito Dental (Vendedor)
  const [businessName, setBusinessName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [sanitaryLicense, setSanitaryLicense] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");
  const [city, setCity] = useState("Ciudad de México");
  const [stateName, setStateName] = useState("CDMX");
  const [address, setAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === "login") {
        const loggedUser = await login({ email, password });
        setSuccessMsg(`¡Bienvenido(a), ${loggedUser.full_name}! Redirigiendo...`);
        router.push(loggedUser.role === "vendedor" ? "/vendor" : "/");
      } else {
        const payload: RegisterPayload = {
          email,
          password,
          full_name: fullName,
          role: selectedRole,
          phone: phone || undefined,
          professional_license:
            selectedRole === "cliente" ? professionalLicense || undefined : undefined,
          clinic_name:
            selectedRole === "cliente" ? clinicName || undefined : undefined,
          vendor_profile:
            selectedRole === "vendedor"
              ? {
                  business_name: businessName,
                  tax_id: taxId,
                  sanitary_license: sanitaryLicense,
                  description: vendorDescription || undefined,
                  city,
                  state: stateName,
                  address,
                }
              : undefined,
        };

        const registeredUser = await register(payload);
        setSuccessMsg(
          `¡Cuenta creada con éxito para ${registeredUser.full_name}! Redirigiendo...`
        );
        router.push(registeredUser.role === "vendedor" ? "/vendor" : "/");
      }
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    }
  };

  /**
   * Botones de Acceso Rápido (1 Clic) con las cuentas sembradas en las Fases 2 y 3
   * para probar al instante ambos roles sin tener que escribir manualmente.
   */
  const handleQuickDemoLogin = async (
    demoEmail: string,
    demoPass: string
  ) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const loggedUser = await login({ email: demoEmail, password: demoPass });
      setSuccessMsg(`Sesión iniciada como ${loggedUser.full_name}`);
      router.push("/");
    } catch (err) {
      setErrorMsg(extractApiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Información de Valor y Accesos Demo en 1 Clic */}
        <div className="lg:col-span-5 bg-gradient-to-br from-dental-900 via-dental-800 to-slate-900 text-white rounded-3xl p-7 shadow-xl border border-dental-700">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 border border-sky-400/30 text-sky-300 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Autenticación JWT + Bcrypt</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            Ecosistema Dental Profesional
          </h1>
          <p className="text-sm text-sky-100/90 mt-2 leading-relaxed">
            Conecta tu clínica o consultorio directamente con los mejores{" "}
            <strong>Depósitos Dentales verificados</strong> del país.
          </p>

          <div className="mt-6 space-y-3 text-xs text-sky-100">
            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
              <Stethoscope className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Cuenta Odontólogo / Clínica</p>
                <p className="text-sky-200/80 mt-0.5">
                  Compra con precios de mayoreo automáticos, haz preguntas técnicas sobre lotes/caducidades y califica insumos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-white/10">
              <Building2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Cuenta Depósito Dental (Vendedor)</p>
                <p className="text-sky-200/80 mt-0.5">
                  Publica tu catálogo con registro COFEPRIS/FDA, gestiona stock, responde dudas de odontólogos y despacha pedidos.
                </p>
              </div>
            </div>
          </div>

          {/* Tarjeta de Acceso Rápido para Pruebas */}
          <div className="mt-7 pt-6 border-t border-white/15">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Acceso Rápido Demo (1 Clic)</span>
            </div>
            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "dra.valeria@clinicasmile.com",
                    "OdontoSegura2026!"
                  )
                }
                className="w-full text-left bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 rounded-xl p-3 transition-colors"
              >
                <p className="text-xs font-bold text-white">
                  👩‍⚕️ Entrar como Odontóloga (Cliente)
                </p>
                <p className="text-[11px] text-sky-200">
                  Dra. Valeria Morales • Clínica Smile Center
                </p>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  handleQuickDemoLogin(
                    "ventas@depositovillacortes.com",
                    "DepositoDental2026!"
                  )
                }
                className="w-full text-left bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-xl p-3 transition-colors"
              >
                <p className="text-xs font-bold text-white">
                  🏢 Entrar como Depósito Dental (Vendedor)
                </p>
                <p className="text-[11px] text-amber-200">
                  Depósito Dental Villa de Cortés S.A. • COFEPRIS Verificado
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Login / Registro */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-7 shadow-md border border-slate-200">
          {/* Pestañas Iniciar Sesión vs Crear Cuenta */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-dental-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setErrorMsg(null);
              }}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-dental-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Crear Cuenta Nueva
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Selector de Rol en Modo Registro */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  ¿Qué tipo de cuenta deseas registrar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("cliente")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedRole === "cliente"
                        ? "border-dental-600 bg-dental-50 text-dental-900 ring-2 ring-dental-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Stethoscope className="w-5 h-5 text-dental-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Odontólogo / Clínica</p>
                      <p className="text-[10px] text-slate-500">Comprador de insumos</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("vendedor")}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      selectedRole === "vendedor"
                        ? "border-amber-500 bg-amber-50/70 text-slate-900 ring-2 ring-amber-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Depósito Dental</p>
                      <p className="text-[10px] text-slate-500">Vendedor / Distribuidor</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo del Titular *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Dr. Carlos Méndez"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
              </div>
            )}

            {/* Credenciales Email y Contraseña */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@clinica.com"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-dental-500"
                  />
                </div>
              </div>
            </div>

            {/* Campos adicionales según el Rol elegido en Registro */}
            {mode === "register" && selectedRole === "cliente" && (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-3">
                <p className="text-xs font-bold text-dental-800">
                  Datos Profesionales del Consultorio (Opcional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cédula Profesional Odontológica
                    </label>
                    <input
                      type="text"
                      value={professionalLicense}
                      onChange={(e) => setProfessionalLicense(e.target.value)}
                      placeholder="Ej. CED-ODON-8492011"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre de la Clínica / Consultorio
                    </label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Ej. Clínica Dental Sonrisa"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "register" && selectedRole === "vendedor" && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <p className="text-xs font-bold text-amber-900">
                  Datos Fiscales y Sanitarios del Depósito Dental *
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Razón Comercial del Depósito Dental *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Ej. Depósito Dental del Valle S.A."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      RFC / Identificación Fiscal *
                    </label>
                    <input
                      type="text"
                      required
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="Ej. DDV2401158A1"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Licencia Sanitaria COFEPRIS / FDA *
                    </label>
                    <input
                      type="text"
                      required
                      value={sanitaryLicense}
                      onChange={(e) => setSanitaryLicense(e.target.value)}
                      placeholder="Ej. COFEPRIS-AV-2026-09841"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Estado *
                    </label>
                    <input
                      type="text"
                      required
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Dirección del Almacén de Despacho *
                    </label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Calle, número, colonia y código postal"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Descripción y Marcas Distribuidas
                    </label>
                    <input
                      type="text"
                      value={vendorDescription}
                      onChange={(e) => setVendorDescription(e.target.value)}
                      placeholder="Ej. Distribuidor autorizado 3M ESPE, NSK, Dentsply Sirona"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-dental-600 hover:bg-dental-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-2xl text-sm shadow-md transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {isLoading
                  ? "Procesando con FastAPI..."
                  : mode === "login"
                  ? "Iniciar Sesión en OdontoMarket"
                  : selectedRole === "vendedor"
                  ? "Registrar Depósito Dental"
                  : "Registrar Cuenta de Odontólogo"}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
