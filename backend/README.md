# Backend API Engine — Toko Usaha Anda (Production Ready)

The robust, production-grade RESTful API server for the **Toko Usaha Anda** e-commerce platform. Built on **Node.js**, **Express.js**, **PostgreSQL**, and **Prisma ORM**.

Engineered from the ground up for high security, server-authoritative financial consistency, automated database indexing, cluster resilience, and real-time shipping/payment integrations.

---

## 🚀 Key Features & Architectural Highlights

### 1. Hardened Authentication & Authorization
- **Dual-Channel Registration**:
  - Direct Email verification via strict SMTP OTP with active DNS MX domain validation.
  - WhatsApp-first registration via OTP delivered over the official Fonnte WhatsApp Gateway.
- **Dual-Channel Login**: Seamless authentication with either registered email address or phone number.
- **Timing-Attack Resilience**:
  - Decoy cryptographic hashing cycles executed when requested accounts are non-existent to equalize response latency.
  - Constant-time OTP comparisons using Node.js native `crypto.timingSafeEqual`.
- **Brute-Force & Denial-of-Service Defense**:
  - `authLimiter`: Strict rate limits on authentication endpoints (5 requests / 15 minutes per IP).
  - `generalLimiter`: Anti-flooding rate limiter across all public API routes (100 requests / 15 minutes per IP).
  - `helmet`: Comprehensive HTTP response header hardening (CSP, HSTS, X-Frame-Options).
  - `hpp` & `express-mongo-sanitize`: Defense against HTTP parameter pollution and injection patterns.

### 2. Multi-Worker & Cluster-Resilient Password Recovery
- **Anti User-Enumeration**: Consistent generic response messages and synthetic random micro-delays prevent attackers from discovering registered customer emails or phone numbers.
- **PostgreSQL Session Store**: OTP challenges and single-use password reset tokens are persisted in the `password_reset_sessions` table, eliminating in-memory state fragmentation across Node.js cluster workers or multi-instance load-balancers without requiring sticky sessions.
- **Single-Use Cryptographic Tokens**: Reset tokens are generated with 32-byte cryptographically secure random values and marked consumed immediately upon use, preventing replay attacks.

### 3. Database Indexing & High-Throughput Performance
Optimized with dedicated B-Tree indexes across primary query and filter pathways:
- `users`: Unique B-Tree index on `email`, index on `phone`.
- `products`: Index on `isActive`, `categoryId`, composite index `[categoryId, isActive]`, and ordering index `createdAt`.
- `product_variants`: Composite index `[productId, isActive, deletedAt]`.
- `orders`: High-cardinality foreign key & status indexes on `userId`, `status`, and `paymentStatus`.
- `password_reset_sessions`: Fast lookup indexes on `[identifier, channel]`, unique index on `resetToken`, and cleanup index on `expiresAt`.

### 4. Financial Integrity & Atomic Order Processing
- **Server-Authoritative Computations**: Item pricing, variant adjustments, tiered shipping rates, and order totals are calculated and validated strictly on the server. Client-submitted prices are rejected.
- **Atomic Stock Management**: Inventory deductions during order creation and stock restorations upon cancellation or expiration are executed inside isolated Prisma transactions (`prisma.$transaction`).
- **Midtrans Payment Gateway**: Seamless integration supporting Snap checkout, GoPay, QRIS, and Virtual Accounts (BCA, BNI, BRI, Mandiri, Permata) with SHA-512 webhook signature verification.

### 5. Dynamic Logistics & Shipping
- **Live Courier Tracking**: BinderByte API integration featuring an in-memory LRU cache (15-minute TTL) to safeguard API rate quotas and provide sub-millisecond status responses.
- **Postal Code Lookup**: Rapid subdistrict and postal code validation with a 24-hour LRU caching layer.
- **Tiered Shipping Fee Engine**: Weight-based matrix supporting JNE, J&T, SiCepat, and Pos Indonesia, with automatic fallback when regional pricing tables adjust.

---

## ⏱️ Autonomous Background Crons

The Express application initializes three isolated background schedulers on server boot:
1. **Order Expiry Cron** (`orderExpiryService.js`): Executes every 60 seconds to detect unpaid pending orders exceeding their 24-hour payment window, marks them as cancelled, and atomically restores reserved product stock.
2. **Order Auto-Completion Cron** (`orderAutoCompleteService.js`): Runs every 5 minutes to automatically transition delivered shipments to `COMPLETED` status after their customer confirmation window closes.
3. **Session & Auth Cleanup Cron** (`otpService.js`): Runs every hour to clean up expired reset sessions and orphaned verification OTP records, preventing database bloat.

---

## 🛠️ Technology Stack & Dependencies

- **Runtime**: Node.js (v18.16.0+)
- **Framework**: Express.js 4.21+ (ES Modules)
- **Database**: PostgreSQL 14+
- **ORM**: Prisma Client v5.22+
- **Security & Crypto**: `bcrypt`, `crypto`, `helmet`, `hpp`, `express-rate-limit`, `cookie-parser`, `jsonwebtoken`
- **File & Media Storage**: Supabase Cloud Storage with local disk fallback
- **Messaging & Notifications**:
  - WhatsApp: Fonnte API (with simulated mode for offline local development)
  - Email: Nodemailer via Gmail SMTP (with simulated fallback mode)
- **Payment Processing**: Midtrans Client SDK

---

## 📋 Environment Configuration (`.env`)

Create or update your `.env` file in the `backend/` directory:

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/toko_usaha_anda?schema=public"

# Authentication & Security
JWT_SECRET="your-super-secure-jwt-secret-key-at-least-32-chars"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000,http://localhost:3001"

# Supabase Storage (Product Image Uploads)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="product-images"

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY="Mid-server-xxxx"
MIDTRANS_CLIENT_KEY="Mid-client-xxxx"
MIDTRANS_IS_PRODUCTION=false

# Courier Tracking API (https://binderbyte.com)
BINDERBYTE_API_KEY="your-binderbyte-api-key"

# WhatsApp OTP Gateway (https://fonnte.com)
FONNTE_TOKEN="your-fonnte-token"

# Email SMTP OTP Service (Gmail App Password)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="your-email@gmail.com"
```

---

## 🗄️ Database Setup & Migrations

```bash
# Push Prisma schema definitions directly to PostgreSQL
npm run prisma:push

# Generate or update Prisma Client types
npm run prisma:generate

# (Optional) Launch Prisma Studio visual database editor
npm run prisma:studio

# (Optional) Seed initial product catalog
npm run prisma:seed
```

---

## 📡 RESTful API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/register` | Register new account (Email or WhatsApp channel) | Rate Limited |
| `POST` | `/login` | Authenticate customer with Email or WhatsApp number | Rate Limited |
| `POST` | `/logout` | Log out user and clear secure HTTP-only cookies | Public |
| `GET` | `/me` | Retrieve profile data of the authenticated user | Authenticated |
| `PUT` | `/profile` | Update profile information and serialized delivery address | Authenticated |
| `POST` | `/forgot-password` | Request password reset verification code | Rate Limited |
| `POST` | `/verify-reset-otp` | Verify reset code and receive single-use `resetToken` | Rate Limited |
| `POST` | `/reset-password` | Set new password using verified `resetToken` | Rate Limited |
| `POST` | `/send-email-otp` | Send registration verification code to target email | Rate Limited |
| `POST` | `/send-register-wa-otp`| Send registration OTP via WhatsApp | Rate Limited |

### Products & Categories (`/api/products`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Paginated product listing with search and category filtering | Public |
| `GET` | `/:id` | Detailed product view including variant matrices | Public |
| `GET` | `/featured` | Curated bestsellers and promotional featured products | Public |
| `GET` | `/categories` | Official catalog product categories | Public |
| `POST` | `/` | Create new product and associated variants | Admin |
| `PUT` | `/:id` | Update product details, pricing, and variant stocks | Admin |
| `DELETE` | `/:id` | Soft delete or archive product | Admin |

### Cart (`/api/cart`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/` | Fetch all cart items for active customer session | Authenticated |
| `POST` | `/` | Add product variant to cart | Authenticated |
| `PUT` | `/:id` | Update item quantity in cart | Authenticated |
| `DELETE` | `/:id` | Remove specific item from cart | Authenticated |
| `DELETE` | `/` | Clear entire shopping cart | Authenticated |

### Orders & Checkout (`/api/orders`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/` | Create new order from selected cart items (Server-Authoritative) | Authenticated |
| `GET` | `/` | Retrieve order history for authenticated customer | Authenticated |
| `GET` | `/:id` | Detailed order summary, item list, and shipping details | Authenticated |
| `PUT` | `/:id/status` | Update fulfillment or shipping status | Admin |

### Payments & Webhooks (`/api/payment` & `/api/webhook`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/payment/create-transaction` | Generate Midtrans Snap payment token | Authenticated |
| `POST` | `/webhook/midtrans` | Handle Midtrans webhook status updates (SHA-512 verified) | Public (Signed) |

---

## 🏃 Running the Server

```bash
# Development mode with Nodemon live reloading
npm run dev

# Production execution
npm start
```
By default, the server initializes on `http://localhost:5000`.
