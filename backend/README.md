# MediCare Pharmacy Backend API

Backend API server for the MediCare Pharmacy application built with **pure Node.js** (no frameworks), using only native Node.js modules and MySQL.

## Features

- 🔐 User authentication (JWT-based)
- 📦 Product management
- 🛒 Shopping cart functionality
- 📋 Order management
- 📅 Appointment booking
- 👨‍⚕️ Pharmacist approval system

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Technology Stack

- **Pure Node.js** - Using only native `http` module (no Express or other frameworks)
- **MySQL** - Relational database (using mysql2)
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up MySQL database:
   - Install MySQL if not already installed
   - Create a database (or use the default name `medicare_pharmacy`)
   - The server will automatically create the database and tables on first run

4. Configure environment variables (optional):
   Create a `.env` file or set environment variables:
   - `PORT` (default: 3000)
   - `JWT_SECRET` (default: 'your-secret-key-change-this-in-production')
   - `NODE_ENV` (default: 'development')
   - `DB_HOST` (default: 'localhost')
   - `DB_USER` (default: 'root')
   - `DB_PASSWORD` (default: '')
   - `DB_NAME` (default: 'medicare_pharmacy')

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Products
- `GET /api/products` - Get all products (supports `?category=` and `?search=` query params)
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories/list` - Get all categories

### Cart (requires authentication)
- `GET /api/cart` - Get user's cart items
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update/:id` - Update cart item quantity
- `DELETE /api/cart/remove/:id` - Remove item from cart
- `DELETE /api/cart/clear` - Clear entire cart

### Orders (requires authentication)
- `POST /api/orders/create` - Create order from cart
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details

### Appointments (requires authentication)
- `POST /api/appointments/book` - Book an appointment
- `GET /api/appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get appointment details
- `PUT /api/appointments/:id/cancel` - Cancel appointment

### Pharmacist (requires pharmacist role)
- `GET /api/pharmacist/orders/pending` - Get pending orders
- `GET /api/pharmacist/orders/:id` - Get order details
- `PUT /api/pharmacist/orders/:id/approve` - Approve order
- `PUT /api/pharmacist/orders/:id/reject` - Reject order
- `GET /api/pharmacist/appointments` - Get all appointments

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Database

The application uses MySQL database. The database and tables are automatically created and initialized on first run with:
- Users table
- Products table (pre-seeded with sample products)
- Cart items table
- Orders table
- Order items table
- Appointments table

**Prerequisites:**
- MySQL server must be installed and running
- User must have CREATE DATABASE privileges (for initial setup)
- Database credentials can be configured via environment variables

## Creating a Pharmacist Account

To create a pharmacist account, you can either:
1. Manually update the database to set a user's role to 'pharmacist'
2. Use a database tool to insert a pharmacist user
3. Modify the registration endpoint temporarily to allow role selection

Example SQL:
```sql
UPDATE users SET role = 'pharmacist' WHERE email = 'pharmacist@example.com';
```

## API Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error message"
}
```

## Health Check

Check if the API is running:
```
GET /api/health
```

## Development

The database is automatically created on first run. To reset the database:
1. Drop the database: `DROP DATABASE medicare_pharmacy;`
2. Restart the server (it will recreate the database and tables)

## Notes

- **No frameworks** - Built with pure Node.js using only native modules
- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- The database is automatically seeded with sample products on first run
- CORS is enabled for all origins (configure in production)
- Custom router implementation handles routing and middleware


