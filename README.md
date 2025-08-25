# E-Commerce API

A comprehensive RESTful API for managing an e-commerce platform, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Product Management** - Categories, subcategories, brands, and products with full CRUD operations
- **User Authentication** - Secure JWT-based authentication and authorization
- **Shopping Cart** - Complete cart management with coupon support
- **Order Processing** - Full order lifecycle management
- **Payment Integration** - Stripe payment processing
- **Reviews & Ratings** - Product review system
- **Inventory Management** - Stock tracking and alerts
- **Admin Dashboard** - Statistics and administrative tools

## 📖 API Documentation

**Interactive API Documentation:** Access the complete API documentation with examples and testing capabilities:

- **Development:** `http://localhost:8000/api-docs`
- **Swagger UI:** Full interactive documentation with all endpoints, schemas, and examples

## 🛠️ Quick Start

### Prerequisites

- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ecommerce-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp config.env.example config.env
   # Edit config.env with your configuration
   ```

4. **Start the server**
   ```bash
   npm start
   ```

The API will be running at `http://localhost:8000/api/v1`

## 🏗️ Project Structure

```
├── controllers/    # Request handlers
├── models/         # Database models
├── routes/         # API routes
├── middlewares/    # Custom middleware
├── utils/          # Utility functions
├── docs/           # API documentation
└── uploads/        # File uploads
```

## 🔧 Environment Variables

Key environment variables (see `config.env.example`):

## 📚 API Overview

The API provides endpoints for:

- **Authentication** - Signup, signin, password reset
- **Products** - Product catalog management
- **Categories & Brands** - Organizational structure
- **Cart & Orders** - Shopping and purchase flow
- **Payments** - Stripe integration
- **Reviews** - Product ratings and reviews
- **Users** - Profile management
- **Admin** - Administrative functions

For detailed endpoint documentation, visit `/api-docs` when the server is running.

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS configuration
- File upload restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
