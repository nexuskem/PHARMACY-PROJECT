# Database Tables - MediCare Pharmacy

## Total Tables: **6**

### 1. **users**
Stores user accounts (patients and pharmacists/doctors)
- `id` - Primary key
- `patient_id` - Unique patient identifier
- `pharmacist_id` - Unique pharmacist/doctor identifier
- `email` - Optional email address
- `password` - Hashed password
- `firstName`, `lastName` - User name
- `phone` - Optional phone number
- `role` - User role ('patient' or 'pharmacist')
- `createdAt` - Registration timestamp

### 2. **products**
Stores pharmacy products (prescription and OTC medications)
- `id` - Primary key
- `name` - Product name
- `description` - Product description
- `price` - Product price
- `category` - Product category
- `icon` - Display icon
- `requiresApproval` - Whether pharmacist approval is needed
- `stock` - Available stock quantity
- `createdAt` - Creation timestamp

### 3. **cart_items**
Stores items in user shopping carts
- `id` - Primary key
- `user_id` - Foreign key to users table
- `product_id` - Foreign key to products table
- `quantity` - Item quantity
- `createdAt` - Added to cart timestamp

### 4. **orders**
Stores order information
- `id` - Primary key
- `user_id` - Foreign key to users table
- `order_number` - Unique order number
- `total` - Order total amount
- `status` - Order status (pending, approved, rejected, completed)
- `requiresApproval` - Whether order needs pharmacist approval
- `approvedBy` - Foreign key to users table (pharmacist who approved)
- `approvedAt` - Approval timestamp
- `createdAt` - Order creation timestamp

### 5. **order_items**
Stores individual items within orders
- `id` - Primary key
- `order_id` - Foreign key to orders table
- `product_id` - Foreign key to products table
- `quantity` - Item quantity in order
- `price` - Price at time of order

### 6. **appointments**
Stores pharmacist appointment bookings
- `id` - Primary key
- `user_id` - Foreign key to users table (patient)
- `date` - Appointment date
- `time` - Appointment time
- `reason` - Appointment reason/notes
- `status` - Appointment status (scheduled, cancelled, completed)
- `createdAt` - Booking timestamp

---

## Relationships

```
users
  ├── cart_items (user_id)
  ├── orders (user_id)
  ├── appointments (user_id)
  └── orders.approvedBy (approvedBy)

products
  ├── cart_items (product_id)
  ├── order_items (product_id)
  └── (stock management)

orders
  └── order_items (order_id)
```

---

## Indexes

For better query performance, indexes are created on:
- `users.email`
- `users.patient_id`
- `users.pharmacist_id`
- `products.category`
- `orders.user_id`
- `orders.status`
- `order_items.order_id`
- `cart_items.user_id`
- `appointments.user_id`
- `appointments.date`

---

## Summary

**Total: 6 Tables**
1. users
2. products
3. cart_items
4. orders
5. order_items
6. appointments




