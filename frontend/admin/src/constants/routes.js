/**
 * Application Routes Constants
 * Centralized route definitions for better maintainability
 */

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
}

export const PUBLIC_ROUTES = [ROUTES.LOGIN]

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PRODUCTS,
  ROUTES.ORDERS,
]

