/**
 * Contratos e Interfaces TypeScript de OdontoMarket (`src/types/index.ts`).
 * Actúan como un espejo estricto de los esquemas Pydantic v2 del Backend (`app/schemas/`).
 * Si el Backend espera o devuelve un campo, TypeScript lo verifica en tiempo de compilación.
 */

export type UserRole = "cliente" | "vendedor" | "admin";

export type OrderStatus =
  | "Pendiente"
  | "Pagado"
  | "Enviado"
  | "Entregado"
  | "Cancelado";

// ============================================================================
// 1. USUARIOS, PERFILES DE DEPÓSITO DENTAL Y AUTENTICACIÓN JWT
// ============================================================================

export interface VendorProfile {
  id: number;
  user_id: number;
  business_name: string;
  tax_id: string;
  sanitary_license: string;
  description?: string | null;
  logo_url?: string | null;
  city: string;
  state: string;
  address: string;
  is_verified: boolean;
  rating_avg: number;
  created_at: string;
}

export interface VendorProfileCreatePayload {
  business_name: string;
  tax_id: string;
  sanitary_license: string;
  description?: string;
  logo_url?: string;
  city: string;
  state: string;
  address: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  professional_license?: string | null;
  clinic_name?: string | null;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  vendor_profile?: VendorProfile | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  professional_license?: string;
  clinic_name?: string;
  phone?: string;
  vendor_profile?: VendorProfileCreatePayload;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================================================
// 2. CATÁLOGO ESPECIALIZADO DENTAL (CATEGORÍAS Y PRODUCTOS)
// ============================================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon_name: string;
  created_at: string;
}

export interface Product {
  id: number;
  vendor_id: number;
  category_id: number;
  name: string;
  sku: string;
  slug: string;
  description: string;
  brand: string;
  sanitary_registration: string;
  lot_number: string;
  expiration_date?: string | null;
  presentation: string;
  requires_cold_chain: boolean;
  price: number;
  wholesale_price?: number | null;
  wholesale_min_qty?: number | null;
  stock: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  vendor?: VendorProfile | null;
}

export interface ProductCreatePayload {
  category_id: number;
  name: string;
  sku: string;
  description: string;
  brand: string;
  sanitary_registration: string;
  lot_number: string;
  expiration_date?: string | null;
  presentation: string;
  requires_cold_chain: boolean;
  price: number;
  wholesale_price?: number | null;
  wholesale_min_qty?: number | null;
  stock: number;
  image_url: string;
  is_active?: boolean;
}

export interface ProductFilterParams {
  search?: string;
  category_id?: number;
  category_slug?: string;
  brand?: string;
  vendor_id?: number;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  wholesale_only?: boolean;
  sort_by?: "newest" | "price_asc" | "price_desc" | "name_asc";
}

// ============================================================================
// 3. INTERACCIONES: PREGUNTAS (Q&A) Y RESEÑAS VERIFICADAS
// ============================================================================

export interface InteractionUserSummary {
  id: number;
  full_name: string;
  clinic_name?: string | null;
}

export interface Question {
  id: number;
  product_id: number;
  user_id: number;
  question_text: string;
  answer_text?: string | null;
  is_answered: boolean;
  created_at: string;
  answered_at?: string | null;
  user?: InteractionUserSummary | null;
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  user?: InteractionUserSummary | null;
}

// ============================================================================
// 4. CARRITO, CHECKOUT Y ÓRDENES DE COMPRA
// ============================================================================

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemCreatePayload {
  product_id: number;
  quantity: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  vendor_id: number;
  quantity: number;
  unit_price: number;
  applied_wholesale: boolean;
  lot_snapshot: string;
  subtotal: number;
  product?: Product | null;
}

export interface OrderCreatePayload {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  notes?: string;
  items: OrderItemCreatePayload[];
}

export interface Order {
  id: number;
  buyer_id: number;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  tracking_number?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}
