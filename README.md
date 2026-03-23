# ZaykaPOS Backend

Modular Node.js backend with two independent services sharing database models and configuration.

## Architecture

```
backend/
├── config/             ← Shared configuration (env, database, app)
├── modules/
│   ├── config/         ← Module-level configuration
│   └── models/         ← Shared Sequelize models (User, Product, Order, Table)
├── scripts/            ← Utility scripts (seed, migrate, cleanup)
└── services/
    ├── backend/        ← REST API server  → http://localhost:5000
    └── admin/          ← AdminJS panel    → http://localhost:7000/admin
```

## Prerequisites

- Node.js ≥ 18
- MySQL 8+ (or MariaDB)

## Setup

### 1. Create the database

```sql
CREATE DATABASE zayka_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and set DB_PASSWORD and a strong JWT_SECRET
```

### 3. Install dependencies

```bash
# Root (scripts)
npm install

# Backend API service
cd services/backend && npm install && cd ../..

# Admin service
cd services/admin && npm install && cd ../..
```

### 4. Run migrations & seed

```bash
npm run migrate        # Create tables
npm run seed           # Populate sample data (resets tables!)
```

## Running the Services

```bash
# Development (both services with hot-reload)
npm run dev

# Production
npm start

# Individual services
npm run dev:api        # Backend API only
npm run dev:admin      # Admin panel only
```

## Services

| Service    | URL                                | Description              |
|------------|------------------------------------|--------------------------|
| Backend API | http://localhost:5000              | REST API for frontend    |
| Admin Panel | http://localhost:7000/admin        | AdminJS dashboard        |
| API Health  | http://localhost:5000/health       | Health check             |
| Admin Health| http://localhost:7000/health       | Health check             |

## API Endpoints

### Auth
| Method | Endpoint              | Auth | Description           |
|--------|-----------------------|------|-----------------------|
| POST   | /api/auth/login       | —    | Login, get JWT token  |
| POST   | /api/auth/register    | —    | Register new user     |
| GET    | /api/auth/profile     | JWT  | Get current user      |
| POST   | /api/auth/logout      | JWT  | Logout                |

### Products
| Method | Endpoint              | Auth          | Description       |
|--------|-----------------------|---------------|-------------------|
| GET    | /api/products         | —             | List products     |
| GET    | /api/products/:id     | —             | Get product       |
| POST   | /api/products         | admin/manager | Create product    |
| PUT    | /api/products/:id     | admin/manager | Update product    |
| DELETE | /api/products/:id     | admin         | Delete product    |

### Orders
| Method | Endpoint                   | Auth          | Description          |
|--------|----------------------------|---------------|----------------------|
| GET    | /api/orders                | JWT           | List orders          |
| GET    | /api/orders/:id            | JWT           | Get order            |
| POST   | /api/orders                | JWT           | Create order         |
| PATCH  | /api/orders/:id/status     | JWT           | Update order status  |
| PATCH  | /api/orders/:id/payment    | admin/manager | Update payment info  |
| DELETE | /api/orders/:id            | admin/manager | Delete order         |

### Tables
| Method | Endpoint              | Auth          | Description    |
|--------|-----------------------|---------------|----------------|
| GET    | /api/tables           | —             | List tables    |
| GET    | /api/tables/:id       | —             | Get table      |
| POST   | /api/tables           | admin/manager | Create table   |
| PUT    | /api/tables/:id       | admin/manager | Update table   |
| DELETE | /api/tables/:id       | admin         | Delete table   |

### Analytics
| Method | Endpoint                      | Auth          | Description          |
|--------|-------------------------------|---------------|----------------------|
| GET    | /api/analytics/dashboard      | admin/manager | Dashboard summary    |
| GET    | /api/analytics/revenue?days=7 | admin/manager | Revenue by date      |
| GET    | /api/analytics/top-products   | admin/manager | Top selling products |

## Default Credentials (after seed)

| Role    | Email                 | Password     |
|---------|-----------------------|--------------|
| Admin   | admin@zayka.com       | admin123     |
| Manager | manager@zayka.com     | manager123   |
| Staff   | staff@zayka.com       | staff123     |

> **Change all passwords before deploying to production.**

## Scripts

```bash
npm run seed            # Reset DB & insert sample data
npm run migrate         # Safe sync (new tables/columns only)
npm run migrate:alter   # Alter tables to match models
npm run migrate:force   # Drop and recreate all tables (DATA LOSS)
npm run cleanup         # Remove stale data and fix table statuses
```

## Tech Stack

- **Framework**: Express.js
- **ORM**: Sequelize v6 + MySQL2
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Admin**: AdminJS v6 with @adminjs/sequelize
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit
