# GreenReceipt Backend (MongoDB + Node.js)

## Getting Started

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the backend server:**
   ```bash
   npm start
   ```
   The server will run on port 5000 by default.

3. **Environment**
   - MongoDB connection is set in `server.js` (already using your cluster string).

## API Endpoints

- **Profile**
  - `GET /api/profile/:businessId` - Get business profile
  - `POST /api/profile` - Create/update business profile
- **Customers**
  - `GET /api/customers/:businessId` - Get all customers
  - `POST /api/customers` - Add customer
  - `PUT /api/customers/:id` - Update customer
  - `DELETE /api/customers/:id` - Delete customer
- **Products**
  - `GET /api/products/:businessId` - Get all products
  - `POST /api/products` - Add product
  - `PUT /api/products/:id` - Update product
  - `DELETE /api/products/:id` - Delete product
- **Receipts**
  - `GET /api/receipts/:businessId` - Get all receipts
  - `POST /api/receipts` - Add receipt

---

- Update your React frontend to use these endpoints instead of Supabase.
- If you need help updating the frontend, let me know!
