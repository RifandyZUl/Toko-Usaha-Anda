# 🗄️ Backend API - Toko Usaha Anda

Backend API untuk e-commerce menggunakan Node.js, Express, PostgreSQL, dan Prisma.

## 🛠️ Tech Stack

- **Node.js** + **Express** - Backend framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

1. **Node.js** (v18 atau lebih baru)
2. **PostgreSQL** (v14 atau lebih baru)
3. **npm** atau **yarn**

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

Buat database PostgreSQL:

```sql
CREATE DATABASE toko_usaha_anda;
```

### 3. Configure Environment Variables

Copy `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Edit `.env` dan sesuaikan:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/toko_usaha_anda?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000,http://localhost:3001"
```

### 4. Generate Prisma Client

```bash
npm run prisma:generate
```

### 5. Run Migrations

```bash
npm run prisma:migrate
```

### 6. Seed Database (Optional)

```bash
npm run prisma:seed
```

Ini akan membuat:

- Admin user: `admin@toko.com` / `admin123`
- Sample categories dan products

### 7. Start Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:5000`

## 📡 API Endpoints

### Health Check

- `GET /api/health` - Check server status

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Products

- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/categories` - Get all categories
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Cart

- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart` - Add to cart (requires auth)
- `PUT /api/cart/:id` - Update cart item (requires auth)
- `DELETE /api/cart/:id` - Remove from cart (requires auth)
- `DELETE /api/cart` - Clear cart (requires auth)

### Orders

- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders` - Get user orders (requires auth)
- `GET /api/orders/:id` - Get order by ID (requires auth)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

## 🔐 Authentication

Gunakan JWT token di header:

```
Authorization: Bearer <token>
```

## 🗄️ Database Schema

Lihat `prisma/schema.prisma` untuk detail schema.

Models:

- **User** - User accounts
- **Category** - Product categories
- **Product** - Products
- **CartItem** - Shopping cart items
- **Order** - Orders
- **OrderItem** - Order items

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server with nodemon

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (GUI)

# Production
npm start                # Start production server
```

## 📝 Notes

- Default admin: `admin@toko.com` / `admin123` (setelah seed)
- JWT token expires in 7 days (default)
- CORS enabled for localhost:3000 and localhost:3001
