# Toko Usaha Anda — Modern E-Commerce Platform & Monorepo

The official repository for **Toko Usaha Anda** — a production-ready, full-stack e-commerce ecosystem designed with modern aesthetics inspired by minimalist Scandinavian & Nike design principles. The platform specializes in quality home goods, professional hardware tools, and automotive accessories.

---

## 🏗️ Architecture & Monorepo Structure

```
Landing Page Toko/
├── backend/                  # RESTful API Server (Node.js, Express, PostgreSQL, Prisma)
├── frontend/
│   ├── shop/                 # Consumer E-Commerce Storefront (React 18, Vite, Tailwind CSS, Zustand)
│   ├── landing/              # High-Conversion Brand Showcase & Landing Page (React 18, Vite, Tailwind CSS)
│   └── admin/                # Merchant Back-Office Dashboard (React 18, Vite, Tailwind CSS)
└── README.md                 # Root Monorepo Documentation
```

---

## 🌟 Applications & Key Modules

### 1. `backend/` — RESTful API Engine
- **Runtime & Framework**: Node.js + Express.js (ESM modules).
- **Persistence Layer**: PostgreSQL with Prisma ORM v5.22+.
- **Enterprise-Grade Security**:
  - Dual-channel user authentication (Email OTP with DNS MX verification & WhatsApp OTP via Fonnte).
  - Cluster & multi-instance safe password reset flow backed by PostgreSQL tables (prevents distributed worker desync).
  - Anti-brute force rate limiting (`authLimiter` and `generalLimiter`), Helmet headers, HPP, and NoSQL/XSS sanitization.
  - Constant-time cryptographic token matching (`crypto.timingSafeEqual`) and decoy bcrypt cycles against timing attacks.
  - High-performance B-Tree database indexes on hot query paths.
- **Autonomous Background Crons**:
  - **Order Expiry Cron**: Runs every 60s to automatically cancel unfulfilled pending orders older than 24 hours and atomic-restock inventory.
  - **Order Auto-Completion Cron**: Runs every 5 minutes to mark delivered orders as completed.
  - **Auth Garbage Collector**: Runs hourly to purge expired OTP verification entries and password reset sessions.
- **Third-Party Integrations**:
  - **Midtrans**: Payment Gateway (Snap token, GoPay, QRIS, BCA/BNI/BRI/Mandiri/Permata Virtual Accounts).
  - **RajaOngkir & Fallback**: Tiered shipping rate calculation with automated failover.
  - **BinderByte**: Real-time multi-courier tracking (JNE, J&T, SiCepat, Pos, etc.) with LRU caching.
  - **Supabase Cloud Storage & Local Fallback**: Dynamic image asset persistence.
- 📖 *For deeper technical details, refer to [backend/README.md](file:///c:/Cursor-Project/Landing%20Page%20Toko/backend/README.md).*

### 2. `frontend/shop/` — Consumer Web Storefront
- **Tech Stack**: React 18, Vite, Tailwind CSS, Zustand.
- **Features**:
  - **Curated Catalog**: Filter products across official categories (*Kebutuhan Rumah Tangga*, *Perkakas Tukang*, *Alat-Alat Motor*).
  - **Interactive Product Matrix**: Dynamic price, weight, and stock updates according to active variant combinations.
  - **Smart Cart Synchronization**: Real-time cross-tab state syncing, selective item checkout, and persistent recovery across customer logins.
  - **Adaptive Checkout**:
    - Automated postal code & subdistrict location lookup.
    - Server-authoritative shipping fee computation with seamless auto-retry if weight/courier changes occur mid-flow.
    - Embedded Midtrans Snap payment gateway with direct status reconciliation.
  - **Order Tracking & Reviews**: Live delivery tracking status, itemized invoice summaries, and verified customer review modals.
  - **Self-Service Account Management**: Multi-step password reset via WhatsApp or Email OTP.

### 3. `frontend/landing/` — Promotional Showcase
- **Tech Stack**: React 18, Vite, Tailwind CSS.
- **Features**:
  - High-impact Hero section with direct category deep-links to the storefront.
  - Best-seller product showcases with fluid responsive grids.
  - Direct inquiry and contact form integrated with the backend database.
  - Interactive store location map.

### 4. `frontend/admin/` — Merchant Back-Office
- **Tech Stack**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Features**:
  - Product & multi-variant inventory CRUD with image upload capabilities.
  - Order fulfillment pipeline management (status transitions: pending, processing, shipped, delivered, cancelled).
  - Real-time customer review moderation.

---

## 🚀 Local Development Setup

### System Prerequisites
- **Node.js**: v18.16.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Package Manager**: npm or yarn

---

### Step 1: Start the Backend API
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and adjust credentials
cp .env.example .env

# Push Prisma schema to your PostgreSQL database
npm run prisma:push

# (Optional) Seed initial product catalog & categories
npm run prisma:seed

# Start the development server with live reload
npm run dev
```
The API server will listen on `http://localhost:5000`.

---

### Step 2: Start the Shop Front-End
```bash
# Open a new terminal tab and navigate to shop
cd frontend/shop

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The shop storefront will run on `http://localhost:3001` (or next available port).

---

### Step 3: Start the Landing Page (Optional)
```bash
cd frontend/landing
npm install
npm run dev
```
The landing page will run on `http://localhost:3000`.

---

## 🔒 Security Policies & Quality Standards

This application is built for real-world production environments where financial integrity and user data privacy are critical:

1. **Server-Authoritative Pricing**:
   Item prices, variant surcharges, shipping costs, and grand totals are calculated and validated exclusively on the server. Client-submitted prices are rejected outright.
2. **Atomic Inventory Transactions**:
   Stock deductions during order creation and stock restorations upon cancellation are wrapped in atomic database transactions (`prisma.$transaction`), preventing race conditions and over-selling.
3. **Cluster & Load-Balancer Safety**:
   Session states, OTP limits, and password recovery tokens reside in PostgreSQL rather than single-process memory, allowing seamless scaling behind multi-worker clusters and Nginx reverse proxies.
4. **Resilient Offline Cleanup**:
   Client-side session tokens and cart records are sanitized securely upon logout even under transient network interruptions.

---

## 📜 License
Copyright © Toko Usaha Anda. All Rights Reserved.
