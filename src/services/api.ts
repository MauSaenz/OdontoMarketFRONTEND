/**
 * Capa Centralizada de Conexión HTTP (`src/services/api.ts`).
 * Conecta el Frontend en Next.js (puerto 3000) con el Backend en FastAPI (puerto 8000).
 * Incluye:
 * 1. Instancia de Axios preconfigurada con `baseURL`.
 * 2. Interceptor de Petición (Request Interceptor) que inyecta automáticamente
 *    el encabezado `Authorization: Bearer <TOKEN_JWT>` en cada llamada.
 * 3. Funciones de servicio tipadas por dominio (`authService`, `catalogService`,
 *    `interactionService` y `orderService`).
 */

import axios, { AxiosError } from "axios";
import type {
  Category,
  LoginPayload,
  Order,
  OrderCreatePayload,
  OrderItem,
  OrderStatus,
  Product,
  ProductCreatePayload,
  ProductFilterParams,
  Question,
  RegisterPayload,
  Review,
  TokenResponse,
  User,
} from "@/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export const TOKEN_STORAGE_KEY = "odontomarket_jwt_token";

// 1. Instancia única de Axios para toda la aplicación
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// 2. Interceptor de Petición:
// Se ejecuta automáticamente milisegundos ANTES de que cualquier petición HTTP salga del navegador.
// Si existe un token JWT guardado en `localStorage`, lo adjunta en `Authorization: Bearer <token>`.
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Función utilitaria que extrae el mensaje de error legible enviado por `HTTPException(detail=...)`
 * desde FastAPI o errores de validación Pydantic v2 (`422 Unprocessable Entity`).
 */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ detail?: string | Array<{ msg: string }> }>;
    const detail = axiosErr.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d) => d.msg).join(". ");
    }
    if (axiosErr.message) {
      return axiosErr.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Ocurrió un error inesperado al comunicarse con el servidor OdontoMarket.";
}

// ============================================================================
// SERVICIO 1: AUTENTICACIÓN Y SESIÓN JWT (`/api/auth`)
// ============================================================================

export const authService = {
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/login-json", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await apiClient.post<TokenResponse>("/auth/register", payload);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>("/auth/me");
    return data;
  },
};

// ============================================================================
// SERVICIO 2: CATÁLOGO DENTAL Y PRODUCTOS (`/api/categories` y `/api/products`)
// ============================================================================

export const catalogService = {
  async getCategories(): Promise<Category[]> {
    const { data } = await apiClient.get<Category[]>("/categories");
    return data;
  },

  async getBrands(): Promise<string[]> {
    const { data } = await apiClient.get<string[]>("/products/brands");
    return data;
  },

  async getProducts(filters?: ProductFilterParams): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/products", {
      params: filters,
    });
    return data;
  },

  async getProductById(productId: number): Promise<Product> {
    const { data } = await apiClient.get<Product>(`/products/${productId}`);
    return data;
  },

  async getMyVendorInventory(): Promise<Product[]> {
    const { data } = await apiClient.get<Product[]>("/products/my-inventory");
    return data;
  },

  async createProduct(payload: ProductCreatePayload): Promise<Product> {
    const { data } = await apiClient.post<Product>("/products", payload);
    return data;
  },

  async updateProduct(
    productId: number,
    payload: Partial<ProductCreatePayload>
  ): Promise<Product> {
    const { data } = await apiClient.put<Product>(`/products/${productId}`, payload);
    return data;
  },

  async deactivateProduct(productId: number): Promise<{ message: string }> {
    const { data } = await apiClient.delete<{ message: string }>(`/products/${productId}`);
    return data;
  },
};

// ============================================================================
// SERVICIO 3: PREGUNTAS (Q&A) Y RESEÑAS (`/api/products/{id}/questions` y `/reviews`)
// ============================================================================

export const interactionService = {
  async getProductQuestions(productId: number): Promise<Question[]> {
    const { data } = await apiClient.get<Question[]>(`/products/${productId}/questions`);
    return data;
  },

  async askQuestion(productId: number, questionText: string): Promise<Question> {
    const { data } = await apiClient.post<Question>(`/products/${productId}/questions`, {
      question_text: questionText,
    });
    return data;
  },

  async answerQuestion(questionId: number, answerText: string): Promise<Question> {
    const { data } = await apiClient.put<Question>(`/questions/${questionId}/answer`, {
      answer_text: answerText,
    });
    return data;
  },

  async getProductReviews(productId: number): Promise<Review[]> {
    const { data } = await apiClient.get<Review[]>(`/products/${productId}/reviews`);
    return data;
  },

  async createReview(
    productId: number,
    payload: { rating: number; title: string; comment: string }
  ): Promise<Review> {
    const { data } = await apiClient.post<Review>(
      `/products/${productId}/reviews`,
      payload
    );
    return data;
  },
};

// ============================================================================
// SERVICIO 4: ÓRDENES DE COMPRA Y CHECKOUT (`/api/orders`)
// ============================================================================

export const orderService = {
  async createOrder(payload: OrderCreatePayload): Promise<Order> {
    const { data } = await apiClient.post<Order>("/orders", payload);
    return data;
  },

  async getMyOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<Order[]>("/orders/my-orders");
    return data;
  },

  async getOrderById(orderId: number): Promise<Order> {
    const { data } = await apiClient.get<Order>(`/orders/${orderId}`);
    return data;
  },

  async getVendorSales(): Promise<OrderItem[]> {
    const { data } = await apiClient.get<OrderItem[]>("/orders/vendor-sales");
    return data;
  },

  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    trackingNumber?: string
  ): Promise<Order> {
    const { data } = await apiClient.patch<Order>(`/orders/${orderId}/status`, {
      status,
      tracking_number: trackingNumber,
    });
    return data;
  },
};
