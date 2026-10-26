/**
 * Application Constants
 * Centralized constants for better maintainability
 */

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
}

/**
 * User Roles
 */
export const USER_ROLE = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
}

/**
 * Order Status
 */
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
}

/**
 * Payment Methods
 */
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  COD: 'COD',
}

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 1000,
}

/**
 * File Upload Limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
}

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL_MIN_LENGTH: 5,
  EMAIL_MAX_LENGTH: 255,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 100,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 13,
  PRODUCT_NAME_MIN_LENGTH: 2,
  PRODUCT_NAME_MAX_LENGTH: 200,
  ADDRESS_MIN_LENGTH: 10,
  ADDRESS_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 2000,
  PRICE_MIN: 0,
  PRICE_MAX: 999999999.99,
  STOCK_MIN: 0,
  STOCK_MAX: 999999,
}

/**
 * Prisma Error Codes
 */
export const PRISMA_ERROR = {
  UNIQUE_CONSTRAINT: 'P2002',
  RECORD_NOT_FOUND: 'P2025',
}

/**
 * JWT Configuration
 */
export const JWT = {
  DEFAULT_EXPIRES_IN: '7d',
}

/**
 * Supabase Configuration
 */
export const SUPABASE = {
  SIGNED_URL_EXPIRY: 31536000, // 1 year in seconds
  DEFAULT_BUCKET: 'product-images',
}

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  NO_TOKEN: 'No authentication token provided',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  UNAUTHORIZED: 'Unauthorized access',
  ADMIN_REQUIRED: 'Admin access required',
  
  // Validation
  INVALID_EMAIL: 'Valid email is required',
  INVALID_PASS: 'Password must be at least 6 characters',
  INVALID_NAME: 'Name must be at least 2 characters',
  INVALID_PHONE: 'Valid phone number is required',
  
  // Products
  PRODUCT_NOT_FOUND: 'Product not found',
  PRODUCT_NAME_REQUIRED: 'Product name is required',
  PRODUCT_PRICE_REQUIRED: 'Valid price is required',
  PRODUCT_CATEGORY_REQUIRED: 'Category is required',
  PRODUCT_SLUG_EXISTS: 'Product with this slug already exists',
  
  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_UNAUTHORIZED: 'You can only view your own orders',
  CART_EMPTY: 'Cart is empty',
  INSUFFICIENT_STOCK: 'Insufficient stock for one or more products',
  
  // Cart
  CART_ITEM_NOT_FOUND: 'Cart item not found',
  CART_ITEM_UNAUTHORIZED: 'You can only modify your own cart',
  
  // File Upload
  NO_FILE: 'No file uploaded',
  INVALID_FILE_TYPE: 'Invalid file type. Only images are allowed',
  FILE_TOO_LARGE: 'File size exceeds maximum limit of 5MB',
  UPLOAD_FAILED: 'Failed to upload file',
  
  // General
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  DUPLICATE_ENTRY: 'This record already exists',
}

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  CART_ITEM_ADDED: 'Item added to cart',
  CART_ITEM_UPDATED: 'Cart item updated',
  CART_ITEM_REMOVED: 'Item removed from cart',
  CART_CLEARED: 'Cart cleared',
}

