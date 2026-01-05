# Quick Setup Guide

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Set Up MySQL

Make sure MySQL is installed and running on your system.

The server will automatically create the database and tables on first run. You can configure database connection via environment variables:

- `DB_HOST` (default: 'localhost')
- `DB_USER` (default: 'root')
- `DB_PASSWORD` (default: '')
- `DB_NAME` (default: 'medicare_pharmacy')

## 3. Configure Environment (Optional)

The server works with default values, but you can create a `.env` file to customize:
- `PORT` (default: 3000)
- `JWT_SECRET` (default: 'your-secret-key-change-this-in-production')
- `NODE_ENV` (default: 'development')
- Database variables (see above)

## 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 5. Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Get products
curl http://localhost:3000/api/products
```

## 6. Create a Pharmacist Account (Optional)

To test the pharmacist features, create a pharmacist account:

```bash
node scripts/create-pharmacist.js pharmacist@example.com password123 John Doe
```

This will create a pharmacist account that can approve/reject orders.

## Database

The MySQL database will be automatically created on first run. It includes:
- Pre-seeded products from your frontend data
- Empty tables for users, orders, cart, and appointments

**Note:** Make sure MySQL server is running before starting the backend server.

## Next Steps

1. Update your frontend JavaScript files to call the API endpoints instead of using localStorage
2. Replace mock authentication with API calls to `/api/auth/login` and `/api/auth/register`
3. Update cart functionality to use `/api/cart` endpoints
4. Connect order creation to `/api/orders/create`
5. Link appointment booking to `/api/appointments/book`

## Architecture

This backend uses **pure Node.js** with no frameworks:
- Native `http` module for the server
- Custom router implementation for routing
- Native middleware system
- Only utility libraries: mysql2, bcryptjs, jsonwebtoken

## API Base URL

All API endpoints are prefixed with `/api`:

- Base URL: `http://localhost:3000/api`
- Example: `http://localhost:3000/api/products`

## Authentication

After registering or logging in, you'll receive a JWT token. Include it in requests:

```
Authorization: Bearer <your-token>
```

Example with curl:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/cart
```


